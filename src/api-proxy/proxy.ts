import {MarchForOurLivesEvent, StatsForOurLives, CrossDomainAPIs} from "../types";

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
  xhrequest.open('GET', url, true);
  xhrequest.send(null);
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
  xhrequest.open('GET', url, true);
  xhrequest.send(null);
}

function getNearestMarch(
  event: TypedMessageEvent<CrossDomainAPIs.GetNearestMarch.Request>
) {
  var xhrequest = new XMLHttpRequest();
  let url = `https:/fixme/get-march-for-our-lives-events?`;
  const requestPayload = event.data.payload;
  if ("zipCode" in requestPayload) {
    const {zipCode} = requestPayload;
    url += `zipCode=${encodeURIComponent(zipCode)}`;
  } else {
    const {latitude, longitude} = requestPayload;
    url += `latitude=${latitude}&longitude=${longitude}`;
  }
  xhrequest.onreadystatechange = function() {
    if (xhrequest.readyState == 4) {
      if (xhrequest.status == 200) {
        const response: CrossDomainAPIs.GetNearestMarch.Response = {
          ...event.data,
          request: (event.data && event.data.payload) || undefined,
          payload: JSON.parse(xhrequest.responseText) as MarchForOurLivesEvent[]
        };
        window.postMessage(response, event.origin);
      }
    }
  };
  xhrequest.open('GET', url, true);
  xhrequest.send(null);
}



function onMessage(this: Window, event: WindowEventMap["message"]) {
  const message = event.data as CrossDomainAPIs["request"];
  switch (message.name) {
    case CrossDomainAPIs.Name.GetStatsForOurLives:
      return getStatsForOurLives(event);
    case CrossDomainAPIs.Name.GetMarchForOurLivesEvents:
      return getMarchForOurLivesEvents(event);
    case CrossDomainAPIs.Name.GetNearestMarch:
      return getNearestMarch(event);
    default:
      return;
  }
}

window.addEventListener("message", onMessage, false);
window.postMessage("MFOL_IFRAME_READY", "*");