import * as r from 'rethinkdb';
import { DBConnector } from './db/dbConnector';
import { LocationData } from './interfaces/locationData';
import { PostData } from './interfaces/postData';

async function run() {
  await DBConnector.setup();
  const location = await (DBConnector.locationsTable as any)
    .getNearest(r.point(103.75030484999999, 1.3203463), {
      index: 'coords',
      maxResults: 30,
    })
    .coerceTo('array')
    .run(DBConnector.connection);
  console.log(JSON.stringify(location, null, 4));
}

run();
