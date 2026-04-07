import archiver = require("archiver");
import uuid = require("uuid");
import * as fs from "node:fs";
import moment = require("moment");

import {apiClient} from "../data-access/apiClient";
import {PortalCollection, PortalReconstruction, PortalUser} from "../io/portalJson";

const debug = require("debug")("nmcp:export-api:cache");

const citation = "If you use this data, please cite it as:\n" +
    "\n" +
    "> _Allen Institute for Neural Dynamics. (2025-2026). Whole brain single neuron reconstructions. Available from: https://morphology.allenneuraldynamics.org._\n" +
    "\n" +
    "This dataset is freely available under the [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/). You are welcome to use, share, and adapt the data, provided that appropriate credit is given by including the citation above. For more detail and examples, see https://alleninstitute.org/citation-policy/.\n";

export enum ExportFormat {
    Swc = 100,
    PortalJson = 300,
    LegacyJson = 900
}

export enum ReconstructionSpace {
    Specimen = 100,
    Atlas = 200
}

export interface ExportResponse {
    contents: any;
    filename: string;
}

export type ExportCache = {
    findContent(id: string, space: ReconstructionSpace): Promise<PortalReconstruction>;
    findContents(ids: string[], space: ReconstructionSpace): Promise<ExportResponse>;
}

export abstract class ExportCacheBase implements ExportCache {
    protected _apiClient = apiClient;

    protected readonly _termsOfUse =
        "Please consult Terms-of-Use at https://morphology.allenneuraldynamics.org/ when referencing this reconstruction.";

    protected readonly _citation = citation;

    private readonly _exportFormat: ExportFormat;

    protected constructor(exportFormat: ExportFormat) {
        this._exportFormat = exportFormat;
    }

    public formatName(): string {
        switch (this._exportFormat) {
            case ExportFormat.Swc:
                return "swc";
            case ExportFormat.PortalJson:
                return "json";
            case ExportFormat.LegacyJson:
                return "json";
            default:
                return "none";
        }
    }

    public async findContent(id: string, space: ReconstructionSpace): Promise<PortalReconstruction> {
        let reconstruction = null;

        if (space == ReconstructionSpace.Atlas) {
            reconstruction = await this.getAtlasReconstructionData(id);
        } else {
            reconstruction = await this.getSpecimenSpaceReconstructionData(id);
        }

        if (reconstruction) {
            return this.formatReconstruction(reconstruction, false);
        }

        return null;
    }

    public async findContents(ids: string[], space: ReconstructionSpace): Promise<ExportResponse> {
        if (!ids || ids.length === 0) {
            debug(`null or empty id request`);
            return;
        }

        debug(`handling request for ids: ${ids.join(", ")}`);

        const jsonContent: PortalReconstruction[] = [];

        for (const id of ids.filter(id => id)) {
            if (space == ReconstructionSpace.Atlas) {
                jsonContent.push(await this.getAtlasReconstructionData(id));
            } else {
                jsonContent.push(await this.getSpecimenSpaceReconstructionData(id));
            }
        }

        const reconstructions = jsonContent.filter(r => r);

        if (reconstructions.length == 0) {
            return null;
        }

        const filenames = reconstructions.map(r => {
            if (r.neuron.label && r.neuron.specimen.label) {
                return `${r.neuron.label}-${r.neuron.specimen.label}`;
            } else {
                return r.id;
            }
        });

        const neuronData = reconstructions.map(n => this.formatReconstruction(n, true));

        const collections = new Map<string, PortalCollection>(reconstructions.map(r => [r.neuron.specimen.collection.id, r.neuron.specimen.collection]));

        const uniqueCollectionIds = [...new Set(collections.keys())];

        const uniqueCollections: Map<string, PortalCollection> = new Map<string, PortalCollection>(uniqueCollectionIds.map(id => [id, collections.get(id)]));

        const collectionMap = new Map<PortalCollection, PortalReconstruction[]>(Array.from(uniqueCollections.values()).map(c => [c, []]));

        reconstructions.forEach(n => {
            const c = uniqueCollections.get(n.neuron.specimen.collection.id);
            const arr = collectionMap.get(c);
            arr.push(n);
        });

        const uniqueAnnotators = [...new Set(reconstructions.map(n => n.annotator))].filter(a => a);
        const proofreaders = [...new Set(reconstructions.map(n => n.peerReviewer))].filter(r => r);
        const peerReviewers = [...new Set(reconstructions.map(n => n.proofreader))].filter(r => r);

        const uniqueProofreaders = [...new Set([...peerReviewers, ...proofreaders])];

        const citation = this.createCitationContent(collectionMap, uniqueAnnotators, uniqueProofreaders);

        return this.formatResponse(neuronData, filenames, citation);
    }

    protected async formatResponse(neurons: any[], filenames: string[], citation: string): Promise<ExportResponse> {
        let response: ExportResponse;

        const tempFile = uuid.v4();

        response = await new Promise(async (resolve) => {
            const output = fs.createWriteStream(tempFile);

            output.on("close", () => {
                const readData = fs.readFileSync(tempFile);

                const encoded = readData.toString("base64");

                fs.unlinkSync(tempFile);

                resolve({
                    contents: encoded,
                    filename: `nmcp-export-${this.formatName()}-${moment().format("YYYY_MM_DD")}.zip`
                });
            });

            const archive = archiver("zip", {zlib: {level: 9}});

            archive.pipe(output);

            neurons.forEach((n, idx) => {
                archive.append(n, {name: `${filenames[idx]}.${this.formatName()}`});
            });

            archive.append(citation, {name: "CITATION.md"});

            archive.finalize();
        });

        return response;
    }

    protected formatReconstruction(data: PortalReconstruction, asString: boolean = true): any {
        return data;
    }

    private async getAtlasReconstructionData(id: string): Promise<PortalReconstruction> {
        return this._apiClient.queryAtlasReconstruction(id);
    }

    private async getSpecimenSpaceReconstructionData(id: string): Promise<PortalReconstruction> {
        return this._apiClient.querySpecimenSpaceReconstruction(id);
    }

    protected createCitationContent(collectionMap: Map<PortalCollection, PortalReconstruction[]>, annotators: PortalUser[], proofreaders: PortalUser[]): string {
        let content = this._citation;

        for (const [collection, reconstructions] of collectionMap) {
            content += `\n\n#### These reconstructions are part of the ${collection.name} collection\n\n`;
            reconstructions.forEach(r => {
                content += `* ${r.neuron.label}-${r.neuron.specimen.label}\n`;
            })
        }

        if (annotators.length > 0) {
            content += "\n\n#### Annotators\n\n";
            content += annotators.map(a => `* ${a.displayName}`).join("\n");
        }

        if (proofreaders.length > 0) {
            content += "\n\n#### Proofreaders\n\n";
            content += proofreaders.map(a => `* ${a.displayName}`).join("\n");
        }

        return content;
    }
}
