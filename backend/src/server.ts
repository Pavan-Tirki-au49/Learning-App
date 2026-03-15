import app from "./app";
import { env } from "./config/env";
import { initDb } from "./config/db";

const startServer = async () => {
  await initDb();
  
  app.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT}`);
  });
};

startServer();
