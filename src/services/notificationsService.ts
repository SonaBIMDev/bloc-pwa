import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "../firebase";
import type { AppNotification, AppNotificationType } from "../types";

interface CreateNotificationInput {
  userId: string;
  type: AppNotificationType;
  title: string;
  message: string;
  wallId?: string;
  problemId?: string;
  version?: string;
}

interface LatestVersionInfo {
  latestVersion: string;
  message?: string;
}

export async function createNotification(input: CreateNotificationInput) {
  const docRef = await addDoc(collection(db, "notifications"), {
    userId: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    wallId: input.wallId || "",
    problemId: input.problemId || "",
    version: input.version || "",
    isRead: false,
    createdAt: Date.now()
  });

  return docRef.id;
}

export async function getNotificationsByUserId(userId: string): Promise<AppNotification[]> {
  console.log("Lecture notifications pour userId =", userId);

  const snapshot = await getDocs(
    query(
      collection(db, "notifications"),
      where("userId", "==", userId)
    )
  );

  const items = snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...(docItem.data() as Omit<AppNotification, "id">)
  }));

  items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  console.log("Nombre de notifications trouvées =", items.length);
  console.log("Notifications trouvées =", items);

  return items;
}

export async function getUnreadNotificationsCountByUserId(userId: string) {
  const snapshot = await getDocs(
    query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("isRead", "==", false)
    )
  );

  return snapshot.size;
}

export async function markNotificationAsRead(notificationId: string) {
  const ref = doc(db, "notifications", notificationId);
  await updateDoc(ref, { isRead: true });
}

export async function markAllNotificationsAsRead(userId: string) {
  const snapshot = await getDocs(
    query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("isRead", "==", false)
    )
  );

  await Promise.all(
    snapshot.docs.map((item) =>
      updateDoc(doc(db, "notifications", item.id), { isRead: true })
    )
  );
}

export async function markNotificationsAsReadForProblem(userId: string, problemId: string) {
  const snapshot = await getDocs(
    query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("problemId", "==", problemId),
      where("isRead", "==", false)
    )
  );

  await Promise.all(
    snapshot.docs.map((item) =>
      updateDoc(doc(db, "notifications", item.id), { isRead: true })
    )
  );
}

export async function getLatestAppVersionInfo(): Promise<LatestVersionInfo | null> {
  const ref = doc(db, "appConfig", "public");
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  return {
    latestVersion: typeof data.latestVersion === "string" ? data.latestVersion : "",
    message: typeof data.message === "string" ? data.message : ""
  };
}