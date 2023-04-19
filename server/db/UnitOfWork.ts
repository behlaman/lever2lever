import { injectable } from "inversify";
import { DataSource, Repository } from "typeorm";

@injectable()
export class UnitOfWork {
  connection: DataSource;

  constructor(connection: DataSource) {
    this.connection = connection;
  }
}


