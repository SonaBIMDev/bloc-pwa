import {
  addDoc,
  collection,
  getDocs,
  query,
  where
} from "firebase/firestore";
import { db } from "../firebase";
import type { ProblemGradeColor, ProblemRating } from "../types";

interface CreateRatingInput {
  problemId: string;
  authorId: string;
  proposedGrade: ProblemGradeColor;
}

export async function createRating(input: CreateRatingInput) {
  const docRef = await addDoc(collection(db, "ratings"), {
    problemId: input.problemId,
    authorId: input.authorId,
    proposedGrade: input.proposedGrade,
    createdAt: Date.now()
  });

  return docRef.id;
}

export async function getRatingsByProblemId(problemId: string): Promise<ProblemRating[]> {
  const ratingsRef = collection(db, "ratings");
  const q = query(ratingsRef, where("problemId", "==", problemId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...(docItem.data() as Omit<ProblemRating, "id">)
  }));
}

export async function hasUserAlreadyRated(problemId: string, authorId: string): Promise<boolean> {
  const ratingsRef = collection(db, "ratings");
  const q = query(
    ratingsRef,
    where("problemId", "==", problemId),
    where("authorId", "==", authorId)
  );

  const snapshot = await getDocs(q);
  return !snapshot.empty;
}