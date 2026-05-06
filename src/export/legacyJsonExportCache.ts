import moment = require("moment");

const debug = require("debug")("nmcp:export:legacy-json-export");

import {ExportCacheBase, ExportFormat} from "./exportCacheBase";
import {PortalNode, PortalReconstruction} from "../io/portalJson";
import {PortalJsonNode, PortalJsonReconstruction, PortalJsonReconstructionContainer} from "../io/legacyJson";
import {atlasStructureRepository} from "../data-access/atlasStructure";

export class LegacyJsonExportCache extends ExportCacheBase {
    public constructor() {
        super(ExportFormat.LegacyJson);
    }

    protected override formatReconstruction(reconstruction: PortalReconstruction, asString: boolean = true): any {
        const formatted = this.mapToLegacyJson(reconstruction);

        if (asString) {
            return JSON.stringify(formatted);
        }

        return formatted;
    }

    private mapToLegacyJson(reconstruction: PortalReconstruction): PortalJsonReconstructionContainer {
        let reparentedSoma = false;

        const soma = this.mapJsonNode(reconstruction.nodes.find(n => n.structure == 1));

        const dendriteSampleNumbers = new Set(reconstruction.nodes.filter(n => n.structure == 3).map(n => n.index));

        const axon = this.mapJsonNodes(reconstruction.nodes.filter(n => n.structure == 2));
        axon.unshift(soma);
        reparentedSoma ||= this.reindexNodes(axon, dendriteSampleNumbers);

        const dendrite = this.mapJsonNodes(reconstruction.nodes.filter(n => n.structure == 3));
        dendrite.unshift(soma);
        reparentedSoma ||= this.reindexNodes(dendrite);

        const allenInformation = atlasStructureRepository.getStructures(reconstruction.nodes.map(n => n.atlasStructure));

        const neuron: PortalJsonReconstruction = {
            DOI: reconstruction.doi,
            annotationSpace: {
                version: 0,
                description: ""
            },
            annotator: reconstruction.annotator?.displayName ?? "",
            idString: reconstruction.neuron.label,
            label: {
                virus: reconstruction.neuron.specimen.injections.map(i => i.virus).join(", ") ?? "",
                fluorophore: reconstruction.neuron.specimen.injections.map(i => i.fluorophore).join(", ") ?? ""
            },
            peerReviewer: reconstruction.peerReviewer?.displayName ?? "",
            proofreader: reconstruction.proofreader?.displayName ?? "",
            sample: {
                date: reconstruction.neuron.specimen.date ? moment(reconstruction.neuron.specimen.date).format() : "",
                subject: reconstruction.neuron.specimen.label,
                genotype: reconstruction.neuron.specimen.genotype ?? "",
                collection: {
                    name: reconstruction.neuron.specimen.collection.name,
                    description: reconstruction.neuron.specimen.collection.description,
                    reference: reconstruction.neuron.specimen.collection.reference
                }
            },
            soma: soma,
            axon: axon,
            dendrite: dendrite,
            allenInformation: allenInformation
        }

        let comment = `Generated: ${moment().format("YYYY/MM/DD")}.  ${this._termsOfUse}`;

        if (reparentedSoma) {
            comment += "  WARNING: The axon originates from a dendrite node in the original reconstruction.";
            comment += "  This has been modified to parent the axon to the soma to support this output format.";
            comment += "  Consider other supported export formats if maintaining the original structure is required";
        }

        return {
            comment: comment,
            neurons: [neuron]
        };
    }

    private mapJsonNodes(nodes: PortalNode[]): PortalJsonNode[] {
        return nodes.map(this.mapJsonNode);
    }

    private mapJsonNode(node: PortalNode): PortalJsonNode {
        return {
            sampleNumber: node.index,
            parentNumber: node.parentIndex,
            structureIdentifier: node.structure,
            x: node.x,
            y: node.y,
            z: node.z,
            radius: node.radius,
            lengthToParent: node.lengthToParent ?? null,
            allenId: node.atlasStructure ?? null,
        }
    }

    private reindexNodes(nodes: PortalJsonNode[], reparentSampleNumbers?: Set<number>): boolean {
        let reparentSomaRequired = false;

        const nodeMap = new Map<number, number>();

        nodes.forEach((node, index) => {
            nodeMap.set(node.sampleNumber, index + 1);
            node.sampleNumber = index + 1;
        });

        nodes.forEach(node => {
            if (node.parentNumber != -1) {
                if (nodeMap.has(node.parentNumber)) {
                    node.parentNumber = nodeMap.get(node.parentNumber);
                } else if (reparentSampleNumbers?.has(node.parentNumber)) {
                    node.parentNumber = 1;
                } else {
                    debug(`setting missing parent index ${node.parentNumber} to 1`);
                    node.parentNumber = 1;
                    reparentSomaRequired = true;
                }
            }
        });

        return reparentSomaRequired;
    }
}

export const LegacyJsonExport = new LegacyJsonExportCache();
