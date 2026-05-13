import {ExportCacheBase, ExportFormat, ExportResponse, ReconstructionSpace} from "./exportCacheBase";
import {PortalNode, PortalReconstruction} from "../io/portalJson";

type ParquetColumnType = "INT64" | "DOUBLE";

type ParquetColumnSource = {
    name: string;
    data: BigInt64Array | Float64Array | (bigint | null)[];
    type: ParquetColumnType;
};

type ParquetWriteBufferFn = (options: {
    columnData: ParquetColumnSource[];
    kvMetadata?: { key: string; value?: string }[];
}) => ArrayBuffer;

const parquetColumns = {
    id: "id",
    type: "type",
    x: "x",
    y: "y",
    z: "z",
    radius: "radius",
    parent: "parent",
    locationId: "locationId"
} as const;

let cachedParquetWriteBuffer: ParquetWriteBufferFn | null = null;

function buildColumnData(nodes: PortalNode[]): ParquetColumnSource[] {
    return [
        { name: parquetColumns.id, data: BigInt64Array.from(nodes.map(n => BigInt(n.index))), type: "INT64" },
        { name: parquetColumns.type, data: BigInt64Array.from(nodes.map(n => BigInt(n.structure))), type: "INT64" },
        { name: parquetColumns.x, data: Float64Array.from(nodes.map(n => n.x)), type: "DOUBLE" },
        { name: parquetColumns.y, data: Float64Array.from(nodes.map(n => n.y)), type: "DOUBLE" },
        { name: parquetColumns.z, data: Float64Array.from(nodes.map(n => n.z)), type: "DOUBLE" },
        { name: parquetColumns.radius, data: Float64Array.from(nodes.map(n => n.radius)), type: "DOUBLE" },
        { name: parquetColumns.parent, data: BigInt64Array.from(nodes.map(n => BigInt(n.parentIndex))), type: "INT64" },
        { name: parquetColumns.locationId, data: nodes.map(n => n.atlasStructure != null ? BigInt(n.atlasStructure) : null), type: "INT64" },
    ];
}

function buildMetadata(reconstruction: PortalReconstruction): { key: string; value: string }[] {
    return [
        { key: "subjectId", value: reconstruction.neuron.specimen.label },
        { key: "doi", value: reconstruction.doi ?? "" },
    ];
}

export class ParquetExportCache extends ExportCacheBase {
    public constructor() {
        super(ExportFormat.Parquet);
    }

    public async ensureImport(): Promise<void> {
        if (!cachedParquetWriteBuffer) {
            const mod = await import("hyparquet-writer");
            cachedParquetWriteBuffer = mod.parquetWriteBuffer;
        }
    }

    public override async findContent(id: string, space: ReconstructionSpace): Promise<any> {
        let reconstruction: PortalReconstruction | null = null;

        if (space == ReconstructionSpace.Atlas) {
            reconstruction = await this._apiClient.queryAtlasReconstruction(id);
        } else {
            reconstruction = await this._apiClient.querySpecimenSpaceReconstruction(id);
        }

        if (!reconstruction) {
            return null;
        }

        const buffer = this.formatReconstruction(reconstruction, true) as Buffer;

        const filename = reconstruction.neuron.label && reconstruction.neuron.specimen.label
            ? `${reconstruction.neuron.label}-${reconstruction.neuron.specimen.label}`
            : reconstruction.id;

        return {
            contents: buffer.toString("base64"),
            filename: `${filename}.parquet`
        };
    }

    protected override formatReconstruction(reconstruction: PortalReconstruction, _asString: boolean = true): any {
        const arrayBuffer = cachedParquetWriteBuffer({
            columnData: buildColumnData(reconstruction.nodes),
            kvMetadata: buildMetadata(reconstruction)
        });

        return Buffer.from(arrayBuffer);
    }
}

export const ParquetExport = new ParquetExportCache();
