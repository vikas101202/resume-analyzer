"use client";

import { useEffect, useRef, useState } from "react";
// @ts-ignore
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.mjs`;

type Analysis = {
  ats_score: number;
  impact_score: number;
  readability_score: number;
  strengths: string[];
  gaps: string[];
  skills: string[];
  suggestions: string[];
  summary: string;
};

export default function Home() {
  const orbRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [b64, setB64] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isOver, setIsOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");

  useEffect(() => {
    const orb = orbRef.current;
    if (!orb) return;

    let ox = window.innerWidth / 2;
    let oy = window.innerHeight / 2;
    let tx = ox;
    let ty = oy;
    let visible = false;
    let frame = 0;

    const mouseMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!visible) {
        orb.style.opacity = "1";
        visible = true;
      }
    };

    const mouseLeave = () => {
      orb.style.opacity = "0";
      visible = false;
    };

    const tick = () => {
      ox += (tx - ox) * 0.08;
      oy += (ty - oy) * 0.08;
      orb.style.left = ox + "px";
      orb.style.top = oy + "px";
      frame = requestAnimationFrame(tick);
    };

    document.addEventListener("mousemove", mouseMove);
    document.addEventListener("mouseleave", mouseLeave);
    tick();

    return () => {
      document.removeEventListener("mousemove", mouseMove);
      document.removeEventListener("mouseleave", mouseLeave);
      cancelAnimationFrame(frame);
    };
  }, []);
async function extractPdfText(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();

    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ");

    fullText += pageText + "\n";
  }

  return fullText;
}
  function pick(f?: File) {
    if (!f) return;

    if (!["application/pdf", "image/jpeg", "image/jpg", "image/png"].includes(f.type)) {
      setError("Please upload a PDF, JPG or PNG.");
      return;
    }

    if (f.size > 10 * 1024 * 1024) {
      setError("File must be under 10 MB.");
      return;
    }

    setFile(f);
    setError("");
    setAnalysis(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = String(event.target?.result || "");
      setB64(result.split(",")[1] || "");
    };
    reader.readAsDataURL(f);
  }

  function removeFile() {
    setFile(null);
    setB64(null);
    setAnalysis(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function analyze() {
  
    setError("");

    //if (!file || !b64) {
      //setError("Please upload your résumé first.");
      //return;
    //}

    setLoading(true);
    setAnalysis(null);
    if (file?.type === "application/pdf") {
  const text = await extractPdfText(file);
  console.log("Extracted PDF text:", text);
}

    try {
 const resumeText =
  file?.type === "application/pdf"
    ? await extractPdfText(file)
    : "";

const res = await fetch("/api/analyze", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    resumeText,
  }),
});

const data = await res.json();

  setAnalysis(data);

  setTimeout(() => {
    document.getElementById("results")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 100);
} catch (e) {
  setError("Something went wrong while contacting backend.");
} finally {
  setLoading(false);
}

  }

  function circleFor(value: number, label: string) {
    const r = 28;
    const c = 2 * Math.PI * r;
    const dash = (Math.min(100, Math.max(0, value)) / 100) * c;

    return (
      <div className="score-cell">
        <div className="sc-wrap">
          <svg width="68" height="68" viewBox="0 0 68 68">
            <circle cx="34" cy="34" r={r} fill="none" stroke="var(--bg3)" strokeWidth="4" />
            <circle
              cx="34"
              cy="34"
              r={r}
              fill="none"
              stroke="var(--text)"
              strokeWidth="4"
              strokeDasharray={`${dash.toFixed(2)} ${c.toFixed(2)}`}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 1.1s cubic-bezier(0.34,1.4,0.64,1)" }}
            />
          </svg>
          <span className="sc-num">{value}</span>
        </div>
        <div className="sc-lbl">{label}</div>
      </div>
    );
  }

  return (
    <>
      <div id="orb" ref={orbRef}></div>

      <div className="page">
        <nav>
          <span className="nav-logo">RA</span>
          <span className="nav-tag">Resume Analyzer</span>
        </nav>

        <div className="hero">
          <span className="hero-kicker">AI-powered · Instant feedback</span>
          <h1>
            Your résumé,
            <br />
            <em>refined.</em>
          </h1>
          <p>Upload your résumé and receive a detailed ATS score, skill gaps, and precise improvements — in seconds.</p>
        </div>

        <div className="card">
          <div className="field-row">
            <div>
              <label className="field-label" htmlFor="job-role">
                Target role
              </label>
              <input
                className="field-input"
                type="text"
                id="job-role"
                placeholder="e.g. Product Designer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="experience">
                Experience
              </label>
              <input
                className="field-input"
                type="text"
                id="experience"
                placeholder="e.g. 4 years"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              />
            </div>
          </div>

          <div className="upload-label-row">
            <span>Resume file</span>
            <span>Max 10 MB</span>
          </div>

          {!file && (
            <div
              className={`drop-zone ${isOver ? "over" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsOver(true);
              }}
              onDragLeave={() => setIsOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsOver(false);
                pick(e.dataTransfer.files[0]);
              }}
            >
              <input
  ref={fileInputRef}
  type="file"
  accept="application/pdf,image/jpeg,image/png"
  onChange={(e) => {
    const selectedFile = e.target.files?.[0];
    console.log("Selected file:", selectedFile);
    pick(selectedFile);
  }}
              />
              <i className="ti ti-upload dz-icon"></i>
              <div className="dz-main">Drop your file here</div>
              <div className="dz-sub">or click to browse your device</div>
              <div className="dz-pills">
                <span className="dz-pill">PDF</span>
                <span className="dz-pill">JPG</span>
                <span className="dz-pill">PNG</span>
              </div>
            </div>
          )}

          {file && (
            <div className="file-preview show">
              <i className="ti ti-file fp-icon"></i>
              <div className="fp-info">
                <div className="fp-name">{file.name}</div>
                <div className="fp-size">{(file.size / 1024).toFixed(1)} KB</div>
              </div>
              <button className="fp-rm" onClick={removeFile} title="Remove file">
                <i className="ti ti-x"></i>
              </button>
            </div>
          )}

          {error && (
            <div className="err show">
              <i className="ti ti-info-circle" style={{ flexShrink: 0 }}></i>
              <span>{error}</span>
            </div>
          )}
        </div>

       <button className="cta" onClick={analyze}>
          Analyze résumé &nbsp;→
        </button>

        <div className={`loading ${loading ? "show" : ""}`}>
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p>Reading your résumé…</p>
        </div>

        <div className={`results ${analysis ? "show" : ""}`} id="results">
          {analysis && (
            <div className="card" style={{ marginTop: "1rem" }}>
              <div className="res-head">
                <h2>Analysis</h2>
                <span>{file?.name}</span>
              </div>

              <div className="score-row">
                {circleFor(analysis.ats_score, "ATS")}
                {circleFor(analysis.impact_score, "Impact")}
                {circleFor(analysis.readability_score, "Readability")}
              </div>

              <div className="sh">Strengths</div>
              <div className="tags">
                {analysis.strengths.map((item) => (
                  <span className="tag pos" key={item}>
                    <i className="ti ti-check" style={{ fontSize: "11px", color: "var(--text3)" }}></i>
                    {item}
                  </span>
                ))}
              </div>

              <div className="sh">Gaps &amp; missing sections</div>
              <div className="tags">
                {analysis.gaps.map((item) => (
                  <span className="tag neg" key={item}>
                    {item}
                  </span>
                ))}
              </div>

              <div className="sh">Skills detected</div>
              <div className="tags">
                {analysis.skills.map((item) => (
                  <span className="tag skill" key={item}>
                    {item}
                  </span>
                ))}
              </div>

              <div className="div"></div>

              <div className="sh">Recommendations</div>
              <ul className="tips">
                {analysis.suggestions.map((item, index) => (
                  <li className="tip" key={item}>
                    <span className="tip-n">{index + 1}.</span>
                    <p>{item}</p>
                  </li>
                ))}
              </ul>

              <div className="summary-block">
                <p>{analysis.summary}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
