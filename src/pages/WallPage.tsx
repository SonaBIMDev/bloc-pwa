import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../firebase";
import { getProblemsByWallId, deleteProblem } from "../services/problemsService";
import { getWallById } from "../services/wallsService";
import type { Problem, Wall, ProblemGradeColor } from "../types";

const SUPER_ADMIN_EMAIL = "pierrotnavarra@gmail.com";

const gradeColorMap: Record<ProblemGradeColor, string> = {
  blanc: "#f8fafc",
  vert: "#22c55e",
  bleu: "#3b82f6",
  rose: "#ec4899",
  orange: "#f97316",
  jaune: "#eab308",
  noir: "#ffffff"
};

type SortMode = "recent" | "likes" | "views";

export default function WallPage() {
  const { wallId } = useParams();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [wall, setWall] = useState<Wall | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("recent");

  const [swipedProblemId, setSwipedProblemId] = useState<string | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function loadWallAndProblems() {
      try {
        if (!wallId) {
          setError("Salle introuvable.");
          return;
        }

        const [wallData, problemsData] = await Promise.all([
          getWallById(wallId),
          getProblemsByWallId(wallId)
        ]);

        if (!wallData) {
          setError("Salle non trouvée.");
          return;
        }

        setWall(wallData);
        setProblems(problemsData);
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement de la salle.");
      } finally {
        setIsLoading(false);
      }
    }

    loadWallAndProblems();
  }, [wallId]);

  const isSuperAdmin = useMemo(() => {
    return currentUser?.email === SUPER_ADMIN_EMAIL;
  }, [currentUser]);

  const canManageWall = useMemo(() => {
    if (!currentUser || !wall) return false;
    return wall.createdBy === currentUser.uid || isSuperAdmin;
  }, [currentUser, wall, isSuperAdmin]);

  const sortedProblems = useMemo(() => {
    const items = [...problems];

    items.sort((a, b) => {
      if (sortMode === "likes") {
        return (b.likesCount || 0) - (a.likesCount || 0);
      }

      if (sortMode === "views") {
        return (b.viewsCount || 0) - (a.viewsCount || 0);
      }

      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    return items;
  }, [problems, sortMode]);

  async function handleDeleteProblem(problemId: string) {
    try {
      const confirmed = window.confirm("Supprimer ce bloc ?");
      if (!confirmed) return;

      await deleteProblem(problemId);

      setProblems((prev) => prev.filter((item) => item.id !== problemId));
      if (swipedProblemId === problemId) {
        setSwipedProblemId(null);
      }
    } catch (error) {
      console.error(error);
      alert("Impossible de supprimer le bloc.");
    }
  }

  return (
    <div>
      <h1>{wall ? wall.name : `Salle : ${wallId}`}</h1>

      {wall?.photoURL && (
        <img
          src={wall.photoURL}
          alt={wall.name}
          style={{
            width: "100%",
            maxWidth: 700,
            height: 180,
            objectFit: "cover",
            borderRadius: 12,
            marginBottom: 12
          }}
        />
      )}

      {wall?.locationLabel && (
        <p>
          <strong>Lieu :</strong> {wall.locationLabel}
        </p>
      )}

      {wall?.mapsUrl && (
        <a
          href={wall.mapsUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-block",
            marginBottom: 16,
            color: "#38bdf8",
            textDecoration: "none",
            fontWeight: 700
          }}
        >
          Voir la localisation
        </a>
      )}

      <p>Liste des blocs publiés dans cette salle.</p>

      {wall && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          {wall.createdByPhotoURL && (
            <img
              src={wall.createdByPhotoURL}
              alt={wall.createdByName || "Créateur"}
              referrerPolicy="no-referrer"
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                objectFit: "cover"
              }}
            />
          )}

          <p style={{ margin: 0 }}>
            <strong>Créée par :</strong> {wall.createdByName || "Auteur inconnu"}
          </p>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
        {currentUser ? (
          <Link
            to={`/walls/${wallId}/create`}
            style={{
              display: "inline-block",
              padding: "10px 14px",
              borderRadius: 8,
              background: "#ffffff",
              color: "#000000",
              fontWeight: 700,
              textDecoration: "none",
              textTransform: "uppercase"
            }}
          >
            Créer un bloc
          </Link>
        ) : (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              background: "#111111",
              color: "white",
              border: "1px solid #222222"
            }}
          >
            Connecte-toi pour créer un bloc
          </div>
        )}

        {canManageWall && (
          <Link
            to={`/walls/${wallId}/edit`}
            style={{
              display: "inline-block",
              padding: "10px 14px",
              borderRadius: 8,
              background: "#ffffff",
              color: "#000000",
              fontWeight: 700,
              textDecoration: "none",
              textTransform: "uppercase"
            }}
          >
            Modifier la salle
          </Link>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label>
          <span style={{ marginRight: 8 }}>Trier par</span>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            style={{ padding: 8, borderRadius: 8 }}
          >
            <option value="recent">Plus récents</option>
            <option value="likes">Plus likés</option>
            <option value="views">Plus vus</option>
          </select>
        </label>
      </div>

      {isLoading && <p>Chargement des blocs...</p>}
      {error && <p>{error}</p>}

      {!isLoading && !error && problems.length === 0 && (
        <p>Aucun bloc publié dans cette salle pour le moment.</p>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {sortedProblems.map((problem) => {
          const canManageProblem =
            !!currentUser &&
            (problem.authorId === currentUser.uid || isSuperAdmin);

          return (
            <div
              key={problem.id}
              onTouchStart={(e) => {
                if (!canManageProblem) return;
                setTouchStartX(e.changedTouches[0].clientX);
              }}
              onTouchEnd={(e) => {
                if (!canManageProblem || touchStartX === null) return;

                const touchEndX = e.changedTouches[0].clientX;
                const deltaX = touchEndX - touchStartX;

                if (deltaX < -60) {
                  setSwipedProblemId(problem.id || null);
                } else if (deltaX > 30) {
                  setSwipedProblemId(null);
                }

                setTouchStartX(null);
              }}
              style={{
                position: "relative"
              }}
            >
              <Link
                to={`/problems/${problem.id}`}
                style={{
                  display: "block",
                  background: "#101010",
                  borderRadius: 10,
                  padding: 10,
                  color: "white",
                  textDecoration: "none",
                  border: "1px solid #1f1f1f"
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "84px 1fr",
                    gap: 10,
                    alignItems: "start"
                  }}
                >
                  <img
                    src={problem.imageUrl}
                    alt={problem.name}
                    style={{
                      width: 84,
                      height: 84,
                      borderRadius: 8,
                      objectFit: "cover",
                      display: "block"
                    }}
                  />

                  <div>
                    <h2
                      style={{
                        margin: "0 0 6px 0",
                        color: gradeColorMap[problem.grade] || "#ffffff"
                      }}
                    >
                      {problem.name}
                    </h2>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      {problem.authorPhotoURL && (
                        <img
                          src={problem.authorPhotoURL}
                          alt={problem.authorName || "Auteur"}
                          referrerPolicy="no-referrer"
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            objectFit: "cover"
                          }}
                        />
                      )}

                      <p style={{ margin: 0 }}>
                        <strong>Auteur :</strong> {problem.authorName || "Auteur inconnu"}
                      </p>
                    </div>

                    <p style={{ margin: "0 0 4px 0" }}>
                      <strong>Cotation :</strong> {problem.grade}
                    </p>

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
                          src="/icons/heart-full.png"
                          alt="Likes"
                          style={{ width: 14, height: 14, display: "block" }}
                        />
                        {problem.likesCount || 0}
                      </span>

                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <img
                          src="/icons/eye.png"
                          alt="Vues"
                          style={{ width: 14, height: 14, display: "block" }}
                        />
                        {problem.viewsCount || 0}
                      </span>
                    </p>
                  </div>
                </div>
              </Link>

              {canManageProblem && swipedProblemId === problem.id && (
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    justifyContent: "flex-end"
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleDeleteProblem(problem.id!)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 8,
                      border: "none",
                      background: "#ffffff",
                      color: "#000000",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      cursor: "pointer"
                    }}
                  >
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}