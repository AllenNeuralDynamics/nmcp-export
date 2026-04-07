import {ApolloClient, ApolloLink, HttpLink, InMemoryCache, NormalizedCacheObject} from "@apollo/client/core";
import {removeTypenameFromVariables} from "@apollo/client/link/remove-typename";

const debug = require("debug")("nmcp:export-api:api-client");

import {ServiceOptions} from "../options/serviceOptions";
import {PortalReconstruction} from "../io/portalJson";
import {
    EXPORTED_SPECIMEN_RECONSTRUCTION_QUERY,
    ExportedSpecimenReconstructionResponse,
    ExportedSpecimenReconstructionVariables
} from "./graphql/specimenReconstruction";
import {EXPORTED_ATLAS_RECONSTRUCTION_QUERY, ExportedAtlasReconstructionResponse, ExportedAtlasReconstructionVariables} from "./graphql/atlasReconstruction";
import {ApiAtlasStructure, ATLAS_STRUCTURE_QUERY, AtlasStructureQueryResponse} from "./graphql/atlasStructure";

export class ApiClient {
    private _client: ApolloClient<NormalizedCacheObject>;

    constructor() {
        const url = `http://${ServiceOptions.apiService.host}:${ServiceOptions.apiService.port}${ServiceOptions.apiService.graphQLEndpoint}`;

        const httpLink = new HttpLink({uri: url});

        const authMiddleware = new ApolloLink((operation, forward) => {
            operation.setContext({
                headers: {
                    authorization: ServiceOptions.apiService.authentication
                }
            });

            return forward(operation);
        })

        debug(`creating apollo client for api service ${url}`);

        const removeTypenameLink = removeTypenameFromVariables();

        const link = ApolloLink.from([
            authMiddleware,
            removeTypenameLink,
            httpLink
        ]);

        this._client = new ApolloClient({
            link: link,
            cache: new InMemoryCache({addTypename: false})
        });
    }

    public async queryAtlasReconstruction(id: string): Promise<PortalReconstruction> {
        try {
            const {data} = await this._client.query<ExportedAtlasReconstructionResponse, ExportedAtlasReconstructionVariables>({
                query: EXPORTED_ATLAS_RECONSTRUCTION_QUERY,
                variables: {id: id},
                fetchPolicy: "no-cache"
            });

            return data?.exportedAtlasReconstruction || null;
        } catch (err) {
            debug(err);
        }

        return null;
    }

    public async querySpecimenSpaceReconstruction(id: string): Promise<PortalReconstruction> {
        try {
            const {data} = await this._client.query<ExportedSpecimenReconstructionResponse, ExportedSpecimenReconstructionVariables>({
                query: EXPORTED_SPECIMEN_RECONSTRUCTION_QUERY,
                variables: {id: id},
                fetchPolicy: "no-cache"
            });

            return data?.exportedSpecimenReconstruction || null;
        } catch (err) {
            debug(err);
        }

        return null;
    }

    public async queryAtlasStructures(): Promise<ApiAtlasStructure[]> {
        try {
            const {data} = await this._client.query<AtlasStructureQueryResponse>({
                query: ATLAS_STRUCTURE_QUERY,
                fetchPolicy: "no-cache"
            });

            return data?.atlasStructures || null;
        } catch (err) {
            debug(err);
        }

        return null;
    }
}

export const apiClient = new ApiClient();
