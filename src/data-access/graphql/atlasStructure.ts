import {gql} from "graphql-tag";

export const ATLAS_STRUCTURE_QUERY= gql`query AtlasStructureQuery {
    atlasStructures {
        name
        safeName
        acronym
        structureId
        structureIdPath
        defaultColor
    }
}`;

export type ApiAtlasStructure = {
    name: string;
    safeName: string;
    acronym: string;
    structureId: number;
    structureIdPath: string;
    defaultColor: string;
}

export type AtlasStructureQueryResponse = {
    atlasStructures: ApiAtlasStructure[];
}