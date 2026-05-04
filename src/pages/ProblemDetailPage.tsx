import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../firebase";
import { getProblemById, deleteProblem } from "../services/problemsService";
import { createComment, getCommentsByProblemId } from "../services/commentsService";
import { requireGoogleUser, isCurrentUserAdmin } from "../services/authService";
import type {
  HoldType,
  Problem,
  ProblemComment,
  ProblemGradeColor
} from "../types";

const gradeColorMap: Record<ProblemGradeColor, string> = {
  blanc: "#f8fafc",
  vert: "#22c55e",
  bleu: "#3b82f6",
  rose: "#ec4899",
  orange: "#f97316",
  jaune: "#eab308",
  noir: "#ffffff"
};

export default function ProblemDetailPage() {
  const { problemId } = useParams();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [problem, setProblem] = useState<Problem | null>(null);
  const [comments, setComments] = useState<ProblemComment[]>([]);
  const [commentText, setCommentText] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setCurrentUser(nextUser);

      if (nextUser) {
        const admin = await isCurrentUserAdmin();
        setIsAdmin(admin);
      } else {
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const holdColor = useMemo<Record<HoldType, string>>(
    () => ({
      start: "#22c55e",
      inter: "#38bdf8",
      hand: "#38bdf8",
      foot: "#38bdf8",
      top: "#ef4444"
    }),
    []
  );

  const canDeleteProblem = useMemo(() => {
    if (!problem) return false;
    if (!currentUser) return false;

    return problem.authorId === currentUser.uid || isAdmin;
  }, [problem, currentUser, isAdmin]);

  async function loadComments(currentProblemId: string) {
    const data = await getCommentsByProblemId(currentProblemId);
    setComments(data);
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
        await loadComments(problemId);
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
        authorPhotoURL: user.photoURL || user.providerData[0]?.photoURL || "",
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

  async function handleDeleteProblem() {
    try {
      if (!problemId || !problem?.wallId) return;

      if (!canDeleteProblem) {
        alert("Tu n'es pas autorisé à supprimer ce bloc.");
        return;
      }

      const confirmed = window.confirm(
        "Es-tu sûr de vouloir supprimer ce bloc ?"
      );

      if (!confirmed) {
        return;
      }

      setIsDeleting(true);

      await deleteProblem(problemId);

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
      <h1
        style={{
          color: gradeColorMap[problem.grade] || "#ffffff"
        }}
      >
        {problem.name}
      </h1>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        {problem.authorPhotoURL && (
          <img
            src={problem.authorPhotoURL}
            alt={problem.authorName || "Auteur"}
            referrerPolicy="no-referrer"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              objectFit: "cover"
            }}
          />
        )}

        <p style={{ margin: 0 }}>
          <strong>Créé par :</strong> {problem.authorName || "Auteur inconnu"}
        </p>
      </div>

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
        <h2>Commentaires</h2>

        {currentUser ? (
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
        ) : (
          <p>Connecte-toi pour ajouter un commentaire.</p>
        )}

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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8
                  }}
                >
                  {comment.authorPhotoURL && (
                    <img
                      src={comment.authorPhotoURL}
                      alt={comment.authorName || "Utilisateur"}
                      referrerPolicy="no-referrer"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        objectFit: "cover"
                      }}
                    />
                  )}

                  <p style={{ margin: 0, fontSize: 14, opacity: 0.8 }}>
                    {comment.authorName || "Utilisateur"}
                  </p>
                </div>

                <p style={{ margin: 0 }}>{comment.text}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}