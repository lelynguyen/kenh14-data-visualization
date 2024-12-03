// backend/firebase.js
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://kenh14-data-visualization-default-rtdb.asia-southeast1.firebasedatabase.app/",
});

const db = admin.database();

module.exports = db;
