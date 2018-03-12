declare namespace sphereKnn {
  type Lat = 
    {lat: number} |
    {latitude: number};
  type Long =
    {lon: number} |
    {long: number} |
    {lng: number} |
    {longitude: number};
  type LatLong = Lat & Long;

  export type GeographicLookupFunction<POINT extends LatLong> = (
    latitude: number,
    longitude: number,
    maxResults: number,
    maxDistanceInMeters?: number
  ) => POINT[]
}

declare function sphereKnn<POINT extends sphereKnn.LatLong>(points: POINT[]):
      sphereKnn.GeographicLookupFunction<POINT>;

declare module 'sphere-knn' {
  export = sphereKnn;
}
