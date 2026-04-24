import { addDoc, collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "../firebase";
import type { ProblemComment } from "../types";

interface CreateCommentInput {
  problemId: string;
  authorId: string;
  authorName: string;
  text: string;
}

export async function createComment(input: CreateCommentInput) {
  const docRef = await addDoc(collection(db, "comments"), {
    problemId: input.problemId,
    authorId: input.authorId,
    authorName: input.authorName,
    text: input.text,
    createdAt: Date.now()
  });

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