import { client } from "../config/typesense.config.js";

export const createTypesenseUserCollections=async() =>{
    // Every 'collection' in Typesense needs a schema. A collection only
    // needs to be created one time before you index your first document.
    //
    // Alternatively, use auto schema detection:
    // https://typesense.org/docs/latest/api/collections.html#with-auto-schema-detection
    const usersCollection = {
        name: "users",
        fields: [
            { name: "id", type: "string" },
            { name: "username", type: "string" },
            { name: "firstname", type: "string" },
            { name: "lastname", type: "string" },
            { name: "email", type: "string" },
            { name: "role", type: "string" },
            { name: "roleId", type: "string" },
            { name: "companyId", type: "string" },
            { name: "isActive", type: "boolean" },
            { name: "resetPasswordToken", type: "object" },
            // { name: "resetPasswordToken.hash", type: "string" },
            // { name: "resetPasswordToken.salt", type: "string" },
            { name: "resetPasswordToken.expiredTime", type: "datetime" },
            { name: "currentOtp", type: "object" },
            // { name: "currentOtp.hash", type: "string" },
            // { name: "currentOtp.salt", type: "string" },
            // { name: "currentOtp.expiredTime", type: "datetime" },
            // { name: "currentOtp.isVerified", type: "boolean" },
            // { name: "currentOtp.createdTime", type: "datetime" },
            { name: "createdAt", type: "FeildValue" },
            { name: "isLocked", type: "boolean" },
            { name: "invalidAttempt", type: "object" },
            // { name: "invalidAttempt.count", type: "integer" },
            // { name: "invalidAttempt.lastAttemptTime", type: "datetime" },
        ],
    };

    await client.collections().create(usersCollection);
};
