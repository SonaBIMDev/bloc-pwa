import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getWalls } from "../services/wallsService";
import type { Wall } from "../types";

export default function HomePage() {
  const [walls, setWalls] = useState<Wall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadWalls() {
      try {
        const data = await getWalls();
        setWalls(data);
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement des salles.");
      } finally {
        setIsLoading(false);
      }
    }

    loadWalls();
  }, []);

  return (
    <div>
      <h1>Salles de Bloc</h1>
      <p>Choisi un lieu pour pouvoir créer des blocs.</p>

      <Link
        to="/walls/create"
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
        Créer une salle
      </Link>

      {isLoading && <p>Chargement des salles...</p>}
      {error && <p>{error}</p>}

      {!isLoading && !error && walls.length === 0 && (
        <p>Aucune salle de bloc pour le moment.</p>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {walls.map((wall) => (
          <Link
            key={wall.id}
            to={`/walls/${wall.id}`}
            style={{
              display: "block",
              padding: 16,
              borderRadius: 12,
              background: "#1e293b",
              color: "white",
              textDecoration: "none"
            }}
          >
            {wall.name}
          </Link>
        ))}
      </div>
    </div>
  );
}