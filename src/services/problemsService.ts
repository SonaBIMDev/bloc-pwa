import { addDoc, collection, doc, getDoc, getDocs, query, where, orderBy, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { HoldPoint, Problem, ProblemGradeColor } from "../types";

interface CreateProblemInput {
  wallId: string;
  authorId: string;
  authorName: string;
  name: string;
  grade: ProblemGradeColor;
  description: string;
  imageUrl: string;
  authorPhotoURL?: string;
  holds: HoldPoint[];
}

export async function createProblem(input: CreateProblemInput) {
  const docRef = await addDoc(collection(db, "problems"), {
    wallId: input.wallId,
    authorId: input.authorId,
    authorName: input.authorName,
    authorPhotoURL: input.authorPhotoURL || "",
    name: input.name,
    grade: input.grade,
    description: input.description,
    imageUrl: input.imageUrl,
    holds: input.holds,
    createdAt: Date.now(),
    likesCount: 0,
    commentsCount: 0
  });

  return docRef.id;
}

export async function getProblemById(problemId: string): Promise<Problem | null> {
  const problemRef = doc(db, "problems", problemId);
  const snapshot = await getDoc(problemRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<Problem, "id">)
  };
}

export async function getProblemsByWallId(wallId: string): Promise<Problem[]> {
  const problemsRef = collection(db, "problems");
  const q = query(
    problemsRef,
    where("wallId", "==", wallId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...(docItem.data() as Omit<Problem, "id">)
  }));
}

export async function deleteProblem(problemId: string) {
  const problemRef = doc(db, "problems", problemId);
  await deleteDoc(problemRef);
}