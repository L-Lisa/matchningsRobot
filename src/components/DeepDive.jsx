import { useState, useRef, useEffect } from "react";
import { getDeepDive } from "../services/deepDiveService";
import styles from "./DeepDive.module.css";

const TYPE_COLORS = {
  Motivationsfråga: styles.typeMotivation,
  Kompetensfråga: styles.typeKompetens,
  Situationsfråga: styles.typeSituation,
  Beteendefråga: styles.typeBeteende,
  Framtidsfråga: styles.typeFramtid,
};

function scoreBadgeClass(score) {
  if (score >= 80) return styles.scoreGreen;
  if (score >= 60) return styles.scoreYellow;
  return styles.scoreRed;
}

export default function DeepDive({ jobs, cvText, profile }) {
  const [selectedJob, setSelectedJob] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cache, setCache] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);
  const panelRef = useRef(null);

  function copy(text, key) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    });
  }

  async function handleSelect(job) {
    if (loading) return;
    if (selectedJob?.id === job.id) return;

    setSelectedJob(job);
    setError("");

    if (cache[job.id]) {
      setResult(cache[job.id]);
      return;
    }

    setResult(null);
    setLoading(true);

    try {
      const data = await getDeepDive(cvText, profile, job);
      setResult(data);
      setCache((prev) => ({ ...prev, [job.id]: data }));
    } catch (err) {
      setError(
        err.message === "ROBOT_JUICE_EMPTY"
          ? "Tillfälligt slut på robot-juice 🔋 Försök igen lite senare."
          : "Något gick fel vid analysen. Försök igen."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if ((result || loading || error) && panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result, loading, error]);

  function buildCopyAll() {
    if (!result || !selectedJob) return "";
    const questions = result.questions
      .map((q, i) => `${i + 1}. [${q.type}]\n${q.question}`)
      .join("\n\n");
    const keywords = (result.missingKeywords || []).join(", ");
    return `Intervjuförberedelse – ${selectedJob.headline} (${selectedJob.employer?.name || ""})\n\nIntervjufrågor:\n\n${questions}\n\nSaknade nyckelord i CV:t:\n${keywords}`;
  }

  return (
    <section className={styles.section}>
      <div className={styles.divider} />

      <div className={styles.sectionHeading}>
        <h2 className={styles.headingText}>Nästa steg: Förbered din ansökan</h2>
        <p className={styles.headingSubtext}>
          Välj ett av dina matchade jobb för att få skräddarsydda intervjufrågor och se vilka
          nyckelord som saknas i ditt CV.
        </p>
      </div>

      <div className={styles.jobSelector}>
        {jobs.map((job) => (
          <button
            key={job.id}
            className={[
              styles.selectorBtn,
              selectedJob?.id === job.id ? styles.selected : "",
              loading ? styles.disabled : "",
            ]
              .join(" ")
              .trim()}
            onClick={() => handleSelect(job)}
            disabled={loading}
          >
            <span className={styles.selectorRank}>#{job.rank}</span>
            <span className={styles.selectorTitle}>{job.headline}</span>
            <span className={[styles.selectorScore, scoreBadgeClass(job.score)].join(" ")}>
              {job.score}
            </span>
          </button>
        ))}
      </div>

      {(loading || result || error) && (
        <div ref={panelRef} className={styles.panel}>
          {loading && (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <p className={styles.loadingText}>
                Analyserar {selectedJob?.headline}...
              </p>
            </div>
          )}

          {error && <p className={styles.errorText}>{error}</p>}

          {result && (
            <>
              <div className={styles.selectedJobLabel}>
                <span className={styles.selectedJobTitle}>{selectedJob?.headline}</span>
                {selectedJob?.employer?.name && (
                  <span className={styles.selectedJobEmployer}>
                    · {selectedJob.employer.name}
                  </span>
                )}
              </div>

              <div className={styles.block}>
                <div className={styles.blockHeader}>
                  <h3 className={styles.blockTitle}>Intervjufrågor</h3>
                  <button
                    className={styles.copyBtn}
                    onClick={() =>
                      copy(
                        result.questions
                          .map((q, i) => `${i + 1}. [${q.type}]\n${q.question}`)
                          .join("\n\n"),
                        "questions"
                      )
                    }
                  >
                    {copiedKey === "questions" ? "Kopierat!" : "Kopiera frågor"}
                  </button>
                </div>
                <ol className={styles.questionList}>
                  {result.questions.map((q, i) => (
                    <li key={i} className={styles.questionItem}>
                      <span
                        className={[
                          styles.questionType,
                          TYPE_COLORS[q.type] || styles.typeDefault,
                        ].join(" ")}
                      >
                        {q.type}
                      </span>
                      <span className={styles.questionText}>{q.question}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {Array.isArray(result.missingKeywords) && result.missingKeywords.length > 0 && (
                <div className={styles.block}>
                  <div className={styles.blockHeader}>
                    <h3 className={styles.blockTitle}>Nyckelord som saknas i CV:t</h3>
                    <button
                      className={styles.copyBtn}
                      onClick={() =>
                        copy(result.missingKeywords.join(", "), "keywords")
                      }
                    >
                      {copiedKey === "keywords" ? "Kopierat!" : "Kopiera"}
                    </button>
                  </div>
                  <div className={styles.keywords}>
                    {result.missingKeywords.map((kw, i) => (
                      <span key={i} className={styles.keyword}>
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                className={styles.copyAllBtn}
                onClick={() => copy(buildCopyAll(), "all")}
              >
                {copiedKey === "all" ? "Kopierat!" : "Kopiera allt"}
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
