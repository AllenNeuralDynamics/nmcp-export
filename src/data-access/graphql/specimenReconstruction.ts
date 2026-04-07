import {gql} from "graphql-tag";
import {PortalReconstruction} from "../../io/portalJson";

export const EXPORTED_SPECIMEN_RECONSTRUCTION_QUERY = gql`query exportedSpecimenReconstruction($id: String!) {
    exportedSpecimenReconstruction(id: $id) {
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
            atlasStructure
        }
    }
}`;

export type ExportedSpecimenReconstructionVariables = {
    id: string;
}

export type ExportedSpecimenReconstructionResponse = {
    exportedSpecimenReconstruction: PortalReconstruction;
}