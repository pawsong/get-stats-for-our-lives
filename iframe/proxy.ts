import {MarchForOurLivesEvent} from "../src/event";
import {StatsForOurLives} from "../src/stats-for-our-lives";
import {CrossDomainAPIs} from "./messages";

interface TypedMessageEvent<T> extends MessageEvent {
  data: T;
}

function getStatsForOurLives(
  event: TypedMessageEvent<CrossDomainAPIs.GetStatsForOurLives.Request>
) {
  var xhrequest = new XMLHttpRequest();
  const url = `https:/fixme/get-stats-for-our-lives`;
  xhrequest.onreadystatechange = function() {
    if (xhrequest.readyState == 4) {
      if (xhrequest.status == 200) {
        const response: CrossDomainAPIs.GetStatsForOurLives.Response = {
          ...event.data,
          request: (event.data && event.data.payload) || undefined,
          payload: JSON.parse(xhrequest.responseText) as StatsForOurLives
        };
        window.postMessage(response, event.origin);
      }
    }
  };
}

function getMarchForOurLivesEvents(
  event: TypedMessageEvent<CrossDomainAPIs.GetMarchForOurLivesEvents.Request>
) {
  var xhrequest = new XMLHttpRequest();
  const url = `https:/fixme/get-march-for-our-lives-events`;
  xhrequest.onreadystatechange = function() {
    if (xhrequest.readyState == 4) {
      if (xhrequest.status == 200) {
        const response: CrossDomainAPIs.GetMarchForOurLivesEvents.Response = {
          ...event.data,
          request: (event.data && event.data.payload) || undefined,
          payload: JSON.parse(xhrequest.responseText) as MarchForOurLivesEvent[]
        };
        window.postMessage(response, event.origin);
      }
    }
  };
}


function onMessage(this: Window, event: WindowEventMap["message"]) {
  const message = event.data as CrossDomainAPIs["request"];
  switch (message.name) {
    case CrossDomainAPIs.Name.GetMarchForOurLivesEvents:
      return getStatsForOurLives(event);
    case CrossDomainAPIs.Name.GetMarchForOurLivesEvents:
      return getMarchForOurLivesEvents(event);
    default:
      return;
  }
}

window.addEventListener("message", onMessage, false);