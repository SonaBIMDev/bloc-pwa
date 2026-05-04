import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../firebase";
import { getWalls } from "../services/wallsService";
import type { Wall } from "../types";

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [walls, setWalls] = useState<Wall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
    });

    return () => unsubscribe();
  }, []);

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

      {user ? (
        <Link
          to="/walls/create"
          style={{
            display: "inline-block",
            padding: "10px 14px",
            borderRadius: 8,
            background: "#22c55e",
            color: "#04130a",
            fontWeight: 700,
            textDecoration: "none",
            marginBottom: 18,
            textTransform: "uppercase"
          }}
        >
          Créer une salle
        </Link>
      ) : (
        <p style={{ opacity: 0.8 }}>Connecte-toi pour créer une salle.</p>
      )}

      {isLoading && <p>Chargement des salles...</p>}
      {error && <p>{error}</p>}

      {!isLoading && !error && walls.length === 0 && (
        <p>Aucune salle de bloc pour le moment.</p>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {walls.map((wall) => (
          <Link
            key={wall.id}
            to={`/walls/${wall.id}`}
            style={{
              display: "block",
              padding: 14,
              borderRadius: 10,
              background: "#101010",
              color: "white",
              textDecoration: "none",
              border: "1px solid #1f1f1f"
            }}
          >
            <div style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>
              {wall.name}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}