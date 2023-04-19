import appDataSource from "../server/db/DataSource";
import Application = require("koa");
import { Server } from "../server/Server";

export abstract class BaseTest {
  server: Server;
  app: Application;

  async before() {
    this.server = new Server();
    this.app = await this.server.init();
  }

  async prepareDb() {
    await appDataSource.initialize();
  }

  async resetDb() {
    await appDataSource.manager.connection.synchronize(true);
  }

  // async destroyDb() {
  //     await this.uow.connection.close();
  // }
}