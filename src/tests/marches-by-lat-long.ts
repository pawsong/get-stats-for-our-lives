import {Events} from "../server/loaders";

async function runTest() {
  // Closest to Parkland, FL
  const flResult = await Events.getNearestMarchesByLatLong(26.31, -80.24); // Parkland, Florida
  process.stdout.write("Near Parkland, FL\n" + JSON.stringify(flResult, undefined, 2));

  // Closest to Washington, DC
  const dcResult = await Events.getNearestMarchesByLatLong(38.9, -77); // Parkland, Florida
  process.stdout.write("\n\nNear Washington, DC\n" + JSON.stringify(dcResult, undefined, 2));

}
runTest();