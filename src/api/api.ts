import {CrossDomainAPIs, CrossDomainMessage} from "../server/cross-domain-apis";

import {StatsForOurLives} from "../server/stats-for-our-lives"
import {MarchForOurLivesEvent} from "../server/event";
type Handler<RESPONSE> = (response: RESPONSE) => any;

const handlers = new Map<string, Handler<any>>();
let uniqueRequenstIndex = 0;
let uniquishString =
  "And the NRA would have gotten away with it too if it hadn't been for those meddling youngsters.";

const iframe = new HTMLIFrameElement();
iframe.hidden = true;
iframe.height = "0px";
iframe.width = "0px";
iframe.src = `http://fixme/`;
document.body.appendChild(iframe);
const origin = `http:///`;

function onMessage(this: Window, event: WindowEventMap["message"]) {
  const {data} = event;
  if ("type" in data && "uniqueRequestId" in data && "payload" in data) {
    const message = data as CrossDomainMessage & {payload: any};
    if (handlers.has(message.uniqueRequestId)) {
      const handler = handlers.get(message.uniqueRequestId);
      if (handler) {
        handler(message.payload);
      }
    }
  }
}

window.addEventListener("message", onMessage);

function sendRequestFactory<API extends CrossDomainAPIs.WithoutPayload>(
  name: API["request"]["name"]
): () => Promise<API["response"]["payload"]>;
function sendRequestFactory<API extends CrossDomainAPIs.WithPayload>(
  name: API["request"]["name"]
): (payload: API["request"]["payload"]) => Promise<API["response"]["payload"]>;
function sendRequestFactory<API extends CrossDomainAPIs>(name: API["request"]["name"]):
  (payload: API["request"]["payload"]) => Promise<API["response"]["payload"]>
 {
    return (payload: API["request"]["payload"]): Promise<API["response"]["payload"]> => {
      const uniqueRequestId = uniquishString + (uniqueRequenstIndex++).toString();
      const promise = new Promise<API["response"]["payload"]>( (resolve ) => {
        handlers.set(uniqueRequestId, resolve);
      });
      window.postMessage({
        name,
        uniqueRequestId,
        payload,
      }, origin);

      return promise;
    }
}

export const getStatsForOurLives: () => Promise<StatsForOurLives> = 
  sendRequestFactory<CrossDomainAPIs.GetStatsForOurLives>(CrossDomainAPIs.Name.GetStatsForOurLives);

export const getMarchForOurLivesEvents: () => Promise<MarchForOurLivesEvent[]> =
  sendRequestFactory<CrossDomainAPIs.GetMarchForOurLivesEvents>(CrossDomainAPIs.Name.GetMarchForOurLivesEvents);

export const getNearestMarch =
  sendRequestFactory<CrossDomainAPIs.GetNearestMarch>(CrossDomainAPIs.Name.GetNearestMarch);
