import * as fs from "fs";
import * as path from "path";
import * as archiver from "archiver";
import * as uuid from "uuid";
import {ServiceOptions} from "../options/serviceOptions";
import {ExportFormat, ExportCacheBase, IExportResponse} from "./exportCacheBase";
import moment = require("moment");

const debug = require("debug")("nmcp:export-api:swc");

export class SwcExportCache extends ExportCacheBase {
    public constructor() {
        super(ExportFormat.Swc);
    }

    public loadContents(): ExportCacheBase {
        const dataLocation = path.join(ServiceOptions.dataPath, "swc");

        if (!fs.existsSync(dataLocation)) {
            debug("swc data path does not exist");
            return;
        }

        debug("initiating swc cache load");

        fs.readdirSync(dataLocation).forEach(file => {
            if (file.slice(-4) === ".swc") {
                const swcName = file.slice(0, -4);

                const data = fs.readFileSync(path.join(dataLocation, file), {encoding: "utf8"});

                this._cache.set(swcName, data);
            }
        });

        debug(`loaded ${this._cache.size} neurons (swc)`)

        return this;
    }

    public async findContents(ids: string[]): Promise<IExportResponse> {
        if (!ids || ids.length === 0) {
            debug(`null swc id request`);
            return null;
        }

        debug(`handling swc request for ids: ${ids.join(", ")}`);

        let response: IExportResponse;

        if (ids.length === 1) {
            let encoded = null;

            const data = this._cache.get(ids[0]);

            if (data) {
                encoded = Buffer.from(`# Downloaded ${moment().format("YYYY/MM/DD")}. \n` + data).toString("base64");
            }

            response = {
                contents: encoded,
                filename: ids[0] + ".swc"
            };
        } else {
            const tempFile = uuid.v4();

            response = await new Promise(async (resolve) => {
                const output = fs.createWriteStream(tempFile);

                output.on("finish", () => {
                    const readData = fs.readFileSync(tempFile);

                    const encoded = readData.toString("base64");

                    fs.unlinkSync(tempFile);

                    resolve({
                        contents: encoded,
                        filename: "nmcp-export-data.zip"
                    });
                });

                const archive = archiver("zip", {zlib: {level: 9}});

                archive.pipe(output);

                ids.forEach(id => {
                    const data = this._cache.get(id);

                    if (data) {
                        archive.append(`# Generated ${moment().format("YYYY/MM/DD")}. \n` + data, {name: id + ".swc"});
                    }
                });

                archive.finalize();
            });
        }

        return response;
    }
}
