const admin = require('firebase-admin');
const fs = require('fs');

// Path to service account key
const serviceAccount = require('./serviceAccountKey.json');

// Initialise the app
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();


async function exportCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  const docs = [];

  snapshot.forEach(doc => {
    docs.push({
      id: doc.id,
      ...doc.data()
    });
  });

  fs.writeFileSync(`${collectionName}.json`, JSON.stringify(docs, null, 2));
  console.log(`Exported ${docs.length} documents from ${collectionName}`);
}


exportCollection('users')
