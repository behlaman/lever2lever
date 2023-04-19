import "reflect-metadata";
import { DataSource } from "typeorm";
import * as config from "config";
import * as fs from "fs";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

function getConnectionOptions(): PostgresConnectionOptions {

  const connProps: PostgresConnectionOptions = {
    type: "postgres",
    entities: [config.get<string>("db.entities")],
    synchronize: config.get("db.synchronize"),
    host: config.get("db.host"),
    port: config.get("db.port"),
    username: config.get("db.user"),
    password: config.get("db.password"),
    database: config.get("db.db"),
    dropSchema: config.get("db.dropSchema"),
    migrations: config.has("db.migrations") ? [config.get("db.migrations")] : []
  };

  if (config.has("db.cert")) {
    (connProps as any).ssl = {
      rejectUnauthorized: false,
      ca: fs.readFileSync(config.get("db.cert")).toString()
    };
  }

  return connProps;
}

export const appDataSource = new DataSource(getConnectionOptions());

export default appDataSource;
