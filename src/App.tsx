import { Outlet, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "./firebase";
import { logout, signInWithGoogle } from "./services/authService";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function handleGoogleSignIn() {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
    } catch (error) {
      console.error("Erreur Google Sign-In :", error);
      alert("Impossible de se connecter avec Google.");
    } finally {
      setIsSigningIn(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error("Erreur déconnexion :", error);
      alert("Impossible de se déconnecter.");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "white" }}>
      <header
        style={{
          padding: "16px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16
        }}
      >
        <Link to="/" style={{ color: "white", textDecoration: "none", fontWeight: 700 }}>
          Bloc PWA
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {isAuthLoading ? (
  <span style={{ fontSize: 14, opacity: 0.8 }}>Chargement...</span>
) : user ? (
  <>
    {user.photoURL && (
      <img
        src={user.photoURL}
        alt={user.displayName || "Avatar"}
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          objectFit: "cover",
          border: "2px solid rgba(255,255,255,0.2)"
        }}
      />
    )}

    <span style={{ fontSize: 14, opacity: 0.9 }}>
      Connecté : {user.displayName || user.email || "Utilisateur"}
    </span>

    <button
      type="button"
      onClick={handleLogout}
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        border: "none",
        background: "#334155",
        color: "white",
        fontWeight: 700,
        cursor: "pointer"
      }}
    >
      Déconnexion
    </button>
  </>
) : (
  <button
    type="button"
    onClick={handleGoogleSignIn}
    disabled={isSigningIn}
    style={{
      padding: "10px 14px",
      borderRadius: 10,
      border: "none",
      background: "#38bdf8",
      color: "#082f49",
      fontWeight: 700,
      cursor: isSigningIn ? "not-allowed" : "pointer"
    }}
  >
    {isSigningIn ? "Connexion..." : "Se connecter avec Google"}
  </button>
)}
        </div>
      </header>

      <main style={{ padding: "16px", maxWidth: 900, margin: "0 auto" }}>
        <Outlet />
      </main>
    </div>
  );
}