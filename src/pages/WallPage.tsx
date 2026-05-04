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
              background: "#22c55e",
              color: "#04130a",
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
              background: "#f59e0b",
              color: "#111827",
              fontWeight: 700,
              textDecoration: "none",
              textTransform: "uppercase"
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

      <div style={{ display: "grid", gap: 10 }}>
        {problems.map((problem) => (
          <Link
            key={problem.id}
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