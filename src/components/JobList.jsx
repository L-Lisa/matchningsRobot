import JobCard from "./JobCard";
import styles from "./JobList.module.css";

export default function JobList({ jobs, onReset }) {
  return (
    <section className={styles.wrapper}>
      <div className={styles.resultHeader}>
        <h2 className={styles.heading}>Dina topp {jobs.length} matchningar</h2>
        <button className={styles.resetButton} onClick={onReset}>
          Sök igen
        </button>
      </div>
      <div className={styles.list}>
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </section>
  );
}
