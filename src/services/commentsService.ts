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
import { getSubscriptionsByWallId } from "./subscriptionsService";

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

  console.log("Commentaire créé :", docRef.id);

  const problemRef = doc(db, "problems", input.problemId);
  await updateDoc(problemRef, {
    commentsCount: increment(1)
  });

  console.log("commentsCount incrémenté pour problemId =", input.problemId);

  const problemSnapshot = await getDoc(problemRef);

  if (problemSnapshot.exists()) {
    const problem = {
      id: problemSnapshot.id,
      ...(problemSnapshot.data() as Omit<Problem, "id">)
    };

    console.log("Bloc chargé pour notification :", problem);

    const targetUserIds = new Set<string>();

    if (problem.authorId) {
      targetUserIds.add(problem.authorId);
    }

    if (problem.wallId) {
      const subscriptions = await getSubscriptionsByWallId(problem.wallId);

      subscriptions.forEach((subscription) => {
        if (subscription.userId) {
          targetUserIds.add(subscription.userId);
        }
      });
    }

    targetUserIds.delete(input.authorId);

    console.log("Destinataires notification commentaire :", [...targetUserIds]);

    await Promise.all(
      [...targetUserIds].map(async (userId) => {
        try {
          const notificationId = await createNotification({
            userId,
            type: "new_comment",
            title: "Nouveau commentaire",
            message: `${input.authorName} a commenté le bloc "${problem.name}"`,
            wallId: problem.wallId,
            problemId: input.problemId
          });

          console.log("Notification commentaire créée :", notificationId, "pour", userId);
        } catch (notificationError) {
          console.error(
            "Erreur création notification commentaire pour",
            userId,
            ":",
            notificationError
          );
        }
      })
    );
  } else {
    console.warn("Impossible de charger le bloc pour créer la notification");
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