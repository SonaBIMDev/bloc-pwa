import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../firebase";
import {
  getProblemById,
  deleteProblem,
  incrementProblemViews,
  likeProblem,
  unlikeProblem,
  hasUserLikedProblem
} from "../services/problemsService";
import { createComment, getCommentsByProblemId } from "../services/commentsService";
import {
  markNotificationsAsReadForProblem
} from "../services/notificationsService";
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
  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

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

  const canManageProblem = useMemo(() => {
    if (!problem || !currentUser) return false;
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

        let updatedProblem = data;

        try {
          await incrementProblemViews(problemId);
          updatedProblem = {
            ...data,
            viewsCount: (data.viewsCount || 0) + 1
          };
        } catch (viewError) {
          console.error("Impossible d'incrémenter les vues :", viewError);
        }

        setProblem(updatedProblem);
        await loadComments(problemId);
      } catch (err) {
        console.error("Erreur ProblemDetailPage :", err);
        setError(
          err instanceof Error
            ? `Erreur bloc: ${err.message}`
            : "Erreur lors du chargement du bloc."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadProblem();
  }, [problemId]);

  useEffect(() => {
    async function checkLiked() {
      if (!problemId || !currentUser) return;

      const liked = await hasUserLikedProblem(problemId, currentUser.uid);
      setHasLiked(liked);
    }

    checkLiked();
  }, [problemId, currentUser]);

  useEffect(() => {
    async function markRelatedNotifications() {
      if (!currentUser || !problemId) return;
      await markNotificationsAsReadForProblem(currentUser.uid, problemId);
    }

    markRelatedNotifications();
  }, [currentUser, problemId]);

  async function handleLikeProblem() {
    try {
      if (!problemId) return;

      if (!currentUser) {
        alert("Connecte-toi pour liker un bloc.");
        return;
      }

      setIsLiking(true);

      if (hasLiked) {
        await unlikeProblem(problemId, currentUser.uid);
        setHasLiked(false);

        setProblem((prev) =>
          prev
            ? {
                ...prev,
                likesCount: Math.max((prev.likesCount || 0) - 1, 0)
              }
            : prev
        );
      } else {
        await likeProblem(problemId, currentUser.uid);
        setHasLiked(true);

        setProblem((prev) =>
          prev
            ? {
                ...prev,
                likesCount: (prev.likesCount || 0) + 1
              }
            : prev
        );
      }
    } catch (error) {
      console.error(error);
      alert("Impossible de mettre à jour le like.");
    } finally {
      setIsLiking(false);
    }
  }

async function handleAddComment() {
  if (!problemId) return;

  if (!commentText.trim()) {
    alert("Merci de saisir un commentaire.");
    return;
  }

  try {
    setIsSubmittingComment(true);

    const user = await requireGoogleUser();

    if (!user) {
      alert("Tu dois te connecter avec Google pour commenter.");
      return;
    }

    console.log("Début création commentaire");

    await createComment({
      problemId,
      authorId: user.uid,
      authorName: user.displayName || user.email || "Utilisateur",
      authorPhotoURL: user.photoURL || user.providerData[0]?.photoURL || "",
      text: commentText.trim()
    });

    console.log("Commentaire créé côté page");

    setCommentText("");

    setProblem((prev) =>
      prev
        ? {
            ...prev,
            commentsCount: (prev.commentsCount || 0) + 1
          }
        : prev
    );

    try {
      console.log("Rechargement commentaires...");
      await loadComments(problemId);
      console.log("Commentaires rechargés");
    } catch (reloadError) {
      console.error("Erreur rechargement commentaires :", reloadError);
    }
  } catch (err) {
    console.error("Erreur création commentaire :", err);
    alert(
      err instanceof Error
        ? `Impossible d'ajouter le commentaire : ${err.message}`
        : "Impossible d'ajouter le commentaire."
    );
  } finally {
    setIsSubmittingComment(false);
  }
}

  async function handleDeleteProblem() {
    try {
      if (!problemId || !problem?.wallId) return;

      if (!canManageProblem) {
        alert("Tu n'es pas autorisé à supprimer ce bloc.");
        return;
      }

      const confirmed = window.confirm("Es-tu sûr de vouloir supprimer ce bloc ?");

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
      <div
        style={{
          position: "sticky",
          top: 62,
          zIndex: 50,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 16,
          padding: "10px 0",
          background: "#000000",
          borderBottom: "1px solid #1a1a1a"
        }}
      >
        <button
          type="button"
          onClick={() => navigate(`/walls/${problem.wallId}`)}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #222222",
            background: "#111111",
            color: "white",
            fontWeight: 700,
            textTransform: "uppercase",
            cursor: "pointer"
          }}
        >
          ← Retour
        </button>

        {canManageProblem && (
          <>
            <button
              type="button"
              onClick={() => navigate(`/problems/${problem.id}/edit`)}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #222222",
                background: "#ffffff",
                color: "#000000",
                fontWeight: 700,
                textTransform: "uppercase",
                cursor: "pointer"
              }}
            >
              Modifier
            </button>

            <button
              type="button"
              onClick={handleDeleteProblem}
              disabled={isDeleting}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #222222",
                background: "#ffffff",
                color: "#000000",
                opacity: isDeleting ? 0.6 : 1,
                fontWeight: 700,
                textTransform: "uppercase",
                cursor: isDeleting ? "not-allowed" : "pointer"
              }}
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </button>
          </>
        )}
      </div>

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

        <button
          type="button"
          onClick={handleLikeProblem}
          disabled={isLiking}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: "none",
            background: "rgba(0,0,0,0.65)",
            cursor: isLiking ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0
          }}
        >
          <img
            src={hasLiked ? "/icons/heart-full.png" : "/icons/heart-empty.png"}
            alt={hasLiked ? "Retirer le like" : "Ajouter un like"}
            style={{
              width: 22,
              height: 22,
              display: "block",
              opacity: isLiking ? 0.6 : 1
            }}
          />
        </button>

        {problem.holds.map((hold, index) => (
          <div
            key={index}
            title={`${hold.type} (${index + 1})`}
            style={{
              position: "absolute",
              left: `${hold.x * 100}%`,
              top: `${hold.y * 100}%`,
              width: problem.markerSize || 18,
              height: problem.markerSize || 18,
              borderRadius: "50%",
              background: "transparent",
              border: `3px solid ${holdColor[hold.type]}`,
              boxShadow: "0 0 0 1px rgba(255,255,255,0.35)",
              transform: "translate(-50%, -50%)"
            }}
          />
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <p
          style={{
            margin: 0,
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap"
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <img
              src="/icons/eye.png"
              alt="Vues"
              style={{ width: 16, height: 16, display: "block" }}
            />
            {problem.viewsCount || 0}
          </span>

          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <img
              src="/icons/heart-full.png"
              alt="Likes"
              style={{ width: 16, height: 16, display: "block" }}
            />
            {problem.likesCount || 0}
          </span>

          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <img
              src="/icons/comments.png"
              alt="Commentaires"
              style={{ width: 16, height: 16, display: "block" }}
            />
            {problem.commentsCount || 0}
          </span>
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
                background: "#ffffff",
                color: "#000000",
                fontWeight: 700,
                cursor: isSubmittingComment ? "not-allowed" : "pointer",
                opacity: isSubmittingComment ? 0.6 : 1
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

      <div style={{ height: 140 }} />
    </div>
  );
}