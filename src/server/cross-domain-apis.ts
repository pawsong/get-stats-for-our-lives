import {MarchForOurLivesEvent} from "./event";
import {StatsForOurLives} from "./stats-for-our-lives";

export namespace CrossDomainAPIs {
  export enum Name {
    GetStatsForOurLives = "GetStatsForOurLives",
    GetMarchForOurLivesEvents = "GetMarchForOurLivesEvents",
    GetNearestMarch = "GetNearestMarch",
  }

  export interface REQ<NAME extends Name, PAYLOAD> {
    name: NAME,
    uniqueRequestId: string;
    payload: PAYLOAD;  
  }
  export type RES<NAME extends Name, REQUEST_PAYLOAD, RESPONSE_PAYLOAD> = {
    name: NAME,
    uniqueRequestId: string;
    request: REQUEST_PAYLOAD;
  } & ({
    payload: RESPONSE_PAYLOAD;
  } | {
    error: {
      code: number,
      body: string,
    }
  });

  export type API<NAME extends Name, REQUEST_PAYLOAD, RESPONSE_PAYLOAD> = {
    name: NAME;
    requestPayload: REQUEST_PAYLOAD;
    responsePayload: RESPONSE_PAYLOAD;
    request: REQ<NAME, REQUEST_PAYLOAD>;
    response: RES<NAME, REQUEST_PAYLOAD, RESPONSE_PAYLOAD>;
  };

  export type RequestPayload<RAPI extends API<Name, any, any>> = RAPI["requestPayload"];
  export type ResponsePayload<RAPI extends API<Name, any, any>> = RAPI["responsePayload"];

  export type REQUEST<RAPI extends API<Name, any, any>> = RAPI["request"];
  export type RESPONSE<RAPI extends API<Name, any, any>> = RAPI["response"];

  export type Requests = RESPONSE<CrossDomainAPIs>;
  export type Responses = RESPONSE<CrossDomainAPIs>;
  
  export type GetStatsForOurLives = API<
    Name.GetStatsForOurLives,
    undefined,
    StatsForOurLives
  >;

  export namespace GetStatsForOurLives {
    export type Request = REQUEST<GetStatsForOurLives>
    export type Response = RESPONSE<GetStatsForOurLives>
  }

  export type GetMarchForOurLivesEvents = API<
    Name.GetMarchForOurLivesEvents,
    undefined,
    MarchForOurLivesEvent[]
  >;

  export namespace GetMarchForOurLivesEvents {
    export type Request = REQUEST<GetMarchForOurLivesEvents>
    export type Response = RESPONSE<GetMarchForOurLivesEvents>
  }

  export type GetNearestMarch = API<
    Name.GetNearestMarch,
    {
      latitude: number,
      longitude: number,
    },
    MarchForOurLivesEvent[]
  >;

  export namespace GetNearestMarch {
    export type Request = REQUEST<GetNearestMarch>
    export type Response = RESPONSE<GetNearestMarch>
  }

  export type WithoutPayload = 
    GetMarchForOurLivesEvents |
    GetStatsForOurLives;

  export type WithPayload =
    GetNearestMarch;

}

export type CrossDomainAPIs =
  CrossDomainAPIs.WithoutPayload |
  CrossDomainAPIs.WithPayload;

export type CrossDomainRequest = CrossDomainAPIs["request"];
export type CrossDomainResponse = CrossDomainAPIs["response"];

export type CrossDomainMessage =
  CrossDomainRequest |
  CrossDomainResponse;
