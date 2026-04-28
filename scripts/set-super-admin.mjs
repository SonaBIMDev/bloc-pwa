import admin from "firebase-admin";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const serviceAccountPath = resolve("scripts/service-account.json");
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const targetEmail = "pierrotnavarra@gmail.com";

async function run() {
  try {
    const user = await admin.auth().getUserByEmail(targetEmail);

    await admin.auth().setCustomUserClaims(user.uid, {
      admin: true
    });

    console.log(`Super admin défini pour ${targetEmail} (uid: ${user.uid})`);
    console.log("Déconnecte-toi puis reconnecte-toi pour récupérer le nouveau claim.");
  } catch (error) {
    console.error("Erreur lors de l'attribution du rôle admin :", error);
    process.exit(1);
  }
}

run();