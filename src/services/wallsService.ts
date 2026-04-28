import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc
} from "firebase/firestore";
import { db } from "../firebase";
import type { Wall } from "../types";

interface CreateWallInput {
  name: string;
  createdBy: string;
  createdByName: string;
  createdByPhotoURL?: string;
}

export async function createWall(input: CreateWallInput) {
  const docRef = await addDoc(collection(db, "walls"), {
    name: input.name,
    createdBy: input.createdBy,
    createdByName: input.createdByName,
    createdByPhotoURL: input.createdByPhotoURL || "",
    createdAt: Date.now()
  });

  return docRef.id;
}

export async function getWalls(): Promise<Wall[]> {
  const wallsRef = collection(db, "walls");
  const q = query(wallsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...(docItem.data() as Omit<Wall, "id">)
  }));
}

export async function getWallById(wallId: string): Promise<Wall | null> {
  const wallRef = doc(db, "walls", wallId);
  const snapshot = await getDoc(wallRef);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<Wall, "id">)
  };
}

export async function updateWall(wallId: string, name: string) {
  const wallRef = doc(db, "walls", wallId);
  await updateDoc(wallRef, { name });
}

export async function deleteWall(wallId: string) {
  const wallRef = doc(db, "walls", wallId);
  await deleteDoc(wallRef);
}