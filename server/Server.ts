import * as Koa from "koa";
import * as Application from "koa";
import { AppContainer } from "./ioc/Container";


const PORT: number = Number(process.env.PORT) || 3000;

export class Server {
  // private readonly logger = new Logger(Server.name);

  async init() {
    const app = new Koa();

    app.proxy = true;

    app.on("error", (err, ctx) => {
      let errMessage = `error at request ${ctx.request.method} ${ctx.request.href}. Message:${err ? err.message : ""}`;
      console.error(err, errMessage);
    });

    await AppContainer.instance.init();

    if (!AppContainer.container.isBound(Application))
      AppContainer.container.bind<Application>(Application).toConstantValue(app);


    // const routes = AppContainer.container.get(Routes);

    // routes.init(app);

    app.listen(PORT, () => {
      console.log(`Server started at http://localhost:${PORT}`);
    });

    return app;
  }

}




