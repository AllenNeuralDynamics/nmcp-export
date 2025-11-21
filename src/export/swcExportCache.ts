import {ExportFormat, ExportCacheBase} from "./exportCacheBase";
import moment = require("moment");

export class SwcExportCache extends ExportCacheBase {
    public constructor() {
        super(ExportFormat.Swc);
    }

    protected override formatReconstruction(data: any, requireString: boolean = true): any {
        let content = `# Generated: ${moment().format("YYYY/MM/DD")}\n`
            + `# DOI:\t\t\t\t\t${data.doi || "n/a"}\n`
            + `# Neuron Id:\t\t\t${data.idString}\n`
            + `# Sample Date:\t\t\t${data.sample.date}\n`
            + `# Sample Subject:\t\t${data.sample.subject}\n`
            + `# Sample Strain:\t\t${data.sample.genotype ?? ""}\n`
            + `# Label Virus:\t\t\t${data.label?.virus ?? ""}\n`
            + `# Label Fluorophore:\t${data.label?.fluorophore ?? ""}\n`
            + `# Annotation Space:\t\tCCFv3.0 Axes> X: Anterior-Posterior; Y: Inferior-Superior; Z:Left-Right\n`
            + `# ${this._termsOfUse}\n`;

        let offset = 0;

        if (data.axon) {
            content += mapSomaIfPresent(data.axon);
            const subset = data.axon.filter(n => n.parentNumber != -1)
            content += mapToSwc(subset, 2, offset);
            offset += subset.length;
        }

        if (data.dendrite) {
            if (offset == 0) {
                content += mapSomaIfPresent(data.axon);
            }
            content += mapToSwc(data.dendrite.filter(n => n.parentNumber != -1), 3, offset);
        }

        return content;
    }
}

function mapSomaIfPresent(nodes: any[]): string {
    let soma = nodes.filter(n => n.parentNumber == -1);

    if (soma.length > 0) {
        return mapToSwc(soma, 1, 0);
    }

    return "";
}

function mapToSwc(nodes: any[], pathStructure: number, offset: number = 0): string {
    return nodes.reduce((prev, node) => {
        let sampleNumber = node.sampleNumber;
        let parentNumber = node.parentNumber;

        if (parentNumber !== 1) {
            parentNumber += offset;
        }

        sampleNumber += offset;

        return prev + `${sampleNumber}\t${pathStructure}\t${node.x.toFixed(6)}\t${node.y.toFixed(6)}\t${node.z.toFixed(6)}\t${node.radius.toFixed(6)}\t${parentNumber}\n`;
    }, "");
}

export const SwcExport = new SwcExportCache();
