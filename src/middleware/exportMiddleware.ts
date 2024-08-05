import {ExportFormat} from "../export/exportCacheBase";
import {JsonExportCache} from "../export/jsonExportCache";
import {SwcExportCache} from "../export/swcExportCache";

const swcExport = new SwcExportCache();

const jsonExport = new JsonExportCache();

export async function exportMiddleware(req: any, res: any, next: any) {
    const format = req.body.format as ExportFormat ?? ExportFormat.Swc;

    const source = format == ExportFormat.Swc ? swcExport : jsonExport;

    if (source) {
        const response = await source.findContents(req.body.ids)
        res.json(response);
    } else {
        next({status: 404, statusMessage: "Not Found"});
    }
}
