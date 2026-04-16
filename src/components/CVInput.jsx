import { useState, useRef, useEffect } from "react";
import { extractTextFromPDF } from "../services/pdfService";
import ATSTip from "./ATSTip";
import styles from "./CVInput.module.css";

const REGIONS = [
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

const REMOTE_CODE = "remote";

export default function CVInput({ onSubmit, loading, regions, onRegionsChange }) {
  const [cvText, setCvText] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleRegion(code) {
    onRegionsChange((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  function getDropdownLabel() {
    if (regions.length === 0) return "Hela Sverige";
    const names = regions
      .filter((c) => c !== REMOTE_CODE)
      .map((c) => REGIONS.find((r) => r.code === c)?.label.replace(" län", ""))
      .filter(Boolean);
    const parts = [];
    if (regions.includes(REMOTE_CODE)) parts.push("Distans");
    parts.push(...names);
    if (parts.length <= 2) return parts.join(", ");
    return `${parts.length} valda`;
  }

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
          <label className={styles.locationLabel}>Område</label>
          <div className={styles.dropdown} ref={dropdownRef}>
            <button
              type="button"
              className={styles.dropdownToggle}
              onClick={() => setDropdownOpen((o) => !o)}
              disabled={busy}
            >
              {getDropdownLabel()}
            </button>
            {dropdownOpen && (
              <div className={styles.dropdownMenu}>
                <label className={styles.dropdownItem}>
                  <input
                    type="checkbox"
                    checked={regions.includes(REMOTE_CODE)}
                    onChange={() => toggleRegion(REMOTE_CODE)}
                  />
                  Distansarbete
                </label>
                <div className={styles.dropdownDivider} />
                {REGIONS.map((r) => (
                  <label key={r.code} className={styles.dropdownItem}>
                    <input
                      type="checkbox"
                      checked={regions.includes(r.code)}
                      onChange={() => toggleRegion(r.code)}
                    />
                    {r.label}
                  </label>
                ))}
              </div>
            )}
          </div>
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
