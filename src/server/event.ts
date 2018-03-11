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

 
function parseTrueFalse(tfString: "True" | "False"): boolean {
  return tfString === "True";
}

export namespace MarchForOurLivesEvent {
  export interface RawDatabaseFormat {
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
   
  export function fromRawEvent(rawEvent: RawDatabaseFormat): MarchForOurLivesEvent {
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
}