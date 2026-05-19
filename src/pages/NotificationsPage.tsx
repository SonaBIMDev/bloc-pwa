import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../firebase";
import { getNotificationsByUserId, markNotificationAsRead } from "../services/notificationsService";
import type { AppNotification } from "../types";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function loadNotifications() {
      if (!currentUser) {
        setNotifications([]);
        setIsLoading(false);
        return;
      }

      const data = await getNotificationsByUserId(currentUser.uid);
      setNotifications(data);
      setIsLoading(false);
    }

    loadNotifications();
  }, [currentUser]);

  async function handleOpenNotification(notification: AppNotification) {
    if (notification.id && !notification.isRead) {
      await markNotificationAsRead(notification.id);
    }

    if (notification.problemId) {
      navigate(`/problems/${notification.problemId}`);
      return;
    }

    if (notification.wallId) {
      navigate(`/walls/${notification.wallId}`);
      return;
    }
  }

  if (!currentUser) {
    return <p>Connecte-toi pour voir tes notifications.</p>;
  }

  if (isLoading) {
    return <p>Chargement des notifications...</p>;
  }

  return (
    <div>
      <h1>Notifications</h1>

      {notifications.length === 0 ? (
        <p>Aucune notification.</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {notifications.map((notification) => (
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