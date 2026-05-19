import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where
} from "firebase/firestore";
import { db } from "../firebase";
import type { WallSubscription } from "../types";

export async function subscribeToWall(userId: string, wallId: string) {
  const existing = await getDocs(
    query(
      collection(db, "wallSubscriptions"),
      where("userId", "==", userId),
      where("wallId", "==", wallId)
    )
  );

  if (!existing.empty) {
    return existing.docs[0].id;
  }

  const docRef = await addDoc(collection(db, "wallSubscriptions"), {
    userId,
    wallId,
    createdAt: Date.now()
  });

  return docRef.id;
}

export async function unsubscribeFromWall(userId: string, wallId: string) {
  const snapshot = await getDocs(
    query(
      collection(db, "wallSubscriptions"),
      where("userId", "==", userId),
      where("wallId", "==", wallId)
    )
  );

  for (const item of snapshot.docs) {
    await deleteDoc(doc(db, "wallSubscriptions", item.id));
  }
}

export async function isUserSubscribedToWall(userId: string, wallId: string) {
  const snapshot = await getDocs(
    query(
      collection(db, "wallSubscriptions"),
      where("userId", "==", userId),
      where("wallId", "==", wallId)
    )
  );

  return !snapshot.empty;
}

export async function getSubscriptionsByWallId(wallId: string): Promise<WallSubscription[]> {
  const snapshot = await getDocs(
    query(collection(db, "wallSubscriptions"), where("wallId", "==", wallId))
  );

  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...(docItem.data() as Omit<WallSubscription, "id">)
  }));
}