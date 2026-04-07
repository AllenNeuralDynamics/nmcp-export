import {ApiAtlasStructure} from "./graphql/atlasStructure";
import {apiClient} from "./apiClient";

export type LegacyJsonAtlasStructure = {
    allenId: number;
    name: string;
    safeName: string;
    acronym: string;
    structurePath: string;
    colorHex: string;
}

export class AtlasStructureRepository {
    private _structureIdLookup: Map<number, LegacyJsonAtlasStructure> = null;

    public getStructures(ids: number[]): LegacyJsonAtlasStructure[] {
        if (this._structureIdLookup == null) {
            return [];
        }

        return ids.map(id => this._structureIdLookup.get(id));
    }

    public async loadStructureMap() {
        if (this._structureIdLookup == null) {
            const apiStructures = await apiClient.queryAtlasStructures();

            if (apiStructures?.length > 0) {
                this._structureIdLookup = new Map<number, LegacyJsonAtlasStructure>(apiStructures.map(s => [s.structureId, convertAtlasStructure(s)]));
            }
        }
    }
}

function convertAtlasStructure(structure: ApiAtlasStructure): LegacyJsonAtlasStructure {
    return {
        allenId: structure.structureId,
        name: structure.name,
        safeName: structure.safeName,
        acronym: structure.acronym,
        structurePath: structure.structureIdPath,
        colorHex: structure.defaultColor
    };
}

export const atlasStructureRepository = new AtlasStructureRepository();
