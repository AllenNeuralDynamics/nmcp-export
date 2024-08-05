import {ApolloClient, ApolloLink, concat, HttpLink, InMemoryCache} from '@apollo/client/core';

import {gql} from "graphql-tag";

const debug = require("debug")("nmcp:export-api:api-client");

import {ServiceOptions} from "../options/serviceOptions";

export class ApiClient {
    private _client: any;

    constructor() {
        const url = `http://${ServiceOptions.apiService.host}:${ServiceOptions.apiService.port}${ServiceOptions.apiService.graphQLEndpoint}`;

        const httpLink = new HttpLink({ uri: url });

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

        this._client = new ApolloClient({
            link: concat(authMiddleware, httpLink),
            cache: new InMemoryCache()
        });
    }

    public async queryReconstruction(id: string): Promise<object> {
        try {
            const result = await this._client.query({
                query: gql`
                    query NeuronReconstructionData($id: String!){
                        neuronReconstructionData(id: $id)
                    }`,
                variables: {id: id},
                fetchPolicy: "network-only"
            });

            const data = result?.data?.neuronReconstructionData || null;

            const obj = data ? JSON.parse(data) : null;

            return obj && obj.neurons &&obj.neurons.length > 0 ? obj.neurons[0] : null;
        } catch (err) {
            debug(err);
        }

        return null;
    }
}

export const apiClient = new ApiClient();
