import {ExportCacheBase, ExportFormat} from "./exportCacheBase";
import {PortalReconstruction} from "../io/portalJson";

export class JsonExportCache extends ExportCacheBase {
    public constructor() {
        super(ExportFormat.PortalJson);
    }

    protected override formatReconstruction(reconstruction: PortalReconstruction, asString: boolean = true): any {
        return asString ? JSON.stringify(reconstruction) :  reconstruction;
    }
}

export const JsonExport = new JsonExportCache();
