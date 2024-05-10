import Typesense from "typesense";

// Replace with your Typesense cluster URL and API key
export const client = new Typesense.Client({
    nodes: [
        {
            // host = your cluster url
            host: "127.0.0.0.1", // e.g., https://xxx.a1.typesense.net
            port: 8085,
            protocol: "http",
        },
    ],
    apiKey: "Oxj7jO37uWIO8vWH7gfi9oZKqpnA1j0M",
});
