import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth } from "../firebase";
import { getWallById, updateWall, deleteWall } from "../services/wallsService";

const SUPER_ADMIN_EMAIL = "pierrotnavarra@gmail.com";

export default function EditWallPage() {
  const { wallId } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const currentUser = auth.currentUser;
  const isSuperAdmin = currentUser?.email === SUPER_ADMIN_EMAIL;
  const canManage = !!currentUser && (currentUser.uid === createdBy || isSuperAdmin);

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
  if (!canManage) return <p>Tu n'es pas autorisé à modifier cette salle.</p>;

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