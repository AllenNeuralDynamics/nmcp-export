import {gql} from "graphql-tag";
import {PortalReconstruction} from "../../io/portalJson";

export const EXPORTED_ATLAS_RECONSTRUCTION_QUERY = gql`query exportedAtlasReconstruction($id: String!) {
    exportedAtlasReconstruction(id: $id) {
        id
        annotationSpace
        annotator {
            displayName
            affiliation
            email
        }
        peerReviewer {
            displayName
            affiliation
            email
        }
        proofreader {
            displayName
            affiliation
            email
        }
        neuron {
            id
            label
            specimen {
                label
                date
                genotype
                injections {
                    fluorophore
                    virus
                }
                collection {
                    id
                    name
                    description
                    reference
                }
            }
        }
        nodes {
            index
            structure
            x
            y
            z
            radius
            parentIndex
            lengthToParent
            atlasStructure
        }
    }
}`;

export type ExportedAtlasReconstructionVariables = {
    id: string;
}

export type ExportedAtlasReconstructionResponse = {
    exportedAtlasReconstruction: PortalReconstruction;
}