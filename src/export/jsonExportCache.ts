import moment = require("moment");

import {ExportFormat} from "./exportCacheBase";
import {ExportCacheBase, IExportResponse} from "./exportCacheBase";

type ExportResponse = {
    comment: string;
    neurons: any[];
}

export class JsonExportCache extends ExportCacheBase{
    public constructor() {
        super(ExportFormat.Json);
    }

    protected override async formatResponse(neurons: any[], filenames: string[]): Promise<IExportResponse> {
        const base: ExportResponse = {
            comment: `Generated: ${moment().format("YYYY/MM/DD")}.  ${this._termsOfUse}`,
            neurons: neurons
        };

        const filename = neurons.length === 1 ? filenames[0] + ".json" : `nmcp-export-${moment().format("YYYY_MM_DD")}.json`

        return {
            contents: base,
            filename
        };
    }
}
