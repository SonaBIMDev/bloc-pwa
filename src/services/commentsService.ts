import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  where,
  updateDoc,
  doc,
  increment,
  getDoc
} from "firebase/firestore";
import { db } from "../firebase";
import type { ProblemComment, Problem } from "../types";
import { createNotification } from "./notificationsService";

interface CreateCommentInput {
  problemId: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  text: string;
}

export async function createComment(input: CreateCommentInput) {
  const docRef = await addDoc(collection(db, "comments"), {
    problemId: input.problemId,
    authorId: input.authorId,
    authorName: input.authorName,
    authorPhotoURL: input.authorPhotoURL || "",
    text: input.text,
    createdAt: Date.now()
  });

  const problemRef = doc(db, "problems", input.problemId);
  await updateDoc(problemRef, {
    commentsCount: increment(1)
  });

  const problemSnapshot = await getDoc(problemRef);

  if (problemSnapshot.exists()) {
    const problem = {
      id: problemSnapshot.id,
      ...(problemSnapshot.data() as Omit<Problem, "id">)
    };

    if (problem.authorId && problem.authorId !== input.authorId) {
      await createNotification({
        userId: problem.authorId,
        type: "new_comment",
        title: "Nouveau commentaire",
        message: `${input.authorName} a commenté ton bloc "${problem.name}"`,
        wallId: problem.wallId,
        problemId: input.problemId
      });
    }
  }

  return docRef.id;
}

export async function getCommentsByProblemId(problemId: string): Promise<ProblemComment[]> {
  const commentsRef = collection(db, "comments");
  const q = query(
    commentsRef,
    where("problemId", "==", problemId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...(docItem.data() as Omit<ProblemComment, "id">)
  }));
}