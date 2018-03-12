import * as lambda from "aws-lambda";
import {Stats} from "../loaders";

/**
 * Exposing getStatsForOurLives as a lambda API that can be called via a GET method
 * and returns its results in JSON format.
 */
export const labdaGetMarchStats = async (_event: lambda.APIGatewayEvent, _context: lambda.APIGatewayEventRequestContext, callback: lambda.APIGatewayProxyCallback) => {
  try {
    const result = await Stats.getStatsForOurLives();;

    callback(undefined, {
      body: JSON.stringify(result),
      statusCode: 200
    })
  } catch (e) {
    callback(new Error("Unable to fetch stats"), {body: JSON.stringify({exception: e}), statusCode:500} );
  }
}
