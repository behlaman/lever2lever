import * as Router from "koa-router";
import * as config from "config";
import {Container} from "inversify";
import * as fs from "fs";
import appDataSource from "../db/DataSource";
import {UnitOfWork} from "../db/UnitOfWork";


export class AppContainer {
    private constructor() {
    }

    private static _container: Container;

    static get container(): Container {
        return AppContainer._container;
    }

    private static _instance: AppContainer;

    static get instance() {
        if (!AppContainer._instance) {
            AppContainer._instance = new AppContainer();
        }

        return AppContainer._instance;
    }

    async init() {
        const container = new Container();
        if (!fs.existsSync(config.get("tempDir"))) {
            fs.mkdirSync(config.get("tempDir"));
        }

        if (!AppContainer._container) {
            const conn = await appDataSource.initialize();
            let uow = new UnitOfWork(conn);

            let router = new Router();

            // routes

            AppContainer._container = container;
        }
    }
}
