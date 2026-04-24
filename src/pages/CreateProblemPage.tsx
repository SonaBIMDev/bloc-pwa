import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { HoldPoint, HoldType, ProblemGradeColor } from "../types";
import { requireGoogleUser } from "../services/authService";
import { uploadProblemImage } from "../services/uploadService";
import { createProblem } from "../services/problemsService";

const gradeColors: ProblemGradeColor[] = [
  "blanc",
  "vert",
  "bleu",
  "rose",
  "orange",
  "jaune",
  "noir"
];

const gradeColorMap: Record<ProblemGradeColor, string> = {
  blanc: "#f8fafc",
  vert: "#22c55e",
  bleu: "#3b82f6",
  rose: "#ec4899",
  orange: "#f97316",
  jaune: "#eab308",
  noir: "#0f172a"
};

export default function CreateProblemPage() {
  const { wallId } = useParams();
  const navigate = useNavigate();
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [name, setName] = useState("");
  const [grade, setGrade] = useState<ProblemGradeColor>("bleu");
  const [description, setDescription] = useState("");
  const [selectedType, setSelectedType] = useState<HoldType>("hand");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [holds, setHolds] = useState<HoldPoint[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const holdColor = useMemo<Record<HoldType, string>>(
  () => ({
    start: "#22c55e",
    inter: "#38bdf8",
    top: "#ef4444"
  }),
  []
);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setImageUrl(localUrl);
    setImageFile(file);
    setHolds([]);
  }

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    if (x < 0 || x > 1 || y < 0 || y > 1) return;

    setHolds((prev) => [...prev, { x, y, type: selectedType }]);
  }

  function removeLastHold() {
    setHolds((prev) => prev.slice(0, -1));
  }

  async function handlePublish() {
    try {
      if (!wallId) {
        alert("Mur introuvable.");
        return;
      }

      if (!name.trim()) {
        alert("Merci de saisir un nom de bloc.");
        return;
      }

      if (!imageFile) {
        alert("Merci d'ajouter une photo.");
        return;
      }

      if (holds.length === 0) {
        alert("Merci de sélectionner au moins une prise.");
        return;
      }

      setIsSaving(true);

      const user = await requireGoogleUser();

    if (!user) {
    alert("Tu dois te connecter avec Google pour publier un bloc.");
    return;
    }
      const uploadedImageUrl = await uploadProblemImage(imageFile, wallId, user.uid);

      const problemId = await createProblem({
        wallId,
        authorId: user.uid,
        authorName: user.displayName || user.email || "Utilisateur",
        name: name.trim(),
        grade,
        description: description.trim(),
        imageUrl: uploadedImageUrl,
        holds
      });

      alert("Bloc publié avec succès.");
      navigate(`/problems/${problemId}`);
    } catch (error) {
      console.error("Erreur publication bloc :", error);
      alert("Erreur pendant la publication du bloc.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <h1>Créer un bloc</h1>
      <p>Mur : {wallId}</p>

      <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Nom du bloc"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: 12, borderRadius: 8, border: "none" }}
        />

        <div>
  <div style={{ marginBottom: 8 }}>Couleur proposée par le créateur</div>

  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
    {gradeColors.map((gradeItem) => {
      const isSelected = grade === gradeItem;

      return (
        <button
          key={gradeItem}
          type="button"
          onClick={() => setGrade(gradeItem)}
          style={{
            padding: "10px 14px",
            borderRadius: 999,
            background: gradeColorMap[gradeItem],
            color: gradeItem === "blanc" || gradeItem === "jaune" ? "#111" : "white",
            border: isSelected
              ? "3px solid white"
              : gradeItem === "blanc"
              ? "1px solid #cbd5e1"
              : "1px solid transparent",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: isSelected ? "0 0 0 2px rgba(255,255,255,0.25)" : "none",
            transform: isSelected ? "scale(1.05)" : "scale(1)",
            transition: "all 0.15s ease"
          }}
        >
          {gradeItem}
        </button>
      );
    })}
  </div>

  <p style={{ marginTop: 10 }}>
    <strong>Cotation sélectionnée :</strong> {grade}
  </p>
</div>

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          style={{ padding: 12, borderRadius: 8, border: "none" }}
        />

        <input type="file" accept="image/*" onChange={handleFileChange} />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {(["start", "inter", "top"] as HoldType[]).map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            style={{
              padding: "10px 14px",
              borderRadius: 999,
              border: selectedType === type ? "2px solid white" : "1px solid transparent",
              background: holdColor[type],
              color: "#111",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            {type}
          </button>
        ))}

        <button
          onClick={removeLastHold}
          style={{
            padding: "10px 14px",
            borderRadius: 999,
            border: "none",
            background: "#334155",
            color: "white",
            cursor: "pointer"
          }}
        >
          Annuler dernier point
        </button>
      </div>

      {imageUrl ? (
        <div
          onClick={handleImageClick}
          style={{
            position: "relative",
            display: "inline-block",
            width: "100%",
            maxWidth: 700,
            cursor: "crosshair"
          }}
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Mur"
            style={{ width: "100%", display: "block", borderRadius: 12 }}
          />

          {holds.map((hold, index) => (
            <div
              key={index}
              title={`${hold.type} (${index + 1})`}
              style={{
                position: "absolute",
                left: `${hold.x * 100}%`,
                top: `${hold.y * 100}%`,
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: holdColor[hold.type],
                border: "2px solid white",
                transform: "translate(-50%, -50%)"
              }}
            />
          ))}
        </div>
      ) : (
        <p>Ajoute d’abord une photo du mur.</p>
      )}

      <div style={{ marginTop: 16 }}>
        <p>{holds.length} prise(s) sélectionnée(s)</p>

        <button
          onClick={handlePublish}
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
          {isSaving ? "Publication..." : "Publier"}
        </button>
      </div>
    </div>
  );
}