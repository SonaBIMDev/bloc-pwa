import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../firebase";
import { getWallById, updateWall, deleteWall } from "../services/wallsService";
import { isCurrentUserAdmin } from "../services/authService";

export default function EditWallPage() {
  const { wallId } = useParams();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [name, setName] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setCurrentUser(nextUser);

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
    async function loadWall() {
      try {
        if (!wallId) return;

        const wall = await getWallById(wallId);
        if (!wall) return;

        setName(wall.name);
        setCreatedBy(wall.createdBy);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    loadWall();
  }, [wallId]);

  const canManage = useMemo(() => {
    if (!currentUser) return false;
    return currentUser.uid === createdBy || isAdmin;
  }, [currentUser, createdBy, isAdmin]);

  async function handleSave() {
    try {
      if (!wallId) return;

      if (!canManage) {
        alert("Tu n'es pas autorisé à modifier cette salle.");
        return;
      }

      if (!name.trim()) {
        alert("Merci de saisir un nom.");
        return;
      }

      setIsSaving(true);
      await updateWall(wallId, name.trim());
      navigate(`/walls/${wallId}`);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la modification.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    try {
      if (!wallId) return;

      if (!canManage) {
        alert("Tu n'es pas autorisé à supprimer cette salle.");
        return;
      }

      const confirmed = window.confirm("Supprimer cette salle ?");
      if (!confirmed) return;

      setIsSaving(true);
      await deleteWall(wallId);
      navigate("/");
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la suppression.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <p>Chargement...</p>;

  if (!currentUser) {
    return <p>Tu dois être connecté pour modifier cette salle.</p>;
  }

  if (!canManage) {
    return <p>Tu n'es pas autorisé à modifier cette salle.</p>;
  }

  return (
    <div>
      <h1>Modifier la salle</h1>

      <div style={{ display: "grid", gap: 12, maxWidth: 500 }}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: 12, borderRadius: 8, border: "none" }}
        />

        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              border: "none",
              background: "#22c55e",
              color: "#052e16",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Enregistrer
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isSaving}
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              border: "none",
              background: "#ef4444",
              color: "white",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}