/// <reference path="../../node_modules/@types/leaflet/index.d.ts" />
// import * as L from "leaflet";
/// import {getMarchForOurLivesApi} from "./api"
//import { MarchForOurLivesEvent } from "types";

interface MarchForOurLivesEvent {
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

type GetNearestMarchesRequestParams = {
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
  

function getMarchForOurLivesApi(baseUrl: string) {
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
  
const api = getMarchForOurLivesApi(window.location.origin);

var map = L.map('map').setView([39.272, -96.715], 5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
}).addTo(map);

var geojsonLayer = new L.GeoJSON(undefined, {
    onEachFeature: (feature: {properties: any}, layer: L.Layer) => {
        layer.bindPopup("<pre>" + JSON.stringify(feature.properties, null, 1) + "</pre>");
    }
});

function onMapClick(e: L.LeafletEvent) {
  const { latlng } = e as any as {latlng: {lat: number, lng: number} };
  console.log("You clicked the map at " +  latlng.toString());
  api.nearestMarches({latitude: latlng.lat, longitude: latlng.lng}).then( events => {      
    geojsonLayer.clearLayers();
    const featureCollection = {
        type: "FeatureCollection",
        features: events.map( event => ({
            type: "Feature",
            geometry: {type: "Point", coordinates: [event.longitude, event.latitude]},
            properties: {
                ...event,
                coordinates: [event.latitude, event.longitude]
            },
        }))
    } as any;
    geojsonLayer.addData(featureCollection);
    map.addLayer(geojsonLayer);
  });
}

map.on('click', onMapClick);
