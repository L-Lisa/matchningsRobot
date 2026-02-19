import styles from "./StatusIndicator.module.css";

const STEPS = [
  "Analyserar CV...",
  "Söker Platsbanken...",
  "Matchar jobb...",
];

export default function StatusIndicator({ step }) {
  const currentIndex = STEPS.indexOf(step);

  return (
    <div className={styles.wrapper}>
      <div className={styles.spinner} aria-hidden="true" />
      <p className={styles.currentStep}>{step}</p>
      <ol className={styles.stepList}>
        {STEPS.map((s, i) => (
          <li
            key={s}
            className={[
              styles.stepItem,
              i < currentIndex ? styles.done : "",
              i === currentIndex ? styles.active : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span className={styles.dot} />
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
}
