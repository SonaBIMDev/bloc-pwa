import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { requireGoogleUser } from "../services/authService";
import { createWall } from "../services/wallsService";

export default function CreateWallPage() {
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  async function handleCreate() {
    try {
      if (!name.trim()) {
        alert("Merci de saisir un nom de salle.");
        return;
      }

      const user = await requireGoogleUser();

      if (!user) {
        alert("Tu dois te connecter avec Google pour créer une salle.");
        return;
      }

      setIsSaving(true);

      const wallId = await createWall({
        name: name.trim(),
        createdBy: user.uid,
        createdByName: user.displayName || user.email || "Utilisateur",
        createdByPhotoURL: user.photoURL || ""
      });

      navigate(`/walls/${wallId}`);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la création de la salle.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <h1>Créer une salle de bloc</h1>

      <div style={{ display: "grid", gap: 12, maxWidth: 500 }}>
        <input
          type="text"
          placeholder="Nom de la salle"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: 12, borderRadius: 8, border: "none" }}
        />

        <button
          type="button"
          onClick={handleCreate}
          disabled={isSaving}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "none",
            background: isSaving ? "#64748b" : "#22c55e",
            color: isSaving ? "white" : "#052e16",
            fontWeight: 700,
            cursor: isSaving ? "not-allowed" : "pointer"
          }}
        >
          {isSaving ? "Création..." : "Créer la salle"}
        </button>
      </div>
    </div>
  );
}