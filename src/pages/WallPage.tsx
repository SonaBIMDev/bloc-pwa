import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../firebase";
import { getProblemsByWallId } from "../services/problemsService";
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

export default function WallPage() {
  const { wallId } = useParams();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [wall, setWall] = useState<Wall | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div>
      <h1>{wall ? wall.name : `Salle : ${wallId}`}</h1>
      <p>Liste des blocs publiés dans cette salle.</p>

      {wall && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          {wall.createdByPhotoURL && (
            <img
              src={wall.createdByPhotoURL}
              alt={wall.createdByName || "Créateur"}
              style={{
                width: 32,
                height: 32,
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

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        {currentUser ? (
          <Link
            to={`/walls/${wallId}/create`}
            style={{
              display: "inline-block",
              padding: "12px 16px",
              borderRadius: 10,
              background: "#22c55e",
              color: "#052e16",
              fontWeight: 700,
              textDecoration: "none"
            }}
          >
            Créer un bloc
          </Link>
        ) : (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              background: "#334155",
              color: "white"
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
              padding: "12px 16px",
              borderRadius: 10,
              background: "#f59e0b",
              color: "#111827",
              fontWeight: 700,
              textDecoration: "none"
            }}
          >
            Modifier la salle
          </Link>
        )}
      </div>

      {isLoading && <p>Chargement des blocs...</p>}

      {error && <p>{error}</p>}

      {!isLoading && !error && problems.length === 0 && (
        <p>Aucun bloc publié dans cette salle pour le moment.</p>
      )}

      <div style={{ display: "grid", gap: 16 }}>
        {problems.map((problem) => (
          <Link
            key={problem.id}
            to={`/problems/${problem.id}`}
            style={{
              display: "block",
              background: "#1e293b",
              borderRadius: 12,
              padding: 12,
              color: "white",
              textDecoration: "none"
            }}
          >
            <div style={{ display: "grid", gap: 10 }}>
              <img
                src={problem.imageUrl}
                alt={problem.name}
                style={{
                  width: "100%",
                  maxWidth: 420,
                  borderRadius: 10,
                  display: "block"
                }}
              />

              <div>
                <h2
                  style={{
                    margin: "0 0 8px 0",
                    color: gradeColorMap[problem.grade] || "#ffffff"
                  }}
                >
                  {problem.name}
                </h2>

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  {problem.authorPhotoURL && (
                    <img
                      src={problem.authorPhotoURL}
                      alt={problem.authorName || "Auteur"}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        objectFit: "cover"
                      }}
                    />
                  )}

                  <p style={{ margin: 0 }}>
                    <strong>Auteur :</strong> {problem.authorName || "Auteur inconnu"}
                  </p>
                </div>

                <p style={{ margin: "0 0 6px 0" }}>
                  <strong>Cotation :</strong> {problem.grade}
                </p>

                <p style={{ margin: 0 }}>
                  <strong>Prises :</strong> {problem.holds.length}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}