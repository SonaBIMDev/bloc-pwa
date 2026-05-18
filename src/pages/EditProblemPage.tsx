import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../firebase";
import { getProblemById, updateProblem } from "../services/problemsService";
import { isCurrentUserAdmin } from "../services/authService";
import type {
  HoldPoint,
  HoldType,
  Problem,
  ProblemGradeColor
} from "../types";

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

export default function EditProblemPage() {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [problem, setProblem] = useState<Problem | null>(null);

  const [name, setName] = useState("");
  const [grade, setGrade] = useState<ProblemGradeColor>("bleu");
  const [description, setDescription] = useState("");
  const [selectedType, setSelectedType] = useState<HoldType>("inter");
  const [holds, setHolds] = useState<HoldPoint[]>([]);
  const [markerSize, setMarkerSize] = useState(18);

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

  const holdColor = useMemo<Record<HoldType, string>>(
    () => ({
      start: "#22c55e",
      inter: "#38bdf8",
      hand: "#38bdf8",
      foot: "#38bdf8",
      top: "#ef4444"
    }),
    []
  );

  useEffect(() => {
    async function loadProblem() {
      try {
        if (!problemId) return;

        const data = await getProblemById(problemId);
        if (!data) return;

        setProblem(data);
        setName(data.name);
        setGrade(data.grade);
        setDescription(data.description || "");
        setHolds(data.holds || []);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProblem();
  }, [problemId]);

  const canManageProblem = useMemo(() => {
    if (!problem || !currentUser) return false;
    return problem.authorId === currentUser.uid || isAdmin;
  }, [problem, currentUser, isAdmin]);

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

  async function handleSave() {
    try {
      if (!problemId || !problem) return;

      if (!canManageProblem) {
        alert("Tu n'es pas autorisé à modifier ce bloc.");
        return;
      }

      if (!name.trim()) {
        alert("Merci de saisir un nom.");
        return;
      }

      if (holds.length === 0) {
        alert("Merci de garder au moins une prise.");
        return;
      }

      setIsSaving(true);

      await updateProblem(problemId, {
        name: name.trim(),
        grade,
        description: description.trim(),
        holds,
        markerSize
      });

      navigate(`/problems/${problemId}`);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la modification du bloc.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p>Chargement...</p>;
  }

  if (!problem) {
    return <p>Bloc introuvable.</p>;
  }

  if (!currentUser) {
    return <p>Tu dois être connecté pour modifier ce bloc.</p>;
  }

  if (!canManageProblem) {
    return <p>Tu n'es pas autorisé à modifier ce bloc.</p>;
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => navigate(`/problems/${problemId}`)}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #222222",
            background: "#111111",
            color: "white",
            fontWeight: 700,
            textTransform: "uppercase",
            cursor: "pointer"
          }}
        >
          ← Retour
        </button>
      </div>

      <h1>Modifier le bloc</h1>

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
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {(["start", "inter", "top"] as HoldType[]).map((type) => (
          <button
            key={type}
            type="button"
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
          type="button"
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

      <div style={{ marginBottom: 16, maxWidth: 320 }}>
        <label style={{ display: "block", marginBottom: 8 }}>
          Taille des points : <strong>{markerSize}px</strong>
        </label>

        <input
          type="range"
          min={10}
          max={40}
          step={1}
          value={markerSize}
          onChange={(e) => setMarkerSize(Number(e.target.value))}
          style={{ width: "100%" }}
        />
      </div>

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
          src={problem.imageUrl}
          alt={problem.name}
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
              width: markerSize,
              height: markerSize,
              borderRadius: "50%",
              background: holdColor[hold.type],
              border: "2px solid white",
              transform: "translate(-50%, -50%)"
            }}
          />
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <p>{holds.length} prise(s) sélectionnée(s)</p>

        <button
          type="button"
          onClick={handleSave}
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
          {isSaving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>

      <div style={{ height: 140 }} />
    </div>
  );
}