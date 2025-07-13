import {apiClient} from "../data-access/apiClient";
import archiver = require("archiver");
import uuid = require("uuid");
import * as fs from "node:fs";
import moment = require("moment");

const debug = require("debug")("nmcp:export-api:cache");

const citation = "If you use this data, please cite it as:\n" +
    "\n" +
    "> _Allen Institute for Neural Dynamics. (2025). Whole brain single neuron reconstructions. Available from: https://morphology.allenneuraldynamics.org._\n" +
    "\n" +
    "This dataset is freely available under the [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/). You are welcome to use, share, and adapt the data, provided that appropriate credit is given by including the citation above. For more detail and examples, see https://alleninstitute.org/citation-policy/.\n";

export enum ExportFormat {
    Swc = 0,
    Json = 1
}

export interface IExportResponse {
    contents: any;
    filename: string;
}

export abstract class ExportCacheBase {
    protected _apiClient = apiClient;

    protected readonly _termsOfUse =
        "Please consult Terms-of-Use at https://morphology.allenneuraldynamics.org/ when referencing this reconstruction.";

    protected readonly _citation = citation;

    private readonly _exportFormat: ExportFormat;

    public get ExportFormat(): ExportFormat {
        return this._exportFormat;
    }

    protected constructor(exportFormat: ExportFormat) {
        this._exportFormat = exportFormat;
    }

    public formatName(): string {
        switch (this._exportFormat) {
            case ExportFormat.Swc:
                return "swc";
            case ExportFormat.Json:
                return "json";
            default:
                return "none";
        }
    }

    public async findContent(id: string): Promise<any> {
        if (!id || id.length === 0) {
            debug(`null or empty id request`);
            return null;
        }

        debug(`handling request for id: ${id}`);

        const data: any = await this.getReconstructionData(id);

        if (data) {
            return {
                filename: `${data.idString}-${data.sample.subject}.${this.formatName()}`,
                content: this.formatReconstruction(data, false)
            };
        }

        return null;
    }

    public async findContents(ids: string[]): Promise<IExportResponse> {
        if (!ids || ids.length === 0) {
            debug(`null or empty id request`);
            return;
        }

        debug(`handling request for ids: ${ids.join(", ")}`);

        const neuronPromises = ids.map(async (id: string): Promise<any> => {
            return await this.getNeuronData(id);
        });

        const neurons = (await Promise.all(neuronPromises)).filter(n => n);

        const filenames = neurons.map(n => {
            if (n.idString && n.sample) {
                return `${n.idString}-${n.sample.subject}`;
            } else {
                return n.id;
            }
        });

        const neuronData = neurons.map(n => this.formatReconstruction(n));

        const collections = new Map(neurons.map(n => [n.sample.collection.id, n.sample.collection]));

        const uniqueCollectionIds = [...new Set(collections.keys())];

        const uniqueCollections = uniqueCollectionIds.map(id => collections.get(id));

        const collectionMap = new Map(uniqueCollections.map(c => [c.id, {...c, neurons: []}]));

        neurons.forEach(n => {
            const c = collectionMap.get(n.sample.collection.id);
            c.neurons.push(n.idString);
        });

        const annotators = new Map(neurons.filter(n => n.annotator).map(n => [n.annotator.id, `${n.annotator.firstName} ${n.annotator.lastName}`]));

        const uniqueAnnotatorIds = [...new Set(annotators.keys())].filter(id => id);

        const uniqueAnnotators = uniqueAnnotatorIds.map(id => annotators.get(id));

        const proofreaders = new Map(neurons.filter(n => n.proofreader).map(n => [n.proofreader.id, `${n.proofreader.firstName} ${n.proofreader.lastName}`]));
        const peerReviewers = new Map(neurons.filter(n => n.peerReviewer).map(n => [n.peerReviewer.id, `${n.peerReviewer.firstName} ${n.peerReviewer.lastName}`]));

        const uniqueProofreadIds = [...new Set([...proofreaders.keys(), ...peerReviewers.keys()])].filter(id => id);

        const uniqueProofreaders = uniqueProofreadIds.map(id => proofreaders.get(id) || peerReviewers.get(id)).filter(p => p);

        const citation = this.createCitationContent(Array.from(collectionMap.values()), uniqueAnnotators, uniqueProofreaders);

        return this.formatResponse(neuronData, filenames, citation);
    }

    protected async formatResponse(neurons: any[], filenames: string[], citation: string): Promise<IExportResponse> {
        let response: IExportResponse;

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

    protected formatReconstruction(data: any, requireString: boolean = true): any {
        return data;
    }

    private async getNeuronData(id: string): Promise<object> {
        return this._apiClient.queryNeuron(id);
    }

    private async getReconstructionData(id: string): Promise<object> {
        return this._apiClient.queryReconstruction(id);
    }

    protected createCitationContent(collections: any[], annotators: string[], proofreaders: string[]): string {
        let content = this._citation;

        collections.forEach(c => {
            content += `\n\n#### These reconstructions are part of the ${c.name} collection\n\n`;
            c.neurons.forEach((n: string) => {
                content += `* ${n}\n`;
            })
        });

        if (annotators.length > 0) {
            content += "\n\n#### Annotators\n\n";
            content += annotators.map(a => `* ${a}`).join("\n");
        }

        if (proofreaders.length > 0) {
            content += "\n\n#### Proofreaders\n\n";
            content += proofreaders.map(a => `* ${a}`).join("\n");
        }

        return content;
    }
}
