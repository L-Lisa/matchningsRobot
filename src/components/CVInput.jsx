import { useState, useRef, useEffect } from "react";
import { extractTextFromPDF } from "../services/pdfService";
import ATSTip from "./ATSTip";
import styles from "./CVInput.module.css";

const REGIONS = [
  { code: "", label: "Hela Sverige" },
  { code: "01", label: "Stockholms län" },
  { code: "03", label: "Uppsala län" },
  { code: "04", label: "Södermanlands län" },
  { code: "05", label: "Östergötlands län" },
  { code: "06", label: "Jönköpings län" },
  { code: "07", label: "Kronobergs län" },
  { code: "08", label: "Kalmar län" },
  { code: "09", label: "Gotlands län" },
  { code: "10", label: "Blekinge län" },
  { code: "12", label: "Skåne län" },
  { code: "13", label: "Hallands län" },
  { code: "14", label: "Västra Götalands län" },
  { code: "17", label: "Värmlands län" },
  { code: "18", label: "Örebro län" },
  { code: "19", label: "Västmanlands län" },
  { code: "20", label: "Dalarnas län" },
  { code: "21", label: "Gävleborgs län" },
  { code: "22", label: "Västernorrlands län" },
  { code: "23", label: "Jämtlands län" },
  { code: "24", label: "Västerbottens län" },
  { code: "25", label: "Norrbottens län" },
];

export default function CVInput({ onSubmit, loading, region, onRegionChange }) {
  const [cvText, setCvText] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-expand textarea height as content grows
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [cvText]);

  function handleSubmit(e) {
    e.preventDefault();
    if (cvText.trim()) onSubmit(cvText.trim());
  }

  async function handlePDF(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPdfLoading(true);
    try {
      const text = await extractTextFromPDF(file);
      setCvText(text);
    } catch {
      alert("Kunde inte läsa PDF-filen. Kontrollera att filen inte är lösenordsskyddad.");
    } finally {
      setPdfLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const busy = loading || pdfLoading;

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.controlsRow}>
        <div className={styles.labelRow}>
          <label className={styles.label} htmlFor="cv">
            Klistra in ditt CV
          </label>
          <span className={styles.orText}>eller</span>
          <button
            type="button"
            className={styles.pdfButton}
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
          >
            {pdfLoading ? "Läser PDF…" : "Ladda upp PDF"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className={styles.hiddenInput}
            onChange={handlePDF}
          />
        </div>

        <div className={styles.locationRow}>
          <label className={styles.locationLabel} htmlFor="region">
            Område
          </label>
          <select
            id="region"
            className={styles.select}
            value={region}
            onChange={(e) => onRegionChange(e.target.value)}
            disabled={busy}
          >
            {REGIONS.map((r) => (
              <option key={r.code} value={r.code}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <textarea
        ref={textareaRef}
        id="cv"
        className={styles.textarea}
        placeholder="Klistra in ditt CV här som vanlig text — erfarenhet, kompetenser, utbildning..."
        disabled={busy}
        required
        value={cvText}
        onChange={(e) => setCvText(e.target.value)}
      />

      <ATSTip cvText={cvText} />

      <button
        className={styles.button}
        type="submit"
        disabled={busy || !cvText.trim()}
      >
        {loading ? "Söker…" : "Hitta jobb"}
      </button>
    </form>
  );
}
