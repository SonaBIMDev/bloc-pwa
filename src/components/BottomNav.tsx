import { useNavigate, useLocation } from "react-router-dom";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  async function handleShareApp() {
    const shareData = {
      title: "FreeBloc",
      text: "Découvre OpenBloc, l'app pour créer et partager des blocs en salle.",
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
        height: 68,
        background: "#050505",
        borderTop: "1px solid #1f1f1f",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        zIndex: 1000
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
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          cursor: "pointer"
        }}
      >
        Accueil
      </button>

      <button
        type="button"
        onClick={handleShareApp}
        style={{
          background: "none",
          border: "none",
          color: "#ffffff",
          fontWeight: 700,
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          cursor: "pointer"
        }}
      >
        Partager
      </button>
    </nav>
  );
}