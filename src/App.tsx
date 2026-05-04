import { Outlet, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "./firebase";
import { logout, signInWithGoogle } from "./services/authService";
import BottomNav from "./components/BottomNav";

export default function App() {
  const navigate = useNavigate();
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
      navigate("/");
    } catch (error) {
      console.error("Erreur déconnexion :", error);
      alert("Impossible de se déconnecter.");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#000000", color: "white" }}>
      <header
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid #1a1a1a",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          background: "#000000",
          position: "sticky",
          top: 0,
          zIndex: 999
        }}
      >
        <Link
          to="/"
          style={{
            color: "white",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: 20,
            letterSpacing: "0.8px",
            textTransform: "uppercase"
          }}
        >
          FreeBloc
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {isAuthLoading ? (
            <span style={{ fontSize: 12, opacity: 0.8 }}>Chargement...</span>
          ) : user ? (
            <>
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "Avatar"}
                  referrerPolicy="no-referrer"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "1px solid #2a2a2a"
                  }}
                />
              )}

              <span style={{ fontSize: 12, opacity: 0.9, textTransform: "uppercase" }}>
                {user.displayName || user.email || "Utilisateur"}
              </span>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid #2a2a2a",
                  background: "#111111",
                  color: "white",
                  fontWeight: 700,
                  textTransform: "uppercase",
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
                padding: "8px 10px",
                borderRadius: 8,
                border: "none",
                background: "#22c55e",
                color: "#04130a",
                fontWeight: 700,
                textTransform: "uppercase",
                cursor: isSigningIn ? "not-allowed" : "pointer"
              }}
            >
              {isSigningIn ? "Connexion..." : "Connexion Google"}
            </button>
          )}
        </div>
      </header>

      <main
        className="page-bottom-space"
        style={{
          padding: "14px 16px",
          maxWidth: 900,
          margin: "0 auto"
        }}
      >
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}