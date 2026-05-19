import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "../firebase";
import type { AppNotification } from "../types";

interface CreateNotificationInput {
  userId: string;
  type: "new_problem";
  title: string;
  message: string;
  wallId?: string;
  problemId?: string;
}

export async function createNotification(input: CreateNotificationInput) {
  const docRef = await addDoc(collection(db, "notifications"), {
    userId: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    wallId: input.wallId || "",
    problemId: input.problemId || "",
    isRead: false,
    createdAt: Date.now()
  });

  return docRef.id;
}

export async function getNotificationsByUserId(userId: string): Promise<AppNotification[]> {
  const snapshot = await getDocs(
    query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    )
  );

  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...(docItem.data() as Omit<AppNotification, "id">)
  }));
}

export async function markNotificationAsRead(notificationId: string) {
  const ref = doc(db, "notifications", notificationId);
  await updateDoc(ref, { isRead: true });
}