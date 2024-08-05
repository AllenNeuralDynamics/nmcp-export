const apiService = {
    host: "nmcp-api",
    port: 5000,
    graphQLEndpoint: "/graphql",
    authentication: ""
};

const configuration = {
    port: 5000,
    dataPath: "/opt/data/export",
    apiService: apiService
};

function loadConfiguration() {
    const options = Object.assign({}, configuration);

    options.port = parseInt(process.env.EXPORT_API_PORT) || options.port;
    options.dataPath = process.env.EXPORT_API_DATA_PATH || options.dataPath;

    options.apiService.host = process.env.NMCP_API_HOST || process.env.CORE_SERVICES_HOST || options.apiService.host;
    options.apiService.port = parseInt(process.env.NMCP_API_PORT) || options.apiService.port;
    options.apiService.graphQLEndpoint = process.env.NMCP_API_ENDPOINT || process.env.CORE_SERVICES_ENDPOINT || apiService.graphQLEndpoint;
    options.apiService.authentication = process.env.NMCP_AUTHENTICATION_KEY || apiService.authentication;

    return options;
}

export const ServiceOptions = loadConfiguration();
