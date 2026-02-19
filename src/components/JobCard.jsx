import styles from "./JobCard.module.css";

function scoreBadgeClass(score) {
  if (score >= 80) return styles.scoreGreen;
  if (score >= 60) return styles.scoreYellow;
  return styles.scoreRed;
}

export default function JobCard({ job }) {
  const { rank, score, reasons, headline, employer, workplace_address, webpage_url } = job;
  const location = workplace_address?.municipality || workplace_address?.region || "";

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <span className={styles.rank}>#{rank}</span>
        <span className={[styles.scoreBadge, scoreBadgeClass(score)].join(" ")}>
          {score}
        </span>
      </div>

      <div className={styles.progressBar}>
        <div
          className={[styles.progressFill, scoreBadgeClass(score)].join(" ")}
          style={{ width: `${score}%` }}
        />
      </div>

      <h2 className={styles.title}>{headline}</h2>

      <p className={styles.meta}>
        {employer?.name && <span>{employer.name}</span>}
        {employer?.name && location && <span className={styles.dot}>·</span>}
        {location && <span>{location}</span>}
      </p>

      {Array.isArray(reasons) && reasons.length > 0 && (
        <ul className={styles.reasons}>
          {reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}

      {webpage_url && (
        <a
          className={styles.link}
          href={webpage_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Visa annons på Platsbanken →
        </a>
      )}
    </article>
  );
}
