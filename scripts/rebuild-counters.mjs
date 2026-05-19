import admin from "firebase-admin";
import fs from "fs";

const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function rebuildCounters() {
  console.log("Lecture des collections...");

  const [wallsSnap, problemsSnap, commentsSnap] = await Promise.all([
    db.collection("walls").get(),
    db.collection("problems").get(),
    db.collection("comments").get()
  ]);

  const walls = wallsSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));

  const problems = problemsSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));

  const comments = commentsSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));

  console.log(`Walls: ${walls.length}`);
  console.log(`Problems: ${problems.length}`);
  console.log(`Comments: ${comments.length}`);

  console.log("Lecture des likes par bloc...");
  const likesCountByProblemId = {};

  for (const problem of problems) {
    const likesSnap = await db
      .collection("problems")
      .doc(problem.id)
      .collection("likes")
      .get();

    likesCountByProblemId[problem.id] = likesSnap.size;
  }

  console.log("Calcul des commentaires par bloc...");
  const commentsCountByProblemId = {};

  for (const comment of comments) {
    const problemId = comment.problemId;
    if (!problemId) continue;

    commentsCountByProblemId[problemId] =
      (commentsCountByProblemId[problemId] || 0) + 1;
  }

  console.log("Mise à jour des blocs...");
  const batchSize = 300;
  let batch = db.batch();
  let batchOps = 0;

  for (const problem of problems) {
    const problemRef = db.collection("problems").doc(problem.id);

    const commentsCount = commentsCountByProblemId[problem.id] || 0;
    const likesCount = likesCountByProblemId[problem.id] || 0;

    batch.update(problemRef, {
      commentsCount,
      likesCount
    });

    batchOps++;

    if (batchOps >= batchSize) {
      await batch.commit();
      batch = db.batch();
      batchOps = 0;
    }
  }

  if (batchOps > 0) {
    await batch.commit();
  }

  console.log("Calcul des stats de salles...");
  const wallStats = {};

  for (const wall of walls) {
    wallStats[wall.id] = {
      blocksCount: 0,
      climbers: new Set()
    };
  }

  for (const problem of problems) {
    const wallId = problem.wallId;
    const authorId = problem.authorId;

    if (!wallId || !wallStats[wallId]) continue;

    wallStats[wallId].blocksCount += 1;

    if (authorId) {
      wallStats[wallId].climbers.add(authorId);
    }
  }

  console.log("Mise à jour des salles...");
  batch = db.batch();
  batchOps = 0;

  for (const wall of walls) {
    const stats = wallStats[wall.id] || {
      blocksCount: 0,
      climbers: new Set()
    };

    const wallRef = db.collection("walls").doc(wall.id);

    batch.update(wallRef, {
      blocksCount: stats.blocksCount,
      climbersCount: stats.climbers.size
    });

    batchOps++;

    if (batchOps >= batchSize) {
      await batch.commit();
      batch = db.batch();
      batchOps = 0;
    }
  }

  if (batchOps > 0) {
    await batch.commit();
  }

  console.log("Recalcul terminé.");
}

rebuildCounters()
  .then(() => {
    console.log("Succès.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Erreur pendant le recalcul :", error);
    process.exit(1);
  });