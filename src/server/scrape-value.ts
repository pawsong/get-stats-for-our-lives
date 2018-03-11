/**
 * Scrape a value out of a page or document by providing the UNIQUE string
 * that should come before the value and the string that should
 * occur after the value.
 * @param body 
 * @param startIndicator The string that occurs before the value to be scraped, which must
 * be unique enough to not also appear earlier in the document.  Scraping begins immediately
 * after this value.
 * @param endIndicator Scraping stops at the first occurrence of this string. 
 */
export function scrapeValue(body: string, startIndicator: string, endIndicator: string) {
  const indexOfStartIndicator = body.indexOf(startIndicator);
  if (indexOfStartIndicator <= 0) {
    return "";
  }
  const indexOfValueToScrape = indexOfStartIndicator + startIndicator.length;
  const bodyStartingWithValue = body.substr(indexOfValueToScrape);
  return bodyStartingWithValue.substr(0, bodyStartingWithValue.indexOf(endIndicator));
}

