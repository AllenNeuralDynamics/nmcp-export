import {ExportFormat, ReconstructionSpace} from "../export/exportCacheBase";
import {JsonExport} from "../export/jsonExportCache";
import {SwcExport} from "../export/swcExportCache";

export async function exportMiddleware(req: any, res: any, next: any) {
    const format = req.body.format as ExportFormat ?? ExportFormat.Swc;

    const source = format == ExportFormat.Swc ? SwcExport : JsonExport;

    const space = req.body.reconstructionSpace as ReconstructionSpace ?? ReconstructionSpace.Atlas;

    if (source) {
        const response = await source.findContents(req.body.ids, space);

        res.json(response);
    } else {
        next({status: 404, statusMessage: "Not Found"});
    }
}
