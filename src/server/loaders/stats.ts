import axios from "axios";
import { scrapeValue } from "./scrape-value";
import { getMarchForOurLivesEvents } from "./events";
import {StatsForOurLives} from "../../types";
import {cacheFactory} from "./cache-factory";
const msBetweenReloads = 5000;

async function loadMarchStats() {
  try {
    const marches = await getMarchForOurLivesEvents();
    const numParticipants = marches.reduce(
      (sum, march) => sum + march.attendee_count,
      0
    );

    // Update the cache with the newly-scraped values
    return {
      numEvents: marches.length,
      numParticipants,
    };
  } catch (e) {
    //
    console.log("exception", e); // fixme
    throw e;
  }
}


async function loadPetitionStatsByScrapingWidget() {
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
    const numPetitionSignatures = parseInt(valueString, 10);
    return {
      numPetitionSignatures
    }
  } catch (e) {
    console.log("exception", e);
    throw e;
  }
}

/**
 * Load the stats by getting the petition data from the petitition page
 * and the marches data from the events page.
 */
async function loadStatsForOurLives(): Promise<StatsForOurLives> {
  const [petitionStats, marchStats] = await Promise.all([
    loadPetitionStatsByScrapingWidget(),
    loadMarchStats(),
  ]);
  return {
    ...petitionStats,
    ...marchStats
  };
}

const cache = cacheFactory(loadStatsForOurLives, msBetweenReloads);

export async function getStatsForOurLives() {
  return await cache();
}
