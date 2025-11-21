import {ApolloClient, ApolloLink, concat, HttpLink, InMemoryCache} from "@apollo/client/core";
import {removeTypenameFromVariables} from "@apollo/client/link/remove-typename";

import {gql} from "graphql-tag";

const debug = require("debug")("nmcp:export-api:api-client");

import {ServiceOptions} from "../options/serviceOptions";

export class ApiClient {
    private _client: any;

    constructor() {
        const url = `http://${ServiceOptions.apiService.host}:${ServiceOptions.apiService.port}${ServiceOptions.apiService.graphQLEndpoint}`;

        const httpLink = new HttpLink({uri: url});

        const authMiddleware = new ApolloLink((operation, forward) => {
            // add the authorization to the headers
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
            cache: new InMemoryCache()
        });
    }

    public async queryReconstruction(id: string): Promise<object> {
        try {
            const result = await this._client.query({
                query: gql`
                    query ReconstructionAsJSON($id: String!, $options: PortalReconstructionInput){
                        reconstructionAsJSON(id: $id, options: $options){
                            comment
                            neurons {
                                id
                                idString
                                DOI
                                soma {
                                    x
                                    y
                                    z
                                    allenId
                                }
                                sample {
                                    subject
                                    date
                                    genotype
                                    collection {
                                        id
                                        name
                                    }
                                }
                                label {
                                    virus
                                    fluorophore
                                }
                                annotator
                                peerReviewer
                                proofreader
                                axon {
                                    x
                                    y
                                    z
                                    radius
                                    sampleNumber
                                    parentNumber
                                    allenId
                                    structureIdentifier
                                }
                                axonChunkInfo {
                                    totalCount
                                    offset
                                    limit
                                    hasMore
                                }
                                dendrite {
                                    x
                                    y
                                    z
                                    radius
                                    sampleNumber
                                    parentNumber
                                    allenId
                                    structureIdentifier
                                }
                                dendriteChunkInfo {
                                    totalCount
                                    offset
                                    limit
                                    hasMore
                                }
                            }
                        }
                    }`,
                variables: {id: id},
                fetchPolicy: "network-only"
            });

            const obj = result?.data?.reconstructionAsJSON || null;

            // const obj = data ? JSON.parse(data) : null;

            return obj && obj.neurons && obj.neurons.length > 0 ? obj.neurons[0] : null;
        } catch (err) {
            debug(err);
        }

        return null;
    }
}

export const apiClient = new ApiClient();
