import * as r from 'rethinkdb';
import { LocationData } from '../interfaces/locationData';
import { PostData } from '../interfaces/postData';
import { UserData } from '../interfaces/userData';
import { logger } from '../tools/logger';

class DBConnection {
  public dbName: string = 'food';
  public db: r.Db;
  public connection: r.Connection;
  public testConnection: r.Connection;
  public foodiesTable: r.Table;
  public postsTable: r.Table;
  public locationsTable: r.Table;

  public async setup() {
    // connect to Database
    try {
      this.testConnection = await r.connect({
        port: parseInt(process.env.DB_PORT, 10),
      });
      logger.log('DBConnection', 'Connection Sucessful');
    } catch (error) {
      logger.error('DBConnection', 'Cannot connect to DB', error, true);
    }
    try {
      await this.checkDBAndTables();
      return this;
    } catch (error) {
      logger.error('DBConnection', 'Error setting up DB tables', error, true);
    }
  }

  public async postExists(imageShortCode: string) {
    try {
      const postCount = await this.postsTable
        .getAll(imageShortCode, {
          index: 'shortcode',
        })
        .count()
        .run(this.connection);
      return postCount > 0;
    } catch (error) {
      logger.error('DBConnection', 'Error fetching post counts', error);
    }
  }

  public async insertPost(postData: PostData) {
    try {
      if (!postData || !postData.locationID) {
        logger.log('DBConnection', 'Post data missing locationID', postData, 'verbose');
        return;
      }
      await this.postsTable.insert(postData, { conflict: 'update' }).run(this.connection);
      // Add post to foodie's posts set
      const currentPosts = await this.foodiesTable
        .get(postData.owner_id)
        .update({
          posts: (r.row('posts').default([]) as any).setInsert(postData.id),
        })
        .run(this.connection);
      // Add post to location's posts set
      await this.locationsTable
        .get(postData.locationID)
        .update({
          posts: (r.row('posts').default([]) as any).setInsert(postData.id),
        })
        .run(this.connection);
    } catch (error) {
      logger.error('DBConnection', 'Error inserting post', error);
      logger.error('DBConnection', 'Post Data', postData);
    }
  }

  public async locationExists(locationID: string) {
    try {
      const locationCount = await this.locationsTable
        .getAll(locationID)
        .count()
        .run(this.connection);
      return locationCount > 0;
    } catch (error) {
      logger.error('DBConnection', 'Error fetching location counts', error);
    }
  }

  public async insertLocation(locationData: LocationData) {
    try {
      if (!locationData) {
        return;
      }
      await this.locationsTable.insert(locationData, { conflict: 'update' }).run(this.connection);
    } catch (error) {
      logger.error('DBConnection', 'Error inserting location', error);
      logger.error('DBConnection', 'Location Data', locationData);
    }
  }

  public async userExists(id: string) {
    try {
      const userCount = await this.foodiesTable
        .getAll(id)
        .count()
        .run(this.connection);
      return userCount > 0;
    } catch (error) {
      logger.error('DBConnection', 'Error fetching user counts', error);
    }
  }

  public async insertUser(userData: UserData) {
    try {
      if (!userData) {
        return;
      }
      await this.foodiesTable.insert(userData, { conflict: 'update' }).run(this.connection);
    } catch (error) {
      logger.error('DBConnection', 'Error inserting user', error);
      logger.error('DBConnection', 'User Data', userData);
    }
  }

  public async close() {
    await this.connection.close().catch(e => logger.error('DBConnection', 'Error closing connection', e));
  }

  private async checkDBAndTables() {
    // Check if DB Exists
    const dbList = await r.dbList().run(this.testConnection);
    if (dbList.indexOf(this.dbName) < 0) {
      await r.dbCreate(this.dbName).run(this.testConnection);
    }

    this.db = r.db(this.dbName);
    this.connection = await r.connect({ db: this.dbName, port: parseInt(process.env.DB_PORT, 10) });
    this.foodiesTable = r.table('foodies');
    this.postsTable = r.table('posts');
    this.locationsTable = r.table('locations');

    // Check if tables exist
    const tablesList = await this.db.tableList().run(this.connection);
    if (tablesList.indexOf('foodies') < 0) {
      await this.db.tableCreate('foodies').run(this.connection);
    }
    const foodiesIndexList = await this.foodiesTable.indexList().run(this.connection);
    if (foodiesIndexList.indexOf('username') < 0) {
      await this.foodiesTable.indexCreate('username').run(this.connection);
    }
    if (foodiesIndexList.indexOf('fullName') < 0) {
      await this.foodiesTable.indexCreate('fullName').run(this.connection);
    }
    if (tablesList.indexOf('posts') < 0) {
      await this.db.tableCreate('posts').run(this.connection);
    }
    const postsIndexList = await this.postsTable.indexList().run(this.connection);
    if (postsIndexList.indexOf('locationID') < 0) {
      await this.postsTable.indexCreate('locationID').run(this.connection);
    }
    if (postsIndexList.indexOf('shortcode') < 0) {
      await this.postsTable.indexCreate('shortcode').run(this.connection);
    }
    if (tablesList.indexOf('locations') < 0) {
      await this.db.tableCreate('locations').run(this.connection);
    }
    const locationIndexList = await this.locationsTable.indexList().run(this.connection);
    if (locationIndexList.indexOf('name') < 0) {
      await this.locationsTable.indexCreate('name').run(this.connection);
    }
    if (locationIndexList.indexOf('coords') < 0) {
      await this.locationsTable.indexCreate('coords', { geo: true } as any).run(this.connection);
    }
  }
}
export const DBConnector = new DBConnection();
