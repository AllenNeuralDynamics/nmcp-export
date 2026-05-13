import { PortalAnnotationSpace, PortalReconstruction } from "../src/io/portalJson";

const baseSpecimen = {
    id: "specimen-1",
    label: "specimen-label-1",
    date: 1700000000000,
    genotype: "Cre-driver-1",
    collection: {
        id: "collection-1",
        name: "Test Collection",
        description: "A test collection",
        reference: "https://example.com/collection",
    },
    injections: [
        { virus: "AAV-virus-1", fluorophore: "GFP" },
    ],
};

const baseAnnotator = {
    id: "annotator-1",
    displayName: "Alice Annotator",
    affiliation: "Test Lab",
    email: "alice@test.com",
};

const basePeerReviewer = {
    id: "reviewer-1",
    displayName: "Bob Reviewer",
    affiliation: "Test Lab",
    email: "bob@test.com",
};

export function createBaseReconstruction(): PortalReconstruction {
    return {
        id: "recon-1",
        annotationSpace: PortalAnnotationSpace.Atlas,
        doi: "10.1234/test-doi",
        neuron: {
            id: "neuron-1",
            label: "neuron-label-1",
            specimen: { ...baseSpecimen },
        },
        annotator: { ...baseAnnotator },
        peerReviewer: { ...basePeerReviewer },
        proofreader: null,
        nodes: [
            { index: 1, structure: 1, x: 100.1, y: 200.2, z: 300.3, radius: 5.0, parentIndex: -1, atlasStructure: 997, lengthToParent: 0 },
            { index: 2, structure: 2, x: 110.5, y: 210.5, z: 310.5, radius: 1.5, parentIndex: 1, atlasStructure: 512, lengthToParent: 15.3 },
            { index: 3, structure: 2, x: 120.9, y: 220.9, z: 320.9, radius: 1.2, parentIndex: 2, atlasStructure: null, lengthToParent: 12.1 },
            { index: 4, structure: 3, x: 130.0, y: 230.0, z: 330.0, radius: 2.0, parentIndex: 1, atlasStructure: 315, lengthToParent: 20.0 },
            { index: 5, structure: 3, x: 140.0, y: 240.0, z: 340.0, radius: 1.8, parentIndex: 4, atlasStructure: 315, lengthToParent: 18.5 },
        ],
    };
}

export function createAxonFromDendriteReconstruction(): PortalReconstruction {
    const recon = createBaseReconstruction();
    recon.nodes[1].parentIndex = 4;
    return recon;
}

export function createNullFieldsReconstruction(): PortalReconstruction {
    return {
        id: "recon-null",
        annotationSpace: PortalAnnotationSpace.Atlas,
        doi: null,
        neuron: {
            id: "neuron-null",
            label: "neuron-label-null",
            specimen: {
                id: "specimen-null",
                label: "specimen-label-null",
                date: null,
                genotype: null,
                collection: {
                    id: "collection-null",
                    name: null,
                    description: null,
                    reference: null,
                },
                injections: [],
            },
        },
        annotator: null,
        peerReviewer: null,
        proofreader: null,
        nodes: [
            { index: 1, structure: 1, x: 50.0, y: 60.0, z: 70.0, radius: 3.0, parentIndex: -1 },
            { index: 2, structure: 2, x: 55.0, y: 65.0, z: 75.0, radius: 1.0, parentIndex: 1 },
            { index: 3, structure: 3, x: 60.0, y: 70.0, z: 80.0, radius: 1.0, parentIndex: 1 },
        ],
    };
}
