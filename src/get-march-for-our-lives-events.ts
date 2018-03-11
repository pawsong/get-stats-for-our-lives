import axios from "axios";
import * as lambda from "aws-lambda";

const msBetweenReloads = 5000;

interface RawEvent {
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

export interface Event {
  attendee_count: number;
  latitude: number;
  longitude: number;
  id: number;
  is_full: boolean;
  is_open_for_signup: boolean;
  is_in_past: boolean;
  hour: number;
  minute: number;
  city_etc_no_postal: string;
  address1: string;
  address2: string;
  city: string;
  zip: string;
  title: string;
  city_etc: string;
  venue: string;
  state: string;
};

function parseTrueFalse(tfString: "True" | "False"): boolean {
  return tfString === "True";
}

function rawEventToEvent(rawEvent: RawEvent): Event {
  const {starts_at, starts_at_full, starts_at_ts, ...raw} = rawEvent;
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
    hour,
    minute
  }
}

let cachedEvents: Event[] = [];

/**
 * Store metadata for managing when we reload the cached
 * statistics in this record
 */
const cacheMetadata = {
  // Set this to true when we're loading the cache so that we don't
  // issue multiple loads at once.
  loadPromise: undefined as Promise<void> | undefined,
  // Track how fresh the data in the cache is.
  currentAsOf: undefined as Date | undefined
};


const actionKitUrl = `https://event.marchforourlives.com/cms/event/march-our-lives-events_attend/search_results/?all=1&akid=&source=&page=march-our-lives-events_attend&callback=actionkit.forms.onEventSearchResults&callback=actionkit.forms.onEventSearchResults&r=0.4442138994547189`;
export async function loadMarchesByScrapingEveryTown(): Promise<void> {
  try {
    const actionKitPage = await axios.get(actionKitUrl);
    let body = actionKitPage.data as string;
    const events: Event[] = [];

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
      const rawEvent: RawEvent = JSON.parse(entryString);
      const event = rawEventToEvent(rawEvent);
      events.push(event);
      startIndicatorPosition = body.indexOf(startIndicator, endPosition);
    }
    cachedEvents = events;
  } catch (e) {
    //
    console.log("exception", e); // fixme
  }
}


async function loadCache(): Promise<void> {
  if (cacheMetadata.loadPromise) {
    // If another call to this function is already loading the cahce,
    // just wait for that call to happen.
    return await cacheMetadata.loadPromise;
  } else {
    try {
      // Mark the reload as underway so that we don't issue multiple
      // reload requests at the same time
      cacheMetadata.loadPromise = loadMarchesByScrapingEveryTown();
      await cacheMetadata.loadPromise;

      // Update our recrod of how fresh the data is
      cacheMetadata.currentAsOf = new Date();
    } finally {
      // Always set reloadUnderway to false after the load
      // is complete, even if it failed.
      cacheMetadata.loadPromise = undefined;
    }
  }
}

async function getMarchForOurLivesEvents() {
  if (!cacheMetadata.currentAsOf) {
    // There is no data in the cache, and so we can't return a result
    // until the cache is loaded.  We must await the result of loadCache.
    await loadCache();
  } else if (!cacheMetadata.loadPromise &&
             cacheMetadata.currentAsOf.getTime() + msBetweenReloads < Date.now()
  ) {
    // There is data in the cache, we're not currently loading any fresh data,
    // and it's been there a while since we last updated the cache.
    // We should treat the stale data like a member of congress and replace
    // it as soon as soon as we can.
    // Still, since the client desires a quick response, we'll not wait for the
    // freshest data before sending it.
    // (So the promise returned by loadCache is not awaited)
    loadCache();
  }

  // Return the cached results.
  return cachedEvents;
}

/**
 * Exposing getStatsForOurLives as a lambda API that can be called via a GET method
 * and returns its results in JSON format.
 */
export const lambdaGetMarchForOurLivesEvents = async (_event: lambda.APIGatewayEvent, _context: lambda.APIGatewayEventRequestContext, callback: lambda.APIGatewayProxyCallback) => {
  try {
    const result = await getMarchForOurLivesEvents;

    callback(undefined, {
      body: JSON.stringify(result),
      statusCode: 200
    })
  } catch (e) {
    callback(new Error("Unable to fetch stats"), {body: JSON.stringify({exception: e, cachedEvents}), statusCode:500} );
  }
}

async function runTest() {
  const result = await getMarchForOurLivesEvents();
  console.log("Test output", result);
}
runTest();