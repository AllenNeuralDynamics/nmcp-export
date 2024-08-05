export enum ExportFormat {
    Swc = 0,
    Json = 1
}

export interface IExportResponse {
    contents: any;
    filename: string;
}

export abstract class ExportCacheBase {
    protected _cache = new Map<string, string>();

    private readonly _exportFormat: ExportFormat;

    public get ExportFormat(): ExportFormat {
        return this._exportFormat;
    }

    protected constructor( exportFormat: ExportFormat) {
        this._exportFormat = exportFormat;
    }

    public abstract loadContents(): ExportCacheBase;

    public findContents(ids: string[]): Promise<IExportResponse> {
        return null;
    }
}
