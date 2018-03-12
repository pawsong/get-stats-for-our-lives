import {Events} from "../server/loaders";

async function runTest() {
  // Closest to Parkland, FL
  const flResult = await Events.getNeareetMarchesByZipCode("02138"); // Cambridge, MA
  process.stdout.write("Near Cambridge, MA\n" + JSON.stringify(flResult, undefined, 2));
}
runTest();