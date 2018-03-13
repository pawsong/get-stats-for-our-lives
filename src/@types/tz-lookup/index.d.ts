declare function tzLookup(latitude: number, longitude: number): string;

declare module 'tz-lookup' {
  export = tzLookup;
}
