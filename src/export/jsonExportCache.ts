import moment = require("moment");

import {ExportFormat} from "./exportCacheBase";
import {ExportCacheBase} from "./exportCacheBase";

export class JsonExportCache extends ExportCacheBase {
    public constructor() {
        super(ExportFormat.Json);
    }

    protected override formatReconstruction(data: any): any {
        return JSON.stringify({
            comment: `Generated: ${moment().format("YYYY/MM/DD")}.  ${this._termsOfUse}`,
            neurons: [data]
        });
    }
}
