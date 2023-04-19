import { Server } from "./Server";


(async () => {
  // const serviceType = process.env["SUBSERVICE"];

  const server = new Server();
  await server.init();
})();

