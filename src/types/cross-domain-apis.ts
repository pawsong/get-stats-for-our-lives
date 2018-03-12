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
  export interface Error<BODY=string> {
    code: number,
    body: BODY,  
  }
  export type RES<NAME extends Name, REQUEST_PAYLOAD, RESPONSE_PAYLOAD> = {
    name: NAME,
    uniqueRequestId: string;
    request: REQUEST_PAYLOAD;
  } & ({
    payload: RESPONSE_PAYLOAD;
  } | {
    error: Error
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
  export type MethodName<RAPI extends API<Name, any, any>> = RAPI["name"];

  export type RequestMessage<RAPI extends API<Name, any, any>> = RAPI["request"];
  export type ResponseMessage<RAPI extends API<Name, any, any>> = RAPI["response"];

  export type Requests = ResponseMessage<CrossDomainAPIs>;
  export type Responses = ResponseMessage<CrossDomainAPIs>;
  
  export type GetStatsForOurLives = API<
    Name.GetStatsForOurLives,
    undefined,
    StatsForOurLives
  >;

  export namespace GetStatsForOurLives {
    export type Request = RequestMessage<GetStatsForOurLives>
    export type Response = ResponseMessage<GetStatsForOurLives>
  }

  export type GetMarchForOurLivesEvents = API<
    Name.GetMarchForOurLivesEvents,
    undefined,
    MarchForOurLivesEvent[]
  >;

  export namespace GetMarchForOurLivesEvents {
    export type Request = RequestMessage<GetMarchForOurLivesEvents>
    export type Response = ResponseMessage<GetMarchForOurLivesEvents>
  }

  export type GetNearestMarch = API<
    Name.GetNearestMarch,
    {
      latitude: number,
      longitude: number,
    } | {
      zipCode: string
    },
    MarchForOurLivesEvent[]
  >;

  export namespace GetNearestMarch {
    export type Request = RequestMessage<GetNearestMarch>
    export type Response = ResponseMessage<GetNearestMarch>
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
