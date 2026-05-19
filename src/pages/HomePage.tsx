import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { getWalls } from "../services/wallsService";
import { getProblemsByWallId } from "../services/problemsService";
import { isCurrentUserAdmin } from "../services/authService";
import type { Wall } from "../types";

type WallWithStats = Wall & {
  blocksCount: number;
  climbersCount: number;
};

export default function HomePage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [walls, setWalls] = useState<WallWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      if (nextUser) {
        const admin = await isCurrentUserAdmin();
        setIsAdmin(admin);
      } else {
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function loadWalls() {
      try {
        const wallsData = await getWalls();

        const wallsWithStats = await Promise.all(
          wallsData.map(async (wall) => {
            const problems = wall.id ? await getProblemsByWallId(wall.id) : [];

            const uniqueAuthors = new Set(
              problems.map((problem) => problem.authorId).filter(Boolean)
            );

            return {
              ...wall,
              blocksCount: problems.length,
              climbersCount: uniqueAuthors.size
            };
          })
        );

        setWalls(wallsWithStats);
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

      {isAdmin && (
        <Link
          to="/walls/create"
          style={{
            display: "inline-block",
            padding: "10px 14px",
            borderRadius: 8,
            background: "#ffffff",
            color: "#000000",
            fontWeight: 700,
            textDecoration: "none",
            marginBottom: 18,
            textTransform: "uppercase"
          }}
        >
          Créer une salle
        </Link>
      )}

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
              padding: 12,
              borderRadius: 10,
              background: "#101010",
              color: "white",
              textDecoration: "none",
              border: "1px solid #1f1f1f"
            }}
          >
            {wall.photoURL && (
              <img
                src={wall.photoURL}
                alt={wall.name}
                style={{
                  width: "100%",
                  height: 140,
                  objectFit: "cover",
                  borderRadius: 8,
                  marginBottom: 10,
                  display: "block"
                }}
              />
            )}

            <div
              style={{
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.4px",
                marginBottom: wall.locationLabel ? 4 : 0
              }}
            >
              {wall.name}
            </div>

            {wall.locationLabel && (
              <p style={{ margin: "0 0 6px 0", opacity: 0.8 }}>
                {wall.locationLabel}
              </p>
            )}

            <p style={{ margin: 0, opacity: 0.9 }}>
              {wall.blocksCount || 0} blocs · {wall.climbersCount || 0} grimpeurs
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}