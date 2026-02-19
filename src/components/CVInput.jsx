import { useState, useRef, useEffect } from "react";
import { extractTextFromPDF } from "../services/pdfService";
import ATSTip from "./ATSTip";
import styles from "./CVInput.module.css";

export default function CVInput({ onSubmit, loading }) {
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

      <button
        className={styles.button}
        type="submit"
        disabled={busy || !cvText.trim()}
      >
        {loading ? "Söker…" : "Hitta jobb"}
      </button>

      <ATSTip cvText={cvText} />
    </form>
  );
}
