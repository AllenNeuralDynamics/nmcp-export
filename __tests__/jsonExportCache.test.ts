import { describe, it, expect } from "vitest";
import { JsonExport } from "../src/export/jsonExportCache";
import { createBaseReconstruction, createNullFieldsReconstruction } from "./fixtures";

function format(reconstruction: any, asString: boolean): any {
    return (JsonExport as any).formatReconstruction(reconstruction, asString);
}

describe("JsonExportCache", () => {
    it("asString=true returns JSON string that parses to match input", () => {
        const recon = createBaseReconstruction();
        const result = format(recon, true);

        expect(typeof result).toBe("string");
        expect(JSON.parse(result)).toEqual(recon);
    });

    it("asString=false returns the original object reference", () => {
        const recon = createBaseReconstruction();
        const result = format(recon, false);

        expect(result).toBe(recon);
    });

    it("all fields preserved exactly", () => {
        const recon = createBaseReconstruction();
        const result = JSON.parse(format(recon, true));

        expect(result.nodes).toEqual(recon.nodes);
        expect(result.doi).toBe(recon.doi);
        expect(result.annotator).toEqual(recon.annotator);
        expect(result.neuron).toEqual(recon.neuron);
    });

    it("null fields preserved as null in output", () => {
        const recon = createNullFieldsReconstruction();
        const result = JSON.parse(format(recon, true));

        expect(result.doi).toBeNull();
        expect(result.annotator).toBeNull();
        expect(result.peerReviewer).toBeNull();
        expect(result.proofreader).toBeNull();
    });
});
