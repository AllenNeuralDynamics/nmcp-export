import moment = require("moment");

import {ExportFormat} from "./exportCacheBase";
import {ExportCacheBase} from "./exportCacheBase";

export class JsonExportCache extends ExportCacheBase {
    public constructor() {
        super(ExportFormat.Json);
    }

    protected override formatReconstruction(data: any, requireString: boolean = true): any {
        const content = {
            comment: `Generated: ${moment().format("YYYY/MM/DD")}.  ${this._termsOfUse}`,
            neurons: [data]
        };

        if (requireString) {
            return JSON.stringify(content);
        } else {
            return content;
        }
    }
}

export const JsonExport = new JsonExportCache();
