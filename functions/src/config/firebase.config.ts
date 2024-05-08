import { initializeApp, App, cert, ServiceAccount } from "firebase-admin/app";
import serviceAccountKey from "../../fir-functions-9c002-firebase-adminsdk-fn49x-e30a8a6839.json" assert { type: "json" };
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = serviceAccountKey as ServiceAccount;

const firebaseApp: App = initializeApp({
    credential: cert(serviceAccount),
    
});

export const firebaseAuth = getAuth(firebaseApp);
export const firebaseDB = getFirestore(firebaseApp);
export default firebaseApp;
