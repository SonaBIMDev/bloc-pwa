import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../firebase";
import {
  getLatestAppVersionInfo,
  getNotificationsByUserId,
  markAllNotificationsAsRead,
  markNotificationAsRead
} from "../services/notificationsService";
import type { AppNotification } from "../types";
import { APP_VERSION } from "../config/appInfo";

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

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [latestVersion, setLatestVersion] = useState("");
  const [latestVersionMessage, setLatestVersionMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

useEffect(() => {
  async function loadPageData() {
    try {
      setIsLoading(true);

      const versionInfo = await getLatestAppVersionInfo();
      console.log("Version info =", versionInfo);

      setLatestVersion(versionInfo?.latestVersion || "");
      setLatestVersionMessage(versionInfo?.message || "");

      if (!currentUser) {
        console.log("Pas de currentUser dans NotificationsPage");
        setNotifications([]);
        return;
      }

      console.log("NotificationsPage currentUser.uid =", currentUser.uid);

      const data = await getNotificationsByUserId(currentUser.uid);
      console.log("Notifications reçues dans la page =", data);

      setNotifications(data);
    } catch (error) {
      console.error("Erreur chargement NotificationsPage :", error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }

  loadPageData();
}, [currentUser]);

  const hasNewVersion = useMemo(() => {
    if (!latestVersion) return false;
    return compareVersions(APP_VERSION, latestVersion) < 0;
  }, [latestVersion]);

  const versionNotification = useMemo<AppNotification | null>(() => {
    if (!hasNewVersion) return null;

    return {
      id: "app-version-notification",
      userId: currentUser?.uid || "",
      type: "new_version",
      title: "Nouvelle version disponible",
      message:
        latestVersionMessage ||
        `Une mise à jour de FreeBloc est disponible (${latestVersion}).`,
      version: latestVersion,
      isRead: false,
      createdAt: Number.MAX_SAFE_INTEGER
    };
  }, [hasNewVersion, latestVersion, latestVersionMessage, currentUser]);

  const displayNotifications = useMemo(() => {
    const items = [...notifications];
    if (versionNotification) {
      return [versionNotification, ...items];
    }
    return items;
  }, [notifications, versionNotification]);

  async function handleOpenNotification(notification: AppNotification) {
    if (notification.type === "new_version") {
      window.location.reload();
      return;
    }

    if (notification.id && !notification.isRead) {
      await markNotificationAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item
        )
      );
    }

    if (notification.problemId) {
      navigate(`/problems/${notification.problemId}`);
      return;
    }

    if (notification.wallId) {
      navigate(`/walls/${notification.wallId}`);
    }
  }

  async function handleMarkAllAsRead() {
    if (!currentUser) return;

    await markAllNotificationsAsRead(currentUser.uid);
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
  }

  if (!currentUser) {
    return (
      <div>
        <h1>Notifications</h1>
        {versionNotification ? (
          <button
            type="button"
            onClick={() => handleOpenNotification(versionNotification)}
            style={{
              textAlign: "left",
              padding: 12,
              borderRadius: 10,
              border: "1px solid #1f1f1f",
              background: "#1a1a1a",
              color: "white",
              cursor: "pointer",
              width: "100%"
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              {versionNotification.title}
            </div>
            <div style={{ opacity: 0.9 }}>{versionNotification.message}</div>
          </button>
        ) : (
          <p>Connecte-toi pour voir tes notifications.</p>
        )}

        <div style={{ height: 140 }} />
      </div>
    );
  }

  if (isLoading) {
    return <p>Chargement des notifications...</p>;
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 16
        }}
      >
        <h1 style={{ margin: 0 }}>Notifications</h1>

        {notifications.some((item) => !item.isRead) && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "none",
              background: "#ffffff",
              color: "#000000",
              fontWeight: 700,
              cursor: "pointer",
              textTransform: "uppercase"
            }}
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      {displayNotifications.length === 0 ? (
        <p>Aucune notification.</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {displayNotifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => handleOpenNotification(notification)}
              style={{
                textAlign: "left",
                padding: 12,
                borderRadius: 10,
                border: "1px solid #1f1f1f",
                background: notification.isRead ? "#101010" : "#1a1a1a",
                color: "white",
                cursor: "pointer"
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                {notification.title}
              </div>
              <div style={{ opacity: 0.9 }}>{notification.message}</div>
            </button>
          ))}
        </div>
      )}

      <div style={{ height: 140 }} />
    </div>
  );
}