import admin from "firebase-admin";
require("dotenv").config();
const serviceAccount = require('../service_account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as any),
});

const db = admin.firestore();
export { admin, db };
