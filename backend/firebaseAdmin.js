import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let firebaseAuth;

export function getFirebaseAdminAuth() {
  if (firebaseAuth) {
    return firebaseAuth;
  }

  const clientProjectId = "shnoor-parking-system";
  const projectId = process.env.FIREBASE_PROJECT_ID || clientProjectId;
  if (projectId !== clientProjectId) {
    throw new Error(`FIREBASE_PROJECT_ID must match the frontend Firebase project ${clientProjectId}.`);
  }
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const appOptions = { projectId };

  if (serviceAccountJson) {
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch (error) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON must contain valid JSON", { cause: error });
    }
    if (!serviceAccount || typeof serviceAccount !== "object" || Array.isArray(serviceAccount)) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON must contain a JSON object.");
    }
    if (typeof serviceAccount.private_key === "string") {
      serviceAccount.private_key = serviceAccount.private_key
        .replace(/\\r\\n/g, "\n")
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\r\n?/g, "\n");
    }
    if (serviceAccount.project_id && serviceAccount.project_id !== projectId) {
      throw new Error(`Firebase service account project must match ${projectId}.`);
    }
    appOptions.credential = cert(serviceAccount);
  } else {
    appOptions.credential = applicationDefault();
  }

  const existingApp = getApps().find((app) => app.name === "shnoor-parking");
  const app = existingApp || initializeApp(appOptions, "shnoor-parking");
  firebaseAuth = getAuth(app);
  return firebaseAuth;
}
