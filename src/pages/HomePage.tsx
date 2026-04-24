import { Link } from "react-router-dom";

export default function HomePage() {
  const demoWalls = [
    { id: "wall-1", name: "Mur Dévers Principal" },
    { id: "wall-2", name: "Mur Vertical Débutant" }
  ];

  return (
    <div>
      <h1>Blocs partagés</h1>
      <p>Choisis un mur pour voir ou créer des blocs.</p>

      <div style={{ display: "grid", gap: 12 }}>
        {demoWalls.map((wall) => (
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