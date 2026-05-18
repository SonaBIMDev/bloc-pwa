import { useNavigate, useLocation } from "react-router-dom";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  async function handleShareApp() {
    const shareData = {
      title: "FreeBloc",
      text: "Découvre FreeBloc, l'app pour créer et partager des blocs en salle.",
      url: window.location.origin
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(window.location.origin);
      alert("Lien de l'application copié dans le presse-papiers.");
    } catch (error) {
      console.error("Erreur partage :", error);
      alert("Impossible de partager l'application.");
    }
  }

  const isHome = location.pathname === "/";

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        background: "#050505",
        borderTop: "1px solid #1f1f1f",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        zIndex: 1000,
        paddingBottom: "env(safe-area-inset-bottom)"
      }}
    >
      <button
        type="button"
        onClick={() => navigate("/")}
        style={{
          background: "none",
          border: "none",
          color: isHome ? "#22c55e" : "#ffffff",
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2
        }}
      >
        <span style={{ fontSize: 20 }}>⌂</span>
        <span style={{ fontSize: 10, textTransform: "uppercase" }}>Accueil</span>
      </button>

      <button
        type="button"
        onClick={handleShareApp}
        style={{
          background: "none",
          border: "none",
          color: "#ffffff",
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2
        }}
      >
        <span style={{ fontSize: 20 }}>⤴</span>
        <span style={{ fontSize: 10, textTransform: "uppercase" }}>Partager</span>
      </button>
    </nav>
  );
}