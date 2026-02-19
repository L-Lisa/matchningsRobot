import { useState } from "react";
import { getTopATSTip } from "../services/atsService";
import styles from "./ATSTip.module.css";

export default function ATSTip({ cvText }) {
  const [tip, setTip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!cvText || cvText.trim().length < 50) return null;

  async function handleClick() {
    if (tip) return;
    setLoading(true);
    setError("");
    try {
      const result = await getTopATSTip(cvText);
      setTip(result);
    } catch (err) {
      setError("Kunde inte hämta tips just nu. Försök igen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      {!tip && (
        <button
          className={styles.triggerButton}
          onClick={handleClick}
          disabled={loading}
        >
          {loading ? "Analyserar ditt CV..." : "Vill du ha tips för att AI-optimera ditt CV?"}
        </button>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {tip && (
        <div className={styles.card}>
          <span className={styles.label}>ATS · AI-tips</span>
          <p className={styles.tipTitle}>{tip.tip}</p>
          <p className={styles.description}>{tip.description}</p>
          <p className={styles.example}>→ {tip.example}</p>
        </div>
      )}
    </div>
  );
}
