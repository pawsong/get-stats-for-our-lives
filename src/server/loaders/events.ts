import axios from "axios";
import sphereKnn = require("sphere-knn");
import {MarchForOurLivesEvent, GetNearestMarchesRequestParams} from "../../types";
import {zipCodeToLatLong} from "./zip-code-to-latitude-and-longitude";
import {cacheFactory} from "./cache-factory";

const msBetweenReloads = parseInt(process.env["MFOL_EVENT_CACHE_RELOAD_FREQ_MS"] as string || "5000", 10);

interface RawDatabaseFormat {
  city_etc_no_postal: string;
  attendee_count: string; // parseInt
  address1: string;
  address2: string;
  starts_at_ts: string; // YYYY-MM-DD HH:MM:SS, e.g. '2018-03-24 10:00:00',
  latitude: string; // parseFloat, e.g. '33.81947',
  longitude: string; // parseFloat  e.g. '-116.52094',
  is_full: "True" | "False"; // parse to boolean via (value === "True")
  id: string; // parseInt    '8714',
  is_in_past: "True" | "False"; //
  city: string; // e.g. 'Palm Springs',
  is_open_for_signup: "True" | "False",
  zip: string;
  title: string; // e.g. 'March for Our Lives - Palm Springs, CA',
  city_etc: string; // 'Palm Springs, CA 92262',
  venue: string; // e.g.  'Palm Springs High School Football Stadium',
  state: string; // e.g.  'CA',
  starts_at: string; // parse via new Date() // e.g.  'Saturday, March 24, 10:00 AM ',
  starts_at_full: string; // prase via new Data 'Saturday, March 24, 10:00 AM'
}

function parseTrueFalse(tfString: "True" | "False"): boolean {
  return tfString === "True";
}

function rawEventToEvent(rawEvent: RawDatabaseFormat): MarchForOurLivesEvent {
  const {starts_at, starts_at_full, starts_at_ts, ...raw} = rawEvent;
  //const year = parseInt(starts_at_ts.substr(0,4));
  //const month = parseInt(starts_at_ts.substr(5,2));
  const day = parseInt(starts_at_ts.substr(8,2));
  const hour = parseInt(starts_at_ts.substr(11,2), 10);
  const minute = parseInt(starts_at_ts.substr(14,2), 10);
  return {
    ...raw,
    attendee_count: parseInt(raw.attendee_count, 10),
    latitude: parseFloat(raw.latitude),
    longitude: parseFloat(raw.longitude),
    id: parseInt(raw.id),
    is_full: parseTrueFalse(raw.is_full),
    is_open_for_signup: parseTrueFalse(raw.is_open_for_signup),
    is_in_past: parseTrueFalse(raw.is_in_past),
    day,
    hour,
    minute
  }
}

const actionKitUrl = `https://event.marchforourlives.com/cms/event/march-our-lives-events_attend/search_results/?all=1&akid=&source=&page=march-our-lives-events_attend&callback=actionkit.forms.onEventSearchResults&callback=actionkit.forms.onEventSearchResults&r=0.4442138994547189`;
export async function loadMarchesByScrapingEveryTown() {
  try {
    const actionKitPage = await axios.get(actionKitUrl);
    let body = actionKitPage.data as string;
    const events: MarchForOurLivesEvent[] = [];

    const startIndicator = `\\nvar event_details = `; // {\\n`;
    const endIndicator = `;\\ntry {\\nadd_marker(`; // `\\n}
    let startIndicatorPosition = body.indexOf(startIndicator, 0);
    while (startIndicatorPosition >= 0) {
      const startPosition = startIndicatorPosition + startIndicator.length;
      const endPosition = body.indexOf(endIndicator, startPosition);
      if (endPosition < 0)
        break;
      const entryString = body.slice(startPosition, endPosition)
        .replace(/',\\n'/g, `","`)
        .replace(/': '/g, `": "`)
        .replace(/\\n/g,``)
        .replace(`{'`, `{"`)
        .replace(`'}`, `"}`);
      const rawEvent: RawDatabaseFormat = JSON.parse(entryString);
      const event = rawEventToEvent(rawEvent);
      events.push(event);
      startIndicatorPosition = body.indexOf(startIndicator, endPosition);
    }
    return {
      events: events,
      cachedGeographicEventLookup: sphereKnn(events),
    };
  } catch (e) {
    //
    console.log("exception", e); // fixme
    throw e;
  }
}

const cache = cacheFactory(loadMarchesByScrapingEveryTown, msBetweenReloads);

export async function getMarchForOurLivesEvents() {
  const {events} = await cache();
  return events;
}

export async function getNearestMarches(
  params: GetNearestMarchesRequestParams) {
  const maxResults = params.maxResults || 5;
  const maxDistanceInMeters = params.maxDistanceInMeters;
  let latitude: number;
  let longitude: number;
  if ("zipCode" in params) {
    const {zipCode} = params;
    const latLon = zipCodeToLatLong[zipCode];
    if (!latLon) {
      throw new Error("Invalid zipcode");
    }
    [latitude, longitude] = latLon;
  } else if ((typeof params.latitude === "number") && (typeof params.longitude === "number")) {
    latitude = params.latitude;
    longitude = params.longitude;
  } else {
    latitude = parseFloat(params.latitude as string);
    longitude = parseFloat(params.longitude as string);
  }
  const {cachedGeographicEventLookup} = await cache();
  return cachedGeographicEventLookup(latitude, longitude, maxResults, maxDistanceInMeters);
};