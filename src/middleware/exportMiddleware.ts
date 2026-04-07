import {ExportCache, ExportFormat, ReconstructionSpace} from "../export/exportCacheBase";
import {SwcExport} from "../export/swcExportCache";
import {LegacyJsonExport} from "../export/legacyJsonExportCache";
import {JsonExport} from "../export/jsonExportCache";
import {atlasStructureRepository} from "../data-access/atlasStructure";

export async function exportMiddleware(req: any, res: any, next: any) {
    const format = req.body.format as ExportFormat ?? ExportFormat.Swc;

    let source: ExportCache = null;

    switch (format) {
        case ExportFormat.Swc:
            source = SwcExport;
            break;
        case ExportFormat.PortalJson:
            source = JsonExport
            break;
        case ExportFormat.LegacyJson:
            await atlasStructureRepository.loadStructureMap();
            source = LegacyJsonExport;
            break;
    }

    if (source == null) {
        next({status: 404, statusMessage: "Not Found"});
        return;
    }

    const space = req.body.reconstructionSpace as ReconstructionSpace ?? ReconstructionSpace.Atlas;

    if (req.body.id) {
        const data = await source.findContent(req.body.id, space);

        if (data) {
            res.json(data);
        } else {
            next({status: 404, statusMessage: "Not Found"});
        }

        return;
    }

    const response = await source.findContents(req.body.ids, space);

    if (response == null) {
        next({status: 404, statusMessage: "Not Found"});
    } else {
        res.json(response);
    }
}
