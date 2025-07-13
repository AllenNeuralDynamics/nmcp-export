import {ExportFormat} from "../export/exportCacheBase";
import {JsonExport} from "../export/jsonExportCache";
import {SwcExport} from "../export/swcExportCache";


export async function downloadMiddleware(req: any, res: any, next: any) {
    const format = req.body.format as ExportFormat ?? ExportFormat.Swc;

    const source = format == ExportFormat.Swc ? SwcExport : JsonExport;

    if (source) {
        const response = await source.findContent(req.body.id)
        if (response) {
            res.json(response);
            return;
        }
    }

    next({status: 404, statusMessage: "Not Found"});
}
