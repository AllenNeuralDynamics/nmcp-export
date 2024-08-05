import {ExportFormat, ExportCacheBase} from "../export/exportCacheBase";
import {JsonExportCache} from "../export/jsonExportCache";
import {SwcExportCache} from "../export/swcExportCache";

const swcExport = (new SwcExportCache()).loadContents();

const jsonExport = (new JsonExportCache()).loadContents();

const map = new Map<ExportFormat, ExportCacheBase>();

map.set(ExportFormat.Swc, swcExport);
map.set(ExportFormat.Json, jsonExport);

export async function exportMiddleware(req, res, next) {
    const format = req.body.format as ExportFormat ?? ExportFormat.Swc;

    const source = (map.get(format));

    if (source) {
        const response = await source.findContents(req.body.ids)
        res.json(response);
    } else {
        next({status: 404, statusMessage: "Not Found"});
    }
}
