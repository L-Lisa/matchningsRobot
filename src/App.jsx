import { useState } from "react";
import CVInput from "./components/CVInput";
import StatusIndicator from "./components/StatusIndicator";
import JobList from "./components/JobList";
import LiquidEther from "./components/LiquidEther";
import { extractKeywords, rankJobs } from "./services/claudeService";
import { searchJobs } from "./services/afService";
import styles from "./App.module.css";

const STEPS = {
  CV: "Analyserar CV...",
  SEARCH: "Söker Platsbanken...",
  RANK: "Matchar jobb...",
};

export default function App() {
  const [appState, setAppState] = useState("idle"); // idle | loading | done | error
  const [step, setStep] = useState(STEPS.CV);
  const [jobs, setJobs] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [cvText, setCvText] = useState("");
  const [profile, setProfile] = useState(null);

  async function handleSubmit(submittedCvText) {
    setAppState("loading");
    setErrorMsg("");
    setCvText(submittedCvText);

    try {
      setStep(STEPS.CV);
      const profile = await extractKeywords(submittedCvText);
      setProfile(profile);

      setStep(STEPS.SEARCH);
      const jobAds = await searchJobs(profile.queries, selectedRegions);

      if (jobAds.length === 0) {
        setErrorMsg(
          "Inga jobb hittades på Platsbanken. Prova att klistra in ett mer detaljerat CV med tydliga kompetenser och yrkesroller."
        );
        setAppState("error");
        return;
      }

      setStep(STEPS.RANK);
      const rankings = await rankJobs(profile, jobAds);

      const rankedJobs = rankings
        .slice(0, 5)
        .filter((r) => r.idx >= 0 && r.idx < jobAds.length)
        .map((r, rank) => ({
          ...jobAds[r.idx],
          rank: rank + 1,
          score: r.score,
          reasons: Array.isArray(r.reasons) ? r.reasons : [],
        }));

      setJobs(rankedJobs);
      setAppState("done");
    } catch (err) {
      setErrorMsg(
        err.message === "ROBOT_JUICE_EMPTY"
          ? "Tillfälligt slut på robot-juice 🔋 Testversionen har nått sin AI-gräns för stunden. Vänta lite och prova igen en annan dag eller hör av dig!"
          : err.message || "Ett oväntat fel uppstod. Försök igen."
      );
      setAppState("error");
    }
  }

  function handleReset() {
    setAppState("idle");
    setJobs([]);
    setErrorMsg("");
    setCvText("");
    setProfile(null);
  }

  return (
    <div className={styles.page}>
      <div className={styles.background}>
        <LiquidEther
          colors={['#c4b5fd', '#f0abfc', '#93c5fd']}
          autoDemo
          autoSpeed={0.4}
          autoIntensity={2.2}
          mouseForce={20}
          cursorSize={100}
          isViscous
          viscous={30}
          resolution={0.5}
        />
      </div>
      <header className={styles.header}>
        <h1 className={styles.title}>CV Jobbmatch</h1>
        <p className={styles.subtitle}>
          Klistra in ditt CV och få de 5 bäst matchande jobben från Platsbanken — direkt.
        </p>
      </header>

      <main className={styles.main}>
        {appState === "idle" && (
          <CVInput
            onSubmit={handleSubmit}
            loading={false}
            regions={selectedRegions}
            onRegionsChange={setSelectedRegions}
          />
        )}

        {appState === "loading" && (
          <>
            <CVInput
              onSubmit={handleSubmit}
              loading={true}
              region={selectedRegion}
              onRegionChange={setSelectedRegion}
            />
            <StatusIndicator step={step} />
          </>
        )}

        {appState === "done" && (
          <JobList jobs={jobs} onReset={handleReset} cvText={cvText} profile={profile} />
        )}

        {appState === "error" && (
          <div className={styles.errorBox}>
            <p className={styles.errorMsg}>{errorMsg}</p>
            <button className={styles.retryButton} onClick={handleReset}>
              Försök igen
            </button>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        Jobbdata från{" "}
        <a
          href="https://jobtechdev.se"
          target="_blank"
          rel="noopener noreferrer"
        >
          Arbetsförmedlingen JobSearch API
        </a>{" "}
        · Matchning via Claude AI
      </footer>
    </div>
  );
}
