import {Events} from "../server/loaders";

async function runTest() {
  const result = await Events.getMarchForOurLivesEvents();
  process.stdout.write(JSON.stringify(result, undefined, 2));
}
runTest();