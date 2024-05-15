import { CollectionCreateSchema } from "typesense/lib/Typesense/Collections.js";
import { client } from "../config/typesense.config.js";
import { firebaseDB } from "../config/firebase.config.js";
import { FIREBASE_CONSTANTS } from "../constants/firebase.js";

const usersCollection = firebaseDB.collection(
    FIREBASE_CONSTANTS.FIRESTORE.USERS
);
const schema: CollectionCreateSchema = {
    name: "users",
    fields: [
        { name: "id", type: "string" },
        { name: "firstname", type: "string" },
        { name: "lastname", type: "string" },
    ],
};
(async () => {
    try {
        const collections = await client.collections().retrieve();
        const collectionNames = collections.map(
            (collection) => collection.name
        );
        if (!collectionNames.includes("users")) {
            await client.collections().create(schema);
        }

        const firestoreUsers = [];
        const userSnapshot = await usersCollection.get();
        userSnapshot.forEach((doc) => {
            const userData = doc.data();
            firestoreUsers.push({ id: doc.id, ...userData });
        });
        const usersToImport = firestoreUsers.map((user) => ({
            data: JSON.stringify(user),
        }));
        
        await client.collections("users").documents().import(usersToImport);
    } catch (error) {
        console.error("Error:", error);
    }
})();

// client.collections().create(schema);
// (async () => {
//     try {
//         const collections = await client.collections().retrieve();
//         const collectionNames = collections.map(
//             (collection) => collection.name
//         );

//         if (!collectionNames.includes("users")) {
//             await client.collections().create(schema);
//             console.log("Collection users created successfully");
//         }
//         const firestoreUsers = [];
//         const userSnapshot = await usersCollection.get();
//         userSnapshot.forEach((doc) => {
//             firestoreUsers.push({ id: doc.id, ...doc.data() });
//         });

//         console.log(firestoreUsers, "firestoreUsers");
//         const usersToImport:any = firestoreUsers.map(book => JSON.stringify(book));
//         console.log(usersToImport, "usersToImport");
//         // const usersObjects = usersToImport.map((userString) => {
//         //     const userObj = JSON.parse(userString);
//         //     return {
//         //         data: JSON.stringify({
//         //             ...userObj,
//         //             isActive: userObj.isActive, // Add the isActive field explicitly
//         //         }),
//         //     };
//         // });

//         client.collections("users").documents().import(usersToImport);
//         console.log("Collection users already exists...");
//     } catch (error) {
//         console.log("eeeeeeeeeeeee",error.message);
//         console.error("Error:", error);
//     }
// })();
// .then(async () => {

// })
// .catch((error) => console.error("Error creating collection:", error));
