import { describe, it, expect, beforeAll } from "vitest";
import { ParquetExport } from "../src/export/parquetExportCache";
import { parquetMetadata, parquetRead } from "hyparquet";
import { createBaseReconstruction, createNullFieldsReconstruction } from "./fixtures";

function format(reconstruction: any): Buffer {
    return (ParquetExport as any).formatReconstruction(reconstruction, true);
}

function toArrayBuffer(buf: Buffer): ArrayBuffer {
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

describe("ParquetExportCache", () => {
    beforeAll(async () => {
        await ParquetExport.ensureImport();
    });

    it("returns a Buffer", () => {
        const recon = createBaseReconstruction();
        const result = format(recon);

        expect(Buffer.isBuffer(result)).toBe(true);
    });

    it("produces valid parquet that can be parsed by parquetMetadata", () => {
        const recon = createBaseReconstruction();
        const buf = format(recon);
        const arrayBuffer = toArrayBuffer(buf);

        const metadata = parquetMetadata(arrayBuffer);
        expect(metadata).toBeDefined();
    });

    it("contains all 8 expected columns", () => {
        const recon = createBaseReconstruction();
        const buf = format(recon);
        const metadata = parquetMetadata(toArrayBuffer(buf));

        const columnNames = metadata.schema.slice(1).map((s: any) => s.name);
        expect(columnNames).toEqual(["id", "type", "x", "y", "z", "radius", "parent", "locationId"]);
    });

    it("roundtrips data correctly", async () => {
        const recon = createBaseReconstruction();
        const buf = format(recon);
        const arrayBuffer = toArrayBuffer(buf);
        const metadata = parquetMetadata(arrayBuffer);

        const rows: any[][] = [];
        await parquetRead({
            file: arrayBuffer,
            metadata,
            onComplete: (data: any) => rows.push(...data),
        });

        expect(rows).toHaveLength(recon.nodes.length);

        for (let i = 0; i < recon.nodes.length; i++) {
            const node = recon.nodes[i];
            const row = rows[i];
            expect(row[0]).toBe(BigInt(node.index));
            expect(row[1]).toBe(BigInt(node.structure));
            expect(row[2]).toBeCloseTo(node.x, 4);
            expect(row[3]).toBeCloseTo(node.y, 4);
            expect(row[4]).toBeCloseTo(node.z, 4);
            expect(row[5]).toBeCloseTo(node.radius, 4);
            expect(row[6]).toBe(BigInt(node.parentIndex));
        }
    });

    it("null atlasStructure produces null locationId", async () => {
        const recon = createBaseReconstruction();
        const buf = format(recon);
        const arrayBuffer = toArrayBuffer(buf);
        const metadata = parquetMetadata(arrayBuffer);

        const rows: any[][] = [];
        await parquetRead({
            file: arrayBuffer,
            metadata,
            onComplete: (data: any) => rows.push(...data),
        });

        const nullNode = recon.nodes.findIndex(n => n.atlasStructure === null);
        expect(rows[nullNode][7]).toBeNull();
    });

    it("non-null atlasStructure preserved as locationId", async () => {
        const recon = createBaseReconstruction();
        const buf = format(recon);
        const arrayBuffer = toArrayBuffer(buf);
        const metadata = parquetMetadata(arrayBuffer);

        const rows: any[][] = [];
        await parquetRead({
            file: arrayBuffer,
            metadata,
            onComplete: (data: any) => rows.push(...data),
        });

        expect(rows[0][7]).toBe(BigInt(997));
        expect(rows[1][7]).toBe(BigInt(512));
    });

    it("footer metadata contains subjectId and doi", () => {
        const recon = createBaseReconstruction();
        const buf = format(recon);
        const metadata = parquetMetadata(toArrayBuffer(buf));

        const kvMap = new Map(metadata.key_value_metadata.map((kv: any) => [kv.key, kv.value]));
        expect(kvMap.get("subjectId")).toBe("specimen-label-1");
        expect(kvMap.get("doi")).toBe("10.1234/test-doi");
    });

    it("null DOI produces empty string in metadata", () => {
        const recon = createNullFieldsReconstruction();
        const buf = format(recon);
        const metadata = parquetMetadata(toArrayBuffer(buf));

        const kvMap = new Map(metadata.key_value_metadata.map((kv: any) => [kv.key, kv.value]));
        expect(kvMap.get("doi")).toBe("");
    });

    it("INT64 columns return BigInt values", async () => {
        const recon = createBaseReconstruction();
        const buf = format(recon);
        const arrayBuffer = toArrayBuffer(buf);
        const metadata = parquetMetadata(arrayBuffer);

        const rows: any[][] = [];
        await parquetRead({
            file: arrayBuffer,
            metadata,
            onComplete: (data: any) => rows.push(...data),
        });

        const row = rows[0];
        expect(typeof row[0]).toBe("bigint");
        expect(typeof row[1]).toBe("bigint");
        expect(typeof row[6]).toBe("bigint");
        expect(typeof row[7]).toBe("bigint");
    });

    it("DOUBLE columns return number values", async () => {
        const recon = createBaseReconstruction();
        const buf = format(recon);
        const arrayBuffer = toArrayBuffer(buf);
        const metadata = parquetMetadata(arrayBuffer);

        const rows: any[][] = [];
        await parquetRead({
            file: arrayBuffer,
            metadata,
            onComplete: (data: any) => rows.push(...data),
        });

        const row = rows[0];
        expect(typeof row[2]).toBe("number");
        expect(typeof row[3]).toBe("number");
        expect(typeof row[4]).toBe("number");
        expect(typeof row[5]).toBe("number");
    });
});
