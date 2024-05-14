import Typesense from "typesense";

// Replace with your Typesense cluster URL and API key
export const client = new Typesense.Client({
    nodes: [
        {
            // host = your cluster url
            host: "https://qholmefi1ubw9vjtp-1.a1.typesense.net", // e.g., https://xxx.a1.typesense.net
            port: 443,
            protocol: "http",
        },
    ],
    apiKey: "KvWW1nVbClDuwBiNI5FPCj0fx8NxNJoR",
});
