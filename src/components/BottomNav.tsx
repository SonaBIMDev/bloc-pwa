import { useNavigate, useLocation } from "react-router-dom";

const FEEDBACK_FORM_URL = "https://forms.gle/57xe9oEi2Zpvqht16";

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

  function handleFeedback() {
    window.open(FEEDBACK_FORM_URL, "_blank", "noopener,noreferrer");
  }

  const isHome = location.pathname === "/";

  return (
    <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 64,
          background: "#050505",
          borderTop: "1px solid #1f1f1f",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          zIndex: 9999,
          paddingBottom: "env(safe-area-inset-bottom)",
          boxSizing: "border-box"
        }}
      >
      <button
        type="button"
        onClick={() => navigate("/")}
        style={{
          background: "none",
          border: "none",
          color: isHome ? "#22c55e" : "#ffffff",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          minWidth: 64
        }}
      >
        <img
          src="/icons/home.png"
          alt="Accueil"
          style={{
            width: 22,
            height: 22,
            display: "block",
            opacity: isHome ? 1 : 0.9
          }}
        />
        <span
          style={{
            fontSize: 10,
            textTransform: "uppercase",
            fontWeight: 700,
            color: isHome ? "#22c55e" : "#ffffff"
          }}
        >
          Accueil
        </span>
      </button>

      <button
        type="button"
        onClick={handleShareApp}
        style={{
          background: "none",
          border: "none",
          color: "#ffffff",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          minWidth: 64
        }}
      >
        <img
          src="/icons/share.png"
          alt="Partager"
          style={{
            width: 22,
            height: 22,
            display: "block",
            opacity: 0.9
          }}
        />
        <span
          style={{
            fontSize: 10,
            textTransform: "uppercase",
            fontWeight: 700,
            color: "#ffffff"
          }}
        >
          Partager
        </span>
      </button>

      <button
        type="button"
        onClick={handleFeedback}
        style={{
          background: "none",
          border: "none",
          color: "#ffffff",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          minWidth: 64
        }}
      >
        <img
          src="/icons/feedback.png"
          alt="Feedback"
          style={{
            width: 22,
            height: 22,
            display: "block",
            opacity: 0.9
          }}
        />
        <span
          style={{
            fontSize: 10,
            textTransform: "uppercase",
            fontWeight: 700,
            color: "#ffffff"
          }}
        >
          Feedback
        </span>
      </button>
    </nav>
  );
}