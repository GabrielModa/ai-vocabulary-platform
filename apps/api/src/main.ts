import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { parseServerConfig } from "@vocabulary/config/server";
import { createApp } from "./create-app.js";

const config = parseServerConfig(process.env);
const app = await createApp(config);
await app.listen(config.PORT, "0.0.0.0");
Logger.log(`API listening on port ${String(config.PORT)}`, "Bootstrap");
