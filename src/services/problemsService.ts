import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  increment,
  setDoc
} from "firebase/firestore";
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
  markerSize?: number;
}

interface UpdateProblemInput {
  name: string;
  grade: ProblemGradeColor;
  description: string;
  holds: HoldPoint[];
  markerSize?: number;
}

export async function createProblem(input: CreateProblemInput) {
  const existingProblemsQuery = query(
    collection(db, "problems"),
    where("wallId", "==", input.wallId),
    where("authorId", "==", input.authorId)
  );

  const existingProblemsSnapshot = await getDocs(existingProblemsQuery);
  const isFirstProblemForAuthorInWall = existingProblemsSnapshot.empty;

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
    markerSize: input.markerSize || 18,
    createdAt: Date.now(),
    likesCount: 0,
    viewsCount: 0,
    commentsCount: 0
  });

  const wallRef = doc(db, "walls", input.wallId);

  await updateDoc(wallRef, {
    blocksCount: increment(1),
    ...(isFirstProblemForAuthorInWall ? { climbersCount: increment(1) } : {})
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
  const snapshot = await getDoc(problemRef);

  if (!snapshot.exists()) return;

  const problem = snapshot.data() as Omit<Problem, "id">;

  const sameAuthorProblemsQuery = query(
    collection(db, "problems"),
    where("wallId", "==", problem.wallId),
    where("authorId", "==", problem.authorId)
  );

  const sameAuthorProblemsSnapshot = await getDocs(sameAuthorProblemsQuery);

  await deleteDoc(problemRef);

  const wallRef = doc(db, "walls", problem.wallId);

  const shouldDecrementClimbersCount = sameAuthorProblemsSnapshot.size <= 1;

  await updateDoc(wallRef, {
    blocksCount: increment(-1),
    ...(shouldDecrementClimbersCount ? { climbersCount: increment(-1) } : {})
  });
}

export async function updateProblem(problemId: string, input: UpdateProblemInput) {
  const problemRef = doc(db, "problems", problemId);

  await updateDoc(problemRef, {
    name: input.name,
    grade: input.grade,
    description: input.description,
    holds: input.holds,
    markerSize: input.markerSize || 18
  });
}

export async function incrementProblemViews(problemId: string) {
  const problemRef = doc(db, "problems", problemId);

  await updateDoc(problemRef, {
    viewsCount: increment(1)
  });
}

export async function hasUserLikedProblem(problemId: string, userId: string) {
  const likeRef = doc(db, "problems", problemId, "likes", userId);
  const snapshot = await getDoc(likeRef);
  return snapshot.exists();
}

export async function likeProblem(problemId: string, userId: string) {
  const likeRef = doc(db, "problems", problemId, "likes", userId);
  const problemRef = doc(db, "problems", problemId);

  await setDoc(likeRef, {
    userId,
    createdAt: Date.now()
  });

  await updateDoc(problemRef, {
    likesCount: increment(1)
  });
}

export async function unlikeProblem(problemId: string, userId: string) {
  const likeRef = doc(db, "problems", problemId, "likes", userId);
  const problemRef = doc(db, "problems", problemId);

  await deleteDoc(likeRef);

  await updateDoc(problemRef, {
    likesCount: increment(-1)
  });
}