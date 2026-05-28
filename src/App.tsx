import { Outlet, Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "./firebase";
import { logout, signInWithGoogle } from "./services/authService";
import BottomNav from "./components/BottomNav";
import { APP_NAME, APP_VERSION } from "./config/appInfo";
import {
  getLatestAppVersionInfo,
  getUnreadNotificationsCountByUserId
} from "./services/notificationsService";

function compareVersions(currentVersion: string, latestVersion: string) {
  const currentParts = currentVersion.split(".").map((item) => Number(item));
  const latestParts = latestVersion.split(".").map((item) => Number(item));
  const maxLength = Math.max(currentParts.length, latestParts.length);

  for (let i = 0; i < maxLength; i += 1) {
    const current = currentParts[i] || 0;
    const latest = latestParts[i] || 0;

    if (latest > current) return -1;
    if (latest < current) return 1;
  }

  return 0;
}

export default function App() {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestVersion, setLatestVersion] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function loadHeaderState() {
      try {
        const versionInfo = await getLatestAppVersionInfo();
        setLatestVersion(versionInfo?.latestVersion || "");

        if (!user) {
          setUnreadCount(0);
          return;
        }

        const count = await getUnreadNotificationsCountByUserId(user.uid);
        setUnreadCount(count);
      } catch (error) {
        console.error("Erreur chargement header :", error);
      }
    }

    loadHeaderState();
  }, [user]);

  const hasNewVersion = useMemo(() => {
    if (!latestVersion) return false;
    return compareVersions(APP_VERSION, latestVersion) < 0;
  }, [latestVersion]);

  const totalBadgeCount = unreadCount + (hasNewVersion ? 1 : 0);

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
            flexShrink: 0
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span
              style={{
                fontWeight: 700,
                fontSize: 20,
                letterSpacing: "0.8px",
                textTransform: "uppercase"
              }}
            >
              {APP_NAME}
            </span>

            <span style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>
              v{APP_VERSION}
            </span>
          </div>
        </Link>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            justifyContent: "flex-end"
          }}
        >
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

              <span
                style={{
                  fontSize: 11,
                  opacity: 0.9,
                  textTransform: "uppercase"
                }}
              >
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

              <button
                type="button"
                onClick={() => navigate("/notifications")}
                style={{
                  position: "relative",
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  border: "1px solid #2a2a2a",
                  background: "#111111",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}
                aria-label="Notifications"
                title="Notifications"
              >
                <span style={{ fontSize: 20, lineHeight: 1 }}>🔔</span>

                {totalBadgeCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -5,
                      right: -5,
                      minWidth: 18,
                      height: 18,
                      borderRadius: 999,
                      background: "#ef4444",
                      color: "white",
                      fontSize: 11,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 5px",
                      boxSizing: "border-box",
                      fontWeight: 700
                    }}
                  >
                    {totalBadgeCount}
                  </span>
                )}
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
                background: "#ffffff",
                color: "#000000",
                fontWeight: 700,
                textTransform: "uppercase",
                cursor: isSigningIn ? "not-allowed" : "pointer",
                opacity: isSigningIn ? 0.6 : 1
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