// Types based on the Mouse Light JSON file format.  May include legacy fields and terminology.

export type PortalJsonNode = {
    sampleNumber: number;
    parentNumber: number;
    structureIdentifier: number;
    x: number
    y: number;
    z: number;
    radius: number;
    lengthToParent: number;
    allenId: number;
}

type PortalJsonAnnotationSpace = {
    version: number;
    description: string;
}

type PortalJsonAtlasStructure = {
    allenId: number;
    name: string;
    safeName: string;
    acronym: string;
    structurePath: string;
    colorHex: string;
}

type PortalJsonInjectionLabel = {
    virus: string;
    fluorophore: string;
}

type PortalJsonCollection = {
    name: string | null;
    description: string | null;
    reference: string | null;
}

type PortalJsonSpecimen = {
    date: string;
    subject: string;
    genotype: string;
    collection: PortalJsonCollection;
}

export type PortalJsonReconstruction = {
    idString: string;
    DOI: string | null;
    sample: PortalJsonSpecimen;
    label: PortalJsonInjectionLabel | null;
    annotationSpace: PortalJsonAnnotationSpace;
    annotator: string | null;
    peerReviewer: string | null;
    proofreader: string | null;
    soma: PortalJsonNode | null;
    axon: PortalJsonNode[];
    dendrite: PortalJsonNode[];
    allenInformation: PortalJsonAtlasStructure[];
}

export type PortalJsonReconstructionContainer = {
    comment: string;
    neurons: PortalJsonReconstruction[];
}
