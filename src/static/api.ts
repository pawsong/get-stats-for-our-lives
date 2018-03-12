//import {MarchForOurLivesEvent, StatsForOurLives, GetNearestMarchesRequestParams} from "types";

export interface MarchForOurLivesEvent {
  attendee_count: number;
  latitude: number;
  longitude: number;
  id: number;
  is_full: boolean;
  is_open_for_signup: boolean;
  is_in_past: boolean;
  day: number;
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

export interface EventStats {
  // The total number of marches
  numEvents: number;
  // The total number of participants for all the marches
  numParticipants: number;  
}

export interface PetitionStats {
  // The total number of petition signatures
  numPetitionSignatures: number;  
}

export interface StatsForOurLives extends EventStats, PetitionStats {}

export type GetNearestMarchesRequestParams = {
  maxResults?: number,
  maxDistanceInMeters?: number
} & ({
  zipCode: string
} | {
  latitude: number,
  longitude: number,
} | {
  latitude: string,
  longitude: string,
});


export function getMarchForOurLivesApi(baseUrl: string = window.location.origin) {
  const stats = () => new Promise<StatsForOurLives>( (resolve, reject) => {
    var xhrequest = new XMLHttpRequest();
    const url = baseUrl + `/api/stats`;
    xhrequest.onreadystatechange = function() {
      if (xhrequest.readyState == 4) {
        if (xhrequest.status == 200) {
          resolve(JSON.parse(xhrequest.response) as StatsForOurLives)
        } else {
          reject(xhrequest.status);
        }
      }
    };
    xhrequest.open('GET', url, true);
    xhrequest.send(null);
  });

  const marches = () => new Promise<MarchForOurLivesEvent[]>( (resolve, reject) => {
    var xhrequest = new XMLHttpRequest();
    const url = baseUrl + `/api/events`;
    xhrequest.onreadystatechange = function() {
      if (xhrequest.readyState == 4) {
        if (xhrequest.status == 200) {
          resolve(JSON.parse(xhrequest.response) as MarchForOurLivesEvent[])
        } else {
          reject(xhrequest.status);
        }
      }
    };
    xhrequest.open('GET', url, true);
    xhrequest.send(null);
  });

  const nearestMarches = (params: GetNearestMarchesRequestParams) => 
    new Promise<MarchForOurLivesEvent[]>( (resolve, reject) => {

    var xhrequest = new XMLHttpRequest();
    const url = baseUrl + `/api/nearby?` + Object.entries(params).map(
      ([field, value]) => `${field}=${encodeURIComponent(value as string)}`
    ).join(`&`);
    xhrequest.onreadystatechange = function() {
      if (xhrequest.readyState == 4) {
        if (xhrequest.status == 200) {
          resolve(JSON.parse(xhrequest.response) as MarchForOurLivesEvent[])
        } else {
          reject(xhrequest.status);
        }
      }
    };
    xhrequest.open('GET', url, true);
    xhrequest.send(null);
  });

  return {
    stats, marches, nearestMarches
  };
}
