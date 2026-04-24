import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getProblemsByWallId } from "../services/problemsService";
import type { Problem } from "../types";

export default function WallPage() {
  const { wallId } = useParams();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProblems() {
      try {
        if (!wallId) {
          setError("Mur introuvable.");
          return;
        }

        const data = await getProblemsByWallId(wallId);
        setProblems(data);
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement des blocs.");
      } finally {
        setIsLoading(false);
      }
    }

    loadProblems();
  }, [wallId]);

  return (
    <div>
      <h1>Mur : {wallId}</h1>
      <p>Liste des blocs publiés sur ce mur.</p>

      <Link
        to={`/walls/${wallId}/create`}
        style={{
          display: "inline-block",
          padding: "12px 16px",
          borderRadius: 10,
          background: "#22c55e",
          color: "#052e16",
          fontWeight: 700,
          textDecoration: "none",
          marginBottom: 20
        }}
      >
        Créer un bloc
      </Link>

      {isLoading && <p>Chargement des blocs...</p>}

      {error && <p>{error}</p>}

      {!isLoading && !error && problems.length === 0 && (
        <p>Aucun bloc publié sur ce mur pour le moment.</p>
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
                <h2 style={{ margin: "0 0 8px 0" }}>{problem.name}</h2>

                <p style={{ margin: "0 0 6px 0" }}>
                  <strong>Auteur :</strong> {problem.authorName || "Auteur inconnu"}
                </p>

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