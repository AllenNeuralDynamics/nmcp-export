import { describe, it, expect } from "vitest";
import { SwcExport } from "../src/export/swcExportCache";
import {
    createBaseReconstruction,
    createNullFieldsReconstruction,
    createRawAnnotationSpaceReconstruction,
    createSpecimenSpaceReconstruction,
} from "./fixtures";

const ATLAS_SPACE_LINE = "# Annotation Space:\t\tCCFv3.0 Axes> X: Anterior-Posterior; Y: Inferior-Superior; Z:Left-Right";

function format(reconstruction: any): string {
    return (SwcExport as any).formatReconstruction(reconstruction, true);
}

describe("SwcExportCache", () => {
    it("header contains doi, neuron label, specimen label, date, genotype, injection fields", () => {
        const recon = createBaseReconstruction();
        const output = format(recon);
        const lines = output.split("\n");

        expect(lines[1]).toContain("10.1234/test-doi");
        expect(lines[2]).toContain("neuron-label-1");
        expect(lines[4]).toContain("specimen-label-1");
        expect(lines[5]).toContain("Cre-driver-1");
        expect(lines[6]).toContain("AAV-virus-1");
        expect(lines[7]).toContain("GFP");
    });

    it("null DOI shows n/a in header", () => {
        const recon = createNullFieldsReconstruction();
        const output = format(recon);
        const lines = output.split("\n");

        expect(lines[1]).toContain("n/a");
    });

    it("formats each node as index structure x y z radius parentIndex", () => {
        const recon = createBaseReconstruction();
        const output = format(recon);
        const nodeLines = output.split("\n").filter(l => !l.startsWith("#") && l.trim() !== "");

        const first = nodeLines[0].split(" ");
        expect(first[0]).toBe("1");
        expect(first[1]).toBe("1");
        expect(first[2]).toBe("100.100000");
        expect(first[3]).toBe("200.200000");
        expect(first[4]).toBe("300.300000");
        expect(first[5]).toBe("5.000000");
        expect(first[6]).toBe("-1");
    });

    it("output contains a line for every node", () => {
        const recon = createBaseReconstruction();
        const output = format(recon);
        const nodeLines = output.split("\n").filter(l => !l.startsWith("#") && l.trim() !== "");

        expect(nodeLines).toHaveLength(recon.nodes.length);
    });

    it("node order is preserved from input", () => {
        const recon = createBaseReconstruction();
        const output = format(recon);
        const nodeLines = output.split("\n").filter(l => !l.startsWith("#") && l.trim() !== "");

        const indices = nodeLines.map(l => parseInt(l.split(" ")[0]));
        expect(indices).toEqual(recon.nodes.map(n => n.index));
    });

    it("null genotype shows empty string in header", () => {
        const recon = createNullFieldsReconstruction();
        const output = format(recon);
        const lines = output.split("\n");
        const strainLine = lines.find(l => l.includes("Sample Strain"));

        expect(strainLine).toMatch(/Sample Strain:\s*$/);
    });

    it("atlas space emits the CCFv3.0 annotation space line", () => {
        const output = format(createBaseReconstruction());
        const lines = output.split("\n");

        expect(lines).toContain(ATLAS_SPACE_LINE);
    });

    it("specimen space omits the annotation space line entirely", () => {
        const output = format(createSpecimenSpaceReconstruction());
        const lines = output.split("\n");

        expect(lines.some(l => l.includes("Annotation Space"))).toBe(false);
        expect(lines.some(l => l.includes("CCFv3.0"))).toBe(false);
    });

    it("specimen space keeps every other header line", () => {
        const atlasLines = format(createBaseReconstruction()).split("\n");
        const specimenLines = format(createSpecimenSpaceReconstruction()).split("\n");

        expect(specimenLines.some(l => l.includes("Terms-of-Use"))).toBe(true);

        const atlasHeaders = atlasLines.filter(l => l.startsWith("#"));
        const specimenHeaders = specimenLines.filter(l => l.startsWith("#"));
        expect(specimenHeaders).toHaveLength(atlasHeaders.length - 1);
    });

    // Written against the raw numbers the API sends rather than the enum, so this fails if the local
    // enum drifts from ../nmcp-api's values.
    it.each([
        [200, true],
        [100, false],
        [null, false],
        [undefined, false],
        [1, false],
        [999, false],
    ])("raw annotationSpace %s decides the CCFv3.0 line", (value, expected) => {
        const output = format(createRawAnnotationSpaceReconstruction(value as any));
        const lines = output.split("\n");

        expect(lines.some(l => l.includes("Annotation Space"))).toBe(expected);
    });

    it("node data is identical across annotation spaces", () => {
        const atlasNodes = format(createBaseReconstruction()).split("\n").filter(l => !l.startsWith("#"));
        const specimenNodes = format(createSpecimenSpaceReconstruction()).split("\n").filter(l => !l.startsWith("#"));

        expect(specimenNodes).toEqual(atlasNodes);
    });
});
