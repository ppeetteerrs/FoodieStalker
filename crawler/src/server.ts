require('dotenv').config();
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as express from 'express';
import * as http from 'http';
import * as morgan from 'morgan';
import { start } from 'repl';
import * as r from 'rethinkdb';
import { CLIENT_RENEG_LIMIT } from 'tls';
import { DBConnector } from './db/dbConnector';
import { LocationData } from './interfaces/locationData';
import { PostData } from './interfaces/postData';
const app = express();

// logger
app.use(morgan('dev'));
// 3rd party middleware
app.use(cors());
app.use(bodyParser.json());

async function startServer() {
  await DBConnector.setup();

  app.get('/getLocs', (req, res) => {
    try {
      const { lat, lng } = req.query;
      console.log(`Lat: ${lat}, Lng: ${lng}`);
      if (lat && lng) {
        (DBConnector.locationsTable as any)
          .getNearest(r.point(parseFloat(lng), parseFloat(lat)), {
            index: 'coords',
            maxResults: 50,
            unit: 'm',
            maxDist: 10000,
          })
          .coerceTo('array')
          .run(DBConnector.connection)
          .then((locations: LocationData[]) => {
            console.log(`Returned ${locations.length} locations`);
            res.json(locations);
          });
      } else {
        throw new Error('Invalid query');
      }
    } catch (e) {
      res.send(e);
    }
  });

  app.get('/getPosts', (req, res) => {
    try {
      const { id } = req.query;
      console.log(`Location ID: ${id}`);
      if (id) {
        DBConnector.locationsTable
          .get(id)
          .run(DBConnector.connection)
          .then((locationdata: LocationData) => {
            const postIDs: string[] = locationdata.posts;
            DBConnector.postsTable
              .getAll(...postIDs)
              .coerceTo('array')
              .run(DBConnector.connection)
              .then((posts: PostData[]) => {
                res.json(posts);
              });
          });
      } else {
        throw new Error('Invalid query');
      }
    } catch (e) {
      res.send(e);
    }
  });

  const host = process.env.PROD && process.env.PROD !== 'false' ? '0.0.0.0' : 'localhost';

  app.listen(parseInt(process.env.PORT, 10), host, () => {
    console.log(`Started on port ${process.env.PORT}`);
  });
}

startServer();
