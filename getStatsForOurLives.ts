import axios from "axios";

const ACTION_NETWORK_PETITION_ID = "fixme";
const ACTION_NETWORK_OSDI_API_TOKEN = "fixme";

const ACTION_KIT_CAMPAIGN_ID = "fixme";
const ACTION_KIT_USERNAME = "fixme";
const ACTION_KIT_PASSWORD = "fixme";

const msBetweenReloads = 5000;

interface EventStats {
  // The total number of marches
  numEvents: number;
  // The total number of participants for all the marches
  numParticipants: number;  
}

interface PetitionStats {
  // The total number of petition signatures
  numPetitionSignatures: number;  
}

interface StatsForOurLives extends EventStats, PetitionStats {}

/**
 * Store the most recent statistics here
 */
let cachedResults: StatsForOurLives = {
  numEvents: undefined,
  numParticipants: undefined,
  numPetitionSignatures: undefined,
};


/**
 * Store metadata for managing when we reload the cached
 * statistics in this record
 */
const cacheMetadata = {
  // Set this to true when we're loading the cache so that we don't
  // issue multiple loads at once.
  loadPromise: undefined as Promise<void>,
  // Track how fresh the data in the cache is.
  currentAsOf: undefined as Date
};

/**
 * Load petition statistics from ActionNetwork
 * and put the results directly in the cache so that
 * they are available immediately.
 */
const petitionUrl = `https://actionnetwork.org/api/v2/petitions/${ACTION_NETWORK_PETITION_ID}`;
async function loadPetitionStats(): Promise<void> {
  const getResult = await axios.get(
    petitionUrl,
    {
      headers: {"OSDI-API-Token": ACTION_NETWORK_OSDI_API_TOKEN}
    }
  );
  const { total_signatures } = JSON.parse(getResult.data) as { total_signatures: number };
  cachedResults = {
    ...cachedResults,
    numPetitionSignatures: total_signatures
  }
}

interface ActionKitEvent {
  is_approved: 0 | 1,
  attendee_count: number,
}

const getEventsUrl = `https://roboticdogs.actionkit.com/rest/v1/event/?campaign_id=${ACTION_KIT_CAMPAIGN_ID}`;
const getEventsAxiosOptions = {
  auth: {
    username: ACTION_KIT_USERNAME,
    password: ACTION_KIT_PASSWORD  
  },
  headers: {
    Accept: "application/json"
  }
}
/**
 * Load event statistics from ActionKit
 * and put the results directly in the cache so that
 * they are available immediately.
 */
async function loadEventStats(): Promise<void> {
  const getEventsResult = await axios.get(getEventsUrl, getEventsAxiosOptions);
  let events = JSON.parse(getEventsResult.data) as ActionKitEvent[];
  events = events.filter( event => event.is_approved = 1)
  const numEvents = events.length;
  const numParticipants = events.reduce( (totalAttendees, event) => totalAttendees + event.attendee_count, 0);
  cachedResults = {
    ...cachedResults,
    numEvents,
    numParticipants,
  }
}


async function loadStatsForOurLives(): Promise<void> {
  const [petitionStats, eventStats] = await Promise.all([
    loadPetitionStats(),
    loadEventStats(),
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