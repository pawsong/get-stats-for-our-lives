import * as lambda from "aws-lambda";
import {Events} from "../loaders";

/**
 * Exposing getStatsForOurLives as a lambda API that can be called via a GET method
 * and returns its results in JSON format.
 */
export const labdaGetNearestMarches = async (event: lambda.APIGatewayEvent, _context: lambda.APIGatewayEventRequestContext, callback: lambda.APIGatewayProxyCallback) => {
  try {
    if (!event || !event.queryStringParameters) {
      return callback(new Error("Invalid parameter"), {statusCode: 400, body: "Invalid Paramter"});
    }
    const query = event.queryStringParameters;

    const maxResults = parseInt(query["maxResults"] || "5")
    const maxDistance = parseFloat(query["maxDistance"] || "100000")
    if (typeof(query["zipCode"]) === "string") {
      const zipCode = query["zipCode"];
      const result = await Events.getNeareetMarchesByZipCode(zipCode, maxResults, maxDistance);
      callback(undefined, {body: JSON.stringify(result), statusCode: 200});
    } else {
      const latitude = parseFloat(query["latitude"]);
      const longitude = parseFloat(query["longitude"]);
      const result = await Events.getNearestMarchesByLatLong(latitude, longitude, maxResults, maxDistance);
      callback(undefined, {body: JSON.stringify(result), statusCode: 200});
    }
  } catch (e) {
    callback(new Error("Unable to fetch stats"), {body: JSON.stringify({exception: e}), statusCode:500} );
  }
}
