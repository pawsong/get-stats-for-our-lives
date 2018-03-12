import {Stats} from "../server/loaders";

async function runTest() {
  const result = await Stats.getStatsForOurLives();
  console.log("Test output", result);
}
runTest();