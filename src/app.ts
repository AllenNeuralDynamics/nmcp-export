import * as os from "os";
import {createServer} from "http";
import * as express from "express";
import * as bodyParser from "body-parser";

const debug = require("debug")("nmcp:export-api:server");

import {ServiceOptions} from "./options/serviceOptions";
import {exportMiddleware} from "./middleware/exportMiddleware";
import {concurrencyQueue} from "./middleware/concurrencyQueue";

const app = express();

app.use(bodyParser.urlencoded({extended: true}));

app.use(bodyParser.json());

app.use("/export", concurrencyQueue(5, exportMiddleware));

const server = createServer(app);

server.listen(ServiceOptions.port, () => {
    debug(`listening at http://${os.hostname()}:${ServiceOptions.port}/`);
});
