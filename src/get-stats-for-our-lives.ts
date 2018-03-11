import axios from "axios";
import * as lambda from "aws-lambda";
import { scrapeValue } from "./scrape-value";
import {StatsForOurLives} from "./stats-for-our-lives";
const msBetweenReloads = 5000;

/**
 * Store the most recent statistics here
 */
let cachedResults = {} as StatsForOurLives;


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
    const body = actionKitPage.data as string;

    // Scrape the number of events (marches)
    const marchesAsString = scrapeValue(body, `getElementById(\\"total-marches\\").innerHTML = '`, `'`);
    const numEvents = parseInt(marchesAsString, 10);

    // Scrape the number of participants (marchers)
    const marchersAsStringSum = scrapeValue(body, `.getElementById(\\"total-marchers\\").innerHTML = (`, `)`);
    const numParticipants = marchersAsStringSum.split(" + ")
      .reduce( (sum, valueString) => sum + parseInt(valueString, 10), 0);

    // Update the cache with the newly-scraped values
    cachedResults = {
      ...cachedResults,
      numEvents,
      numParticipants,
    }
  } catch (e) {
    //
    console.log("exception", e); // fixme
  }
}


export async function loadPetitionStatsByScrapingWidget(): Promise<void> {
  // The petition signature count can be scraped from this page's body
  // which we will download via the axios package
  try {
    const widget = await axios.get(
      "https://actionnetwork.org/widgets/v3/form/an-act-to-protect-save-your-children?format=js&style=full", {
        headers: {},
        responseType: "text",
      }
    );
    const body = widget.data as string;
    const valueWithCommas = scrapeValue(body, `<div class=\\"action_status_running_total\\">`, ` `);
    const valueString=valueWithCommas.replace(",","")
    // // The count comes immediately after this tag
    // const divStartTag = `<div class=\\"action_status_running_total\\">`;
    // const divStartIndex = body.indexOf(divStartTag);
    // if (divStartIndex <= 0) {
    //   return;
    // }
    // const valueStartIndex = divStartIndex + divStartTag.length;
    // const bodyStartAtValue = body.substr(valueStartIndex);
    // // The count is comma-separated, and we'll pull out the comma so we can parse it.
    // const bodyValue = bodyStartAtValue.substr(0, bodyStartAtValue.indexOf(' ')).replace(",","");
    // Parse the count and add it to the cache results.
    const numPetitionSignatures = parseInt(valueString, 10);
    cachedResults = {
      ...cachedResults,
      numPetitionSignatures
    }
  } catch (e) {
    //
    console.log("exception", e); // fixme
  }
}

/**
 * Load the stats by getting the petition data from the petitition page
 * and the marches data from the events page.
 */
async function loadStatsForOurLives(): Promise<void> {
  await Promise.all([
    loadPetitionStatsByScrapingWidget(),
    loadMarchesByScrapingEveryTown(),
  ]);
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
      cacheMetadata.loadPromise = loadStatsForOurLives();
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

async function getStatsForOurLives() {
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
  return cachedResults;
}

/**
 * Exposing getStatsForOurLives as a lambda API that can be called via a GET method
 * and returns its results in JSON format.
 */
export const lambdaGetStatsForOurLives = async (_event: lambda.APIGatewayEvent, _context: lambda.APIGatewayEventRequestContext, callback: lambda.APIGatewayProxyCallback) => {
  try {
    const result = await getStatsForOurLives();;

    callback(undefined, {
      body: JSON.stringify(result),
      statusCode: 200
    })
  } catch (e) {
    callback(new Error("Unable to fetch stats"), {body: JSON.stringify({exception: e, cachedResults}), statusCode:500} );
  }
}

async function runTest() {
  const result = await getStatsForOurLives();
  console.log("Test output", result);
}
runTest();