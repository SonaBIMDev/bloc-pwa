import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProblemById, deleteProblem } from "../services/problemsService";
import { createComment, getCommentsByProblemId } from "../services/commentsService";
import {
  createRating,
  getRatingsByProblemId,
  hasUserAlreadyRated
} from "../services/ratingsService";
import { requireGoogleUser } from "../services/authService";
import type {
  HoldType,
  Problem,
  ProblemComment,
  ProblemGradeColor,
  ProblemRating
} from "../types";

const gradeColors: ProblemGradeColor[] = [
  "blanc",
  "vert",
  "bleu",
  "rose",
  "orange",
  "jaune",
  "noir"
];


const colorMap: Record<ProblemGradeColor, string> = {
  blanc: "#f8fafc",
  vert: "#22c55e",
  bleu: "#3b82f6",
  rose: "#ec4899",
  orange: "#f97316",
  jaune: "#eab308",
  noir: "#0f172a"
};

export default function ProblemDetailPage() {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [comments, setComments] = useState<ProblemComment[]>([]);
  const [ratings, setRatings] = useState<ProblemRating[]>([]);
  const [commentText, setCommentText] = useState("");
  const [proposedGrade, setProposedGrade] = useState<ProblemGradeColor>("bleu");
  const [hasRated, setHasRated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");

    const holdColor = useMemo<Record<HoldType, string>>(
    () => ({
        start: "#22c55e",
        inter: "#38bdf8",
        top: "#ef4444"
    }),
    []
    );
    
    const canDeleteProblem = !!problem && !!currentUserId && problem.authorId === currentUserId;
  const ratingSummary = useMemo(() => {
    if (ratings.length === 0) return null;

    const counts: Record<string, number> = {};
    for (const rating of ratings) {
      counts[rating.proposedGrade] = (counts[rating.proposedGrade] || 0) + 1;
    }

    let topGrade = "";
    let topCount = 0;

    for (const [grade, count] of Object.entries(counts)) {
      if (count > topCount) {
        topGrade = grade;
        topCount = count;
      }
    }

    return {
      count: ratings.length,
      topGrade
    };
  }, [ratings]);

  async function loadComments(currentProblemId: string) {
    const data = await getCommentsByProblemId(currentProblemId);
    setComments(data);
  }

  async function loadRatings(currentProblemId: string) {
    const data = await getRatingsByProblemId(currentProblemId);
    setRatings(data);
  }

  async function checkIfCurrentUserRated(currentProblemId: string) {
  const user = await requireGoogleUser();

  if (!user) {
    setHasRated(false);
    return;
  }

  const alreadyRated = await hasUserAlreadyRated(currentProblemId, user.uid);
  setHasRated(alreadyRated);
}

  useEffect(() => {
  async function loadProblem() {
    try {
      if (!problemId) {
        setError("Bloc introuvable.");
        return;
      }

      const data = await getProblemById(problemId);

      if (!data) {
        setError("Bloc non trouvé.");
        return;
      }

      setProblem(data);

      const user = await requireGoogleUser();
        setCurrentUserId(user?.uid || "");

      await loadComments(problemId);
      await loadRatings(problemId);
      await checkIfCurrentUserRated(problemId);
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement du bloc.");
    } finally {
      setIsLoading(false);
    }
  }

  loadProblem();
}, [problemId]);

  async function handleAddComment() {
    try {
      if (!problemId) return;

      if (!commentText.trim()) {
        alert("Merci de saisir un commentaire.");
        return;
      }

      setIsSubmittingComment(true);

      const user = await requireGoogleUser();

        if (!user) {
        alert("Tu dois te connecter avec Google pour commenter.");
        return;
        }

      await createComment({
        problemId,
        authorId: user.uid,
        authorName: user.displayName || user.email || "Utilisateur",
        text: commentText.trim()
        });

      setCommentText("");
      await loadComments(problemId);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'ajout du commentaire.");
    } finally {
      setIsSubmittingComment(false);
    }
  }

  async function handleAddRating() {
    try {
      if (!problemId) return;

      if (hasRated) {
        alert("Tu as déjà proposé une cotation pour ce bloc.");
        return;
      }

      setIsSubmittingRating(true);

      const user = await requireGoogleUser();

        if (!user) {
        alert("Tu dois te connecter avec Google pour proposer une cotation.");
        return;
        }

      await createRating({
        problemId,
        authorId: user.uid,
        proposedGrade
      });

      await loadRatings(problemId);
      await checkIfCurrentUserRated(problemId);

      alert("Proposition de cotation enregistrée.");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement de la cotation.");
    } finally {
      setIsSubmittingRating(false);
    }
  }

  async function handleDeleteProblem() {
  try {
    if (!canDeleteProblem) {
        alert("Tu n'es pas autorisé à supprimer ce bloc.");
        return;
    }

    if (!problemId || !problem?.wallId) return;

    const confirmed = window.confirm(
      "Es-tu sûr de vouloir supprimer ce bloc ?"
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    await deleteProblem(problemId);

    alert("Bloc supprimé.");
    navigate(`/walls/${problem.wallId}`);
  } catch (err) {
    console.error(err);
    alert("Erreur lors de la suppression du bloc.");
  } finally {
    setIsDeleting(false);
  }
}

  if (isLoading) {
    return <p>Chargement du bloc...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!problem) {
    return <p>Bloc introuvable.</p>;
  }

  return (
    <div>
      <h1>{problem.name}</h1>
    <p>
      <strong>Créé par :</strong> {problem.authorName || "Auteur inconnu"}
    </p>

        {canDeleteProblem && (
  <div style={{ marginTop: 12, marginBottom: 16 }}>
    <button
      onClick={handleDeleteProblem}
      disabled={isDeleting}
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        border: "none",
        background: isDeleting ? "#64748b" : "#ef4444",
        color: "white",
        fontWeight: 700,
        cursor: isDeleting ? "not-allowed" : "pointer"
      }}
    >
      {isDeleting ? "Suppression..." : "Supprimer le bloc"}
    </button>
  </div>
)}

      <p>
        <strong>Cotation proposée par le créateur :</strong> {problem.grade}
      </p>

      {problem.description ? (
        <p>
          <strong>Description :</strong> {problem.description}
        </p>
      ) : (
        <p>Aucune description.</p>
      )}

      <div
        style={{
          position: "relative",
          display: "inline-block",
          width: "100%",
          maxWidth: 700,
          marginTop: 16
        }}
      >
        <img
          src={problem.imageUrl}
          alt={problem.name}
          style={{ width: "100%", display: "block", borderRadius: 12 }}
        />

        {problem.holds.map((hold, index) => (
          <div
            key={index}
            title={`${hold.type} (${index + 1})`}
            style={{
              position: "absolute",
              left: `${hold.x * 100}%`,
              top: `${hold.y * 100}%`,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: holdColor[hold.type],
              border: "2px solid white",
              transform: "translate(-50%, -50%)"
            }}
          />
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <p>
          <strong>Nombre de prises :</strong> {problem.holds.length}
        </p>
      </div>

      <section style={{ marginTop: 32 }}>
        <h2>Propositions de cotation</h2>

        {ratingSummary ? (
          <div style={{ marginBottom: 16 }}>
            <p>
              <strong>Nombre de votes :</strong> {ratingSummary.count}
            </p>
            <p>
              <strong>Tendance actuelle :</strong> {ratingSummary.topGrade}
            </p>
          </div>
        ) : (
          <p>Aucune proposition de cotation pour le moment.</p>
        )}

        <div style={{ display: "grid", gap: 12, maxWidth: 700 }}>
          <label>
            <div style={{ marginBottom: 8 }}>Ta proposition :</div>
            <select
              value={proposedGrade}
              onChange={(e) => setProposedGrade(e.target.value as ProblemGradeColor)}
              disabled={hasRated || isSubmittingRating}
              style={{ padding: 12, borderRadius: 8, border: "none", minWidth: 220 }}
            >
              {gradeColors.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {gradeColors.map((grade) => (
              <div
                key={grade}
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: colorMap[grade],
                  color: grade === "blanc" || grade === "jaune" ? "#111" : "white",
                  border: grade === "blanc" ? "1px solid #cbd5e1" : "none",
                  fontWeight: 700
                }}
              >
                {grade}
              </div>
            ))}
          </div>

          <button
            onClick={handleAddRating}
            disabled={hasRated || isSubmittingRating}
            style={{
              width: "fit-content",
              padding: "12px 16px",
              borderRadius: 10,
              border: "none",
              background: hasRated ? "#64748b" : "#a78bfa",
              color: hasRated ? "white" : "#2e1065",
              fontWeight: 700,
              cursor: hasRated || isSubmittingRating ? "not-allowed" : "pointer"
            }}
          >
            {hasRated
              ? "Cotation déjà proposée"
              : isSubmittingRating
              ? "Envoi..."
              : "Proposer une cotation"}
          </button>
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Commentaires</h2>

        <div style={{ display: "grid", gap: 12, maxWidth: 700 }}>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={4}
            placeholder="Ajouter un commentaire sur ce bloc"
            style={{ padding: 12, borderRadius: 8, border: "none" }}
          />

          <button
            onClick={handleAddComment}
            disabled={isSubmittingComment}
            style={{
              width: "fit-content",
              padding: "12px 16px",
              borderRadius: 10,
              border: "none",
              background: isSubmittingComment ? "#64748b" : "#38bdf8",
              color: "#082f49",
              fontWeight: 700,
              cursor: isSubmittingComment ? "not-allowed" : "pointer"
            }}
          >
            {isSubmittingComment ? "Envoi..." : "Ajouter un commentaire"}
          </button>
        </div>

        <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
          {comments.length === 0 ? (
            <p>Aucun commentaire pour le moment.</p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                style={{
                    background: "#1e293b",
                    borderRadius: 12,
                    padding: 12,
                    maxWidth: 700
                }}
                >
                <p style={{ margin: "0 0 8px 0", fontSize: 14, opacity: 0.8 }}>
                    {comment.authorName || "Utilisateur"}
                </p>
                <p style={{ margin: 0 }}>{comment.text}</p>
                </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}