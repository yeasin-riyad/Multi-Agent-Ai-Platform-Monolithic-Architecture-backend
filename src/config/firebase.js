import { initializeApp, getApps, cert } from "firebase-admin/app";

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

/* ─── Validate ──────────────────────────────────────────────── */
if (
  !serviceAccount.projectId ||
  !serviceAccount.clientEmail ||
  !serviceAccount.privateKey
) {
  console.error("\n❌ Firebase credentials missing\n");
  console.error("👉 Set in .env:");
  console.error("   FIREBASE_PROJECT_ID");
  console.error("   FIREBASE_CLIENT_EMAIL");
  console.error("   FIREBASE_PRIVATE_KEY\n");
  process.exit(1);
}

if (!serviceAccount.privateKey.includes("BEGIN PRIVATE KEY")) {
  console.error(
    "❌ FIREBASE_PRIVATE_KEY looks invalid. Check BEGIN/END lines.",
  );
  process.exit(1);
}

/* ─── Initialize (idempotent) ────────────────────────────────── */
export const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert(serviceAccount),
      });

console.log("✅ Firebase initialized:", serviceAccount.projectId);

export default app;