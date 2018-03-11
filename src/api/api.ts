import {CrossDomainAPIs, CrossDomainMessage} from "../server/cross-domain-apis";

import {StatsForOurLives} from "../server/stats-for-our-lives"
import {MarchForOurLivesEvent} from "../server/event";
type Handler<RESPONSE> = (response: RESPONSE) => any;

const handlers = new Map<string, {success: Handler<any>, failure: Handler<any>}>();
let uniqueRequenstIndex = 0;
let uniquishString =
  "And the NRA would have gotten away with it too if it hadn't been for those meddling youngsters.";

function onMessage(this: Window, event: WindowEventMap["message"]) {
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
  name: API["request"]["name"]
): () => Promise<CrossDomainAPIs.ResponsePayload<API>>;
function sendRequestFactory<API extends CrossDomainAPIs.WithPayload>(
  origin: string,
  name: API["request"]["name"]
): (payload: API["request"]["payload"]) => Promise<CrossDomainAPIs.ResponsePayload<API>>;
function sendRequestFactory<API extends CrossDomainAPIs>(
  origin: string,
  name: API["request"]["name"]
):
  (payload: API["request"]["payload"]) => Promise<CrossDomainAPIs.ResponsePayload<API>>
 {
    return (payload: API["request"]["payload"]): Promise<CrossDomainAPIs.ResponsePayload<API>> => {
      const uniqueRequestId = uniquishString + (uniqueRequenstIndex++).toString();
      const promise = new Promise<CrossDomainAPIs.ResponsePayload<API>>( (resolve, reject) => {
        handlers.set(uniqueRequestId, {success: resolve, failure: reject});
      });
      window.postMessage({
        name,
        uniqueRequestId,
        payload,
      }, origin);

      return promise;
    }
}

let iframe: HTMLIFrameElement;
export function getAPIs(iframeSrc: string) {
  if (!iframe) {
    const iframe = new HTMLIFrameElement();
    iframe.hidden = true;
    iframe.height = "0px";
    iframe.width = "0px";
    iframe.src = iframeSrc;
    document.body.appendChild(iframe);
  }
  
  const apis = {
    getStatsForOurLives:
      sendRequestFactory<CrossDomainAPIs.GetStatsForOurLives>(iframeSrc, CrossDomainAPIs.Name.GetStatsForOurLives) as
        () => Promise<StatsForOurLives>,
    getMarchForOurLivesEvents:
      sendRequestFactory<CrossDomainAPIs.GetMarchForOurLivesEvents>(iframeSrc, CrossDomainAPIs.Name.GetMarchForOurLivesEvents) as
        () => Promise<MarchForOurLivesEvent[]>,
    getNearestMarch: sendRequestFactory<CrossDomainAPIs.GetNearestMarch>(iframeSrc, CrossDomainAPIs.Name.GetNearestMarch),
  }
  return apis;
}
