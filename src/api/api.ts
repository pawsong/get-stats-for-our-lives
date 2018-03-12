import {CrossDomainAPIs, CrossDomainMessage} from "../types/cross-domain-apis";
import {StatsForOurLives, MarchForOurLivesEvent} from "../types";

type Handler<RESPONSE> = (response: RESPONSE) => any;

const handlers = new Map<string, {success: Handler<any>, failure: Handler<any>}>();
let uniqueRequenstIndex = 0;
let uniquishString =
  "And the NRA would have gotten away with it too if it hadn't been for those meddling youngsters.";

function onMessage(this: Window, event: WindowEventMap["message"]) {
  if (event.data === "MFOL_IFRAME_READY") {
    // The iframe just let us know that it's ready to receive requests
    callWhenIframeIsReady();
    return;
  }
  const data: CrossDomainAPIs.Responses = event.data;
  if ("name" in data && "uniqueRequestId" in data && handlers.has(data.uniqueRequestId)) {
    const {success, failure} = handlers.get(data.uniqueRequestId) || {success: ()=>undefined, failure: () => undefined};
    // This appears to be a correctly formatted CrossDomainAPI response
    if ("payload" in data) {
      // Success case where payload is returned
      const message = data as CrossDomainMessage & {payload: any};
      success(message.payload);
    } else {
      const error = data.error;
      const e = new Error(data.error.body);
      Object.assign(e, {statusCode: error.code});
      failure(e)
    }
  }
}

window.addEventListener("message", onMessage);

function sendRequestFactory<API extends CrossDomainAPIs.WithoutPayload>(
  origin: string,
  name: CrossDomainAPIs.MethodName<API>
): () => Promise<CrossDomainAPIs.ResponsePayload<API>>;
function sendRequestFactory<API extends CrossDomainAPIs.WithPayload>(
  origin: string,
  name: CrossDomainAPIs.MethodName<API>
): (payload: CrossDomainAPIs.RequestPayload<API>) => Promise<CrossDomainAPIs.ResponsePayload<API>>;
function sendRequestFactory<API extends CrossDomainAPIs>(
  origin: string,
  name: CrossDomainAPIs.MethodName<API>
):
  (payload: CrossDomainAPIs.RequestPayload<API>) => Promise<CrossDomainAPIs.ResponsePayload<API>>
 {
    return async (payload: CrossDomainAPIs.RequestPayload<API>): Promise<CrossDomainAPIs.ResponsePayload<API>> => {
      // Do not send any postMessages until the iframe has been loaded and is listening
      await iframeIsReady;

      const uniqueRequestId = uniquishString + (uniqueRequenstIndex++).toString();
      const promise = new Promise<CrossDomainAPIs.ResponsePayload<API>>( (resolve, reject) => {
        handlers.set(uniqueRequestId, {success: resolve, failure: reject});
      });
      window.postMessage({
        name,
        uniqueRequestId,
        payload,
      }, origin);

      return await promise;
    }
}

let iframeIsReady: Promise<void>;
let callWhenIframeIsReady: () => any;

/**
 * Store the iframe element used to route messages through the server.
 * Created globally to ensure we only create the iframe and attach it to the
 * document body once.
 */
let iframe: HTMLIFrameElement;

/**
 * Create a cross-domain API to March for Our Lives data.
 * Returns promise-based functions that send requests to the server via
 * a post-message to an iframe, which in turn makes the HTTPS get request
 * to the server.  Using an iframe allows us to access the API from a website
 * at any URL (browser origin) without concern of interference by the
 * browser's same-origin policy.
 * 
 * @param iframeSrc The address of the iframe that hosts the API on the server
 */
export function getAPIs(iframeSrc: string) {
  if (!iframe) {
    // Create a promise that gets resolved when the iframe is ready.
    iframeIsReady = new Promise<void>( (resolve) => {callWhenIframeIsReady = resolve} );

    const iframe = new HTMLIFrameElement();
    iframe.hidden = true;
    iframe.height = "0px";
    iframe.width = "0px";
    iframe.src = iframeSrc;
    document.body.appendChild(iframe);
  }
  const getStatsForOurLives =
    sendRequestFactory<CrossDomainAPIs.GetStatsForOurLives>(
      iframeSrc,
      CrossDomainAPIs.Name.GetStatsForOurLives
    ) as () => Promise<StatsForOurLives>
  const getMarchForOurLivesEvents =
    sendRequestFactory<CrossDomainAPIs.GetMarchForOurLivesEvents>(
      iframeSrc,
      CrossDomainAPIs.Name.GetMarchForOurLivesEvents
    ) as () => Promise<MarchForOurLivesEvent[]>;
  const getNearestMarch =
    sendRequestFactory<CrossDomainAPIs.GetNearestMarch>(
      iframeSrc,
      CrossDomainAPIs.Name.GetNearestMarch
    );
  const apis = {
    getStatsForOurLives,
    getMarchForOurLivesEvents,
    getNearestMarch}
  return apis;
}
