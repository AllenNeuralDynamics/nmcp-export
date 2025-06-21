import moment = require("moment");

import {ExportFormat} from "./exportCacheBase";
import {ExportCacheBase, IExportResponse} from "./exportCacheBase";
import * as uuid from "uuid";
import * as fs from "fs";
import * as archiver from "archiver";

export class JsonExportCache extends ExportCacheBase {
    public constructor() {
        super(ExportFormat.Json);
    }

    protected override async formatResponse(neurons: any[], filenames: string[]): Promise<IExportResponse> {
        let response: IExportResponse;

        const tempFile = uuid.v4();

        response = await new Promise(async (resolve) => {
            const output = fs.createWriteStream(tempFile);

            output.on("close", () => {
                const readData = fs.readFileSync(tempFile);

                const encoded = readData.toString("base64");

                fs.unlinkSync(tempFile);

                resolve({
                    contents: encoded,
                    filename: `nmcp-export-json-${moment().format("YYYY_MM_DD")}.zip`
                });
            });

            const archive = archiver("zip", {zlib: {level: 9}});

            archive.pipe(output);

            neurons.forEach((n, idx) => {
                archive.append(JSON.stringify({
                    comment: `Generated: ${moment().format("YYYY/MM/DD")}.  ${this._termsOfUse}`,
                    neurons: [n]
                }), {name: filenames[idx] + ".json"});
            });

            archive.append(this._citation, {name: "CITATION.md"});

            archive.finalize();
        });

        return response;
    }
}
