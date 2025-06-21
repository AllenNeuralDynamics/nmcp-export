import {apiClient} from "../data-access/apiClient";

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

    public async findContents(ids: string[]): Promise<IExportResponse> {
        if (!ids || ids.length === 0) {
            debug(`null or empty id request`);
            return;
        }

        debug(`handling request for ids: ${ids.join(", ")}`);

        const neuronPromises = ids.map(async (id: string): Promise<any> => {
            return await this.getData(id);
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

        return this.formatResponse(neuronData, filenames);
    }

    protected async formatResponse(neurons: any[], filename: string[]): Promise<IExportResponse> {
        return Promise.resolve({
            contents: neurons,
            filename: "nmcp-export.json"
        });
    }

    protected formatReconstruction(data: any): any {
        return data;
    }

    private async getData(id: string): Promise<object> {
        return this._apiClient.queryReconstruction(id);
    }
}
