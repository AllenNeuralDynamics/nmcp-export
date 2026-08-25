import moment = require("moment");

import {ExportFormat, ExportCacheBase} from "./exportCacheBase";
import {PortalAnnotationSpace, PortalNode, PortalReconstruction} from "../io/portalJson";

export class SwcExportCache extends ExportCacheBase {
    public constructor() {
        super(ExportFormat.Swc);
    }

    protected override formatReconstruction(reconstruction: PortalReconstruction, _asString: boolean = true): any {
        // Only CCFv3.0 has a named space and axis convention to report; specimen space gets no line at all
        // rather than a header asserting a space the coordinates are not in.
        const annotationSpace = reconstruction.annotationSpace === PortalAnnotationSpace.Atlas
            ? `# Annotation Space:\t\tCCFv3.0 Axes> X: Anterior-Posterior; Y: Inferior-Superior; Z:Left-Right\n`
            : "";

        let content = `# Generated: ${moment().format("YYYY/MM/DD")}\n`
            + `# DOI:\t\t\t\t\t${reconstruction.doi || "n/a"}\n`
            + `# Neuron Id:\t\t\t${reconstruction.neuron.label}\n`
            + `# Sample Date:\t\t\t${reconstruction.neuron.specimen.date}\n`
            + `# Sample Subject:\t\t${reconstruction.neuron.specimen.label}\n`
            + `# Sample Strain:\t\t${reconstruction.neuron.specimen.genotype ?? ""}\n`
            + `# Label Virus:\t\t\t${reconstruction.neuron.specimen.injections.map(i => i.virus).join(", ") ?? ""}\n`
            + `# Label Fluorophore:\t${reconstruction.neuron.specimen.injections.map(i => i.fluorophore).join(", ") ?? ""}\n`
            + annotationSpace
            + `# ${this._termsOfUse}\n`;

        content += mapToSwc(reconstruction.nodes);

        return content;
    }
}

function mapToSwc(nodes: PortalNode[]): string {
    return nodes.reduce((prev, n) => {

        return prev + `${n.index} ${n.structure} ${n.x.toFixed(6)} ${n.y.toFixed(6)} ${n.z.toFixed(6)} ${n.radius.toFixed(6)} ${n.parentIndex}\n`;
    }, "");
}

export const SwcExport = new SwcExportCache();
