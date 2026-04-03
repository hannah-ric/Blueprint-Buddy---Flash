import { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";
import firebaseConfig from "../../firebase-applet-config.json" with { type: "json" };

// Initialize Firebase Admin with project config.
// In Google Cloud environments (Cloud Run), this uses Application Default Credentials.
// For local dev, set GOOGLE_APPLICATION_CREDENTIALS env var to a service account key path,
// or the middleware will skip verification when SKIP_AUTH_VERIFY=true.
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

export interface AuthenticatedRequest extends Request {
  uid?: string;
}

export async function verifyFirebaseToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Allow skipping auth in development for easier testing
  if (process.env.SKIP_AUTH_VERIFY === "true") {
    req.uid = req.body?.userId || "dev-user";
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.uid = decodedToken.uid;
    next();
  } catch (error) {
    console.error("Token verification failed:", error instanceof Error ? error.message : error);
    res.status(401).json({ error: "Invalid or expired authentication token" });
  }
}
