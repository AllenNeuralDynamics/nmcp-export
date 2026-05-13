import { describe, it, expect, vi } from "vitest";

vi.mock("../src/data-access/atlasStructure", () => {
    return {
        atlasStructureRepository: {
            getStructures: vi.fn().mockReturnValue([]),
        },
    };
});

import { LegacyJsonExport } from "../src/export/legacyJsonExportCache";
import { createBaseReconstruction, createAxonFromDendriteReconstruction, createNullFieldsReconstruction } from "./fixtures";

function format(reconstruction: any, asString: boolean = false): any {
    return (LegacyJsonExport as any).formatReconstruction(reconstruction, asString);
}

describe("LegacyJsonExportCache", () => {

    it("returns { comment, neurons: [neuron] } container", () => {
        const recon = createBaseReconstruction();
        const result = format(recon);

        expect(result).toHaveProperty("comment");
        expect(result).toHaveProperty("neurons");
        expect(result.neurons).toHaveLength(1);
    });

    it("separates nodes by structure: soma, axon (structure=2), dendrite (structure=3)", () => {
        const recon = createBaseReconstruction();
        const result = format(recon);
        const neuron = result.neurons[0];

        expect(neuron.soma.structureIdentifier).toBe(1);
        neuron.axon.slice(1).forEach((n: any) => expect(n.structureIdentifier).toBe(2));
        neuron.dendrite.slice(1).forEach((n: any) => expect(n.structureIdentifier).toBe(3));
    });

    it("soma is prepended at index 0 of both axon and dendrite arrays", () => {
        const recon = createBaseReconstruction();
        const result = format(recon);
        const neuron = result.neurons[0];

        expect(neuron.axon[0].structureIdentifier).toBe(1);
        expect(neuron.dendrite[0].structureIdentifier).toBe(1);
    });

    it("reindexes sampleNumbers starting from 1 in each array independently", () => {
        const recon = createBaseReconstruction();
        const result = format(recon);
        const neuron = result.neurons[0];

        const axonNumbers = neuron.axon.map((n: any) => n.sampleNumber);
        expect(axonNumbers).toEqual([1, 2, 3]);

        const dendriteNumbers = neuron.dendrite.map((n: any) => n.sampleNumber);
        expect(dendriteNumbers).toEqual([1, 2, 3]);
    });

    it("updates parentNumbers to match new sampleNumbers", () => {
        const recon = createBaseReconstruction();
        const result = format(recon);
        const neuron = result.neurons[0];

        expect(neuron.axon[0].parentNumber).toBe(-1);
        expect(neuron.axon[1].parentNumber).toBe(1);
        expect(neuron.axon[2].parentNumber).toBe(2);

        expect(neuron.dendrite[0].parentNumber).toBe(-1);
        expect(neuron.dendrite[1].parentNumber).toBe(1);
        expect(neuron.dendrite[2].parentNumber).toBe(2);
    });

    it("reparents axon node whose parent is a dendrite index to soma (parentNumber=1)", () => {
        const recon = createAxonFromDendriteReconstruction();
        const result = format(recon);
        const neuron = result.neurons[0];

        expect(neuron.axon[1].parentNumber).toBe(1);
    });

    it("does NOT emit reparent warning when axon parent is in dendriteSampleNumbers", () => {
        const recon = createAxonFromDendriteReconstruction();
        const result = format(recon);

        expect(result.comment).not.toContain("WARNING");
    });

    it("emits reparent warning when axon parent is not in axon or dendrite sets", () => {
        const recon = createBaseReconstruction();
        recon.nodes[1].parentIndex = 999;
        const result = format(recon);

        expect(result.comment).toContain("WARNING");
    });

    it("maps metadata fields correctly", () => {
        const recon = createBaseReconstruction();
        const result = format(recon);
        const neuron = result.neurons[0];

        expect(neuron.DOI).toBe("10.1234/test-doi");
        expect(neuron.annotator).toBe("Alice Annotator");
        expect(neuron.peerReviewer).toBe("Bob Reviewer");
        expect(neuron.proofreader).toBe("");
        expect(neuron.idString).toBe("neuron-label-1");
        expect(neuron.sample.subject).toBe("specimen-label-1");
    });

    it("null annotator/proofreader default to empty string", () => {
        const recon = createNullFieldsReconstruction();
        const result = format(recon);
        const neuron = result.neurons[0];

        expect(neuron.annotator).toBe("");
        expect(neuron.peerReviewer).toBe("");
        expect(neuron.proofreader).toBe("");
    });

    it("null atlasStructure produces null allenId in output", () => {
        const recon = createBaseReconstruction();
        const result = format(recon);
        const neuron = result.neurons[0];

        const axonNodeWithNull = neuron.axon[2];
        expect(axonNodeWithNull.allenId).toBeNull();
    });

    it("null/undefined lengthToParent produces null in output", () => {
        const recon = createNullFieldsReconstruction();
        const result = format(recon);
        const neuron = result.neurons[0];

        neuron.axon.forEach((n: any) => {
            expect(n.lengthToParent).toBeNull();
        });
    });

    it("populates allenInformation from atlasStructure values", () => {
        const recon = createBaseReconstruction();
        const result = format(recon);
        const neuron = result.neurons[0];

        expect(neuron).toHaveProperty("allenInformation");
        expect(Array.isArray(neuron.allenInformation)).toBe(true);
    });
});
