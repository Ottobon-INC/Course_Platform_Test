// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

import { course, cohorts, onDemand, workshops } from "../data/goalmatchData";
import { markProfileFlowCompleted } from "../utils/flowState";

function Toast({ message, visible }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    if (visible) {
      ref.current.style.transform = "translateX(-50%) translateY(0)";
    } else {
      ref.current.style.transform = "translateX(-50%) translateY(80px)";
    }
  }, [visible]);
  return (
    <div
      ref={ref}
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%) translateY(80px)",
        background: "#244855",
        color: "#fff",
        fontFamily: "inherit",
        fontSize: "0.92rem",
        fontWeight: 700,
        padding: "13px 28px",
        borderRadius: 99,
        boxShadow: "0 8px 28px rgba(36,72,85,.28)",
        zIndex: 9999,
        transition: "transform .42s cubic-bezier(.34,1.56,.64,1)",
        whiteSpace: "nowrap",
        pointerEvents: "none"
      }}
    >
      {message}
    </div>
  );
}
var C3 = {
  navy: "#244855",
  coral: "#E64833",
  brown: "#874F41",
  slate: "#90AEAD",
  cream: "#FBE9D0",
  white: "#FFFFFF",
  border: "#e8e0d0"
};
var paths = [
  {
    id: "fullstack",
    icon: "\u{1F4BB}",
    title: "Full Stack Dev",
    matchPct: 82,
    haveSkills: ["HTML", "CSS", "JavaScript", "React"],
    missingSkills: ["Node.js", "REST APIs", "Databases"],
    cohorts: [
      { name: "Full Stack Bootcamp \u2013 Batch 12", instructor: "Priya Sharma", initials: "PS", startDate: "Apr 20, 2025", schedule: "Mon / Wed / Fri", duration: "12 Weeks", seats: 3 },
      { name: "MERN Stack Mastery Live", instructor: "Arun Mehta", initials: "AM", startDate: "May 5, 2025", schedule: "Tue / Thu", duration: "10 Weeks", seats: 9 },
      { name: "Full Stack with TypeScript", instructor: "Neha Gupta", initials: "NG", startDate: "May 12, 2025", schedule: "Weekends", duration: "14 Weeks", seats: 2 },
      { name: "Backend-First Full Stack", instructor: "Rahul Joshi", initials: "RJ", startDate: "Jun 1, 2025", schedule: "Daily (1 hr)", duration: "8 Weeks", seats: 14 }
    ],
    ondemand: [
      { name: "The Complete Full Stack Developer", instructor: "Vikram Nair", rating: 4.8, reviews: "12.4k", progress: 34, enrolled: "48,200" },
      { name: "Node.js & Express \u2014 Zero to Hero", instructor: "Sunita Rao", rating: 4.6, reviews: "8.1k", progress: 0, enrolled: "31,500" },
      { name: "React + Redux Deep Dive", instructor: "Dev Pillai", rating: 4.9, reviews: "19.2k", progress: 67, enrolled: "72,000" },
      { name: "Database Design & SQL Mastery", instructor: "Ananya Bose", rating: 4.7, reviews: "5.6k", progress: 0, enrolled: "22,100" }
    ],
    workshops: [
      { name: "Build a REST API in 90 Minutes", type: "Hands-on", date: "Apr 15, 2025", duration: "90 min" },
      { name: "Docker for Full Stack Devs", type: "Live Demo", date: "Apr 22, 2025", duration: "60 min" },
      { name: "Full Stack Career Q&A", type: "Q&A Session", date: "Apr 28, 2025", duration: "45 min" },
      { name: "CI/CD Pipelines Hands-on", type: "Hands-on", date: "May 6, 2025", duration: "2 hrs" },
      { name: "Authentication & JWT Deep Dive", type: "Live Demo", date: "May 13, 2025", duration: "75 min" },
      { name: "Portfolio Review Session", type: "Q&A Session", date: "May 20, 2025", duration: "60 min" }
    ]
  },
  {
    id: "frontend",
    icon: "\u{1F3A8}",
    title: "Frontend Dev",
    matchPct: 74,
    haveSkills: ["HTML", "CSS", "JavaScript", "React"],
    missingSkills: ["TypeScript", "Testing", "Accessibility"],
    cohorts: [
      { name: "Frontend Engineering Bootcamp", instructor: "Meera Iyer", initials: "MI", startDate: "Apr 18, 2025", schedule: "Mon / Wed / Fri", duration: "10 Weeks", seats: 5 },
      { name: "Advanced React & Next.js Live", instructor: "Kiran Bhat", initials: "KB", startDate: "May 3, 2025", schedule: "Tue / Thu", duration: "8 Weeks", seats: 1 },
      { name: "UI/UX + Frontend Integration", instructor: "Sonal Verma", initials: "SV", startDate: "May 8, 2025", schedule: "Weekends", duration: "12 Weeks", seats: 11 },
      { name: "TypeScript for React Devs", instructor: "Arjun Das", initials: "AD", startDate: "Jun 2, 2025", schedule: "Mon / Thu", duration: "6 Weeks", seats: 7 }
    ],
    ondemand: [
      { name: "The Complete Frontend Roadmap 2025", instructor: "Raj Kumar", rating: 4.9, reviews: "21k", progress: 55, enrolled: "91,000" },
      { name: "TypeScript \u2014 Strongly Typed React", instructor: "Divya Nair", rating: 4.7, reviews: "9.3k", progress: 0, enrolled: "38,400" },
      { name: "CSS Animations & Motion Design", instructor: "Pooja Menon", rating: 4.8, reviews: "6.2k", progress: 21, enrolled: "27,800" },
      { name: "Web Accessibility Masterclass", instructor: "Suresh Nanda", rating: 4.6, reviews: "3.9k", progress: 0, enrolled: "15,200" }
    ],
    workshops: [
      { name: "CSS Grid & Flex in Practice", type: "Hands-on", date: "Apr 16, 2025", duration: "75 min" },
      { name: "Next.js 14 App Router Walk-through", type: "Live Demo", date: "Apr 23, 2025", duration: "60 min" },
      { name: "Frontend Interview Prep Q&A", type: "Q&A Session", date: "Apr 30, 2025", duration: "45 min" },
      { name: "Performance Optimization Workshop", type: "Hands-on", date: "May 7, 2025", duration: "90 min" },
      { name: "Component Library with Storybook", type: "Live Demo", date: "May 14, 2025", duration: "60 min" },
      { name: "Testing React Applications", type: "Hands-on", date: "May 21, 2025", duration: "2 hrs" }
    ]
  },
  {
    id: "cloud",
    icon: "\u2601\uFE0F",
    title: "Cloud Engineer",
    matchPct: 56,
    haveSkills: ["Linux", "Git", "Python"],
    missingSkills: ["AWS", "Kubernetes", "Terraform", "Networking"],
    cohorts: [
      { name: "AWS Cloud Architect Bootcamp", instructor: "Ravi Shankar", initials: "RS", startDate: "Apr 25, 2025", schedule: "Mon / Wed / Fri", duration: "16 Weeks", seats: 4 },
      { name: "DevOps & Cloud Live Program", instructor: "Kavita Bhatt", initials: "KB", startDate: "May 10, 2025", schedule: "Tue / Thu / Sat", duration: "12 Weeks", seats: 8 },
      { name: "Kubernetes in Production", instructor: "Mohit Singh", initials: "MS", startDate: "May 15, 2025", schedule: "Weekends", duration: "10 Weeks", seats: 3 },
      { name: "GCP Professional Cloud Dev", instructor: "Nisha Patel", initials: "NP", startDate: "Jun 5, 2025", schedule: "Mon / Fri", duration: "14 Weeks", seats: 17 }
    ],
    ondemand: [
      { name: "AWS Solutions Architect \u2013 Associate", instructor: "Aditya Kumar", rating: 4.9, reviews: "33k", progress: 12, enrolled: "140,000" },
      { name: "Docker & Kubernetes Complete Guide", instructor: "Preeti Jain", rating: 4.8, reviews: "18.7k", progress: 0, enrolled: "82,300" },
      { name: "Terraform Infrastructure as Code", instructor: "Varun Kapoor", rating: 4.7, reviews: "7.4k", progress: 0, enrolled: "34,500" },
      { name: "Cloud Networks & Security", instructor: "Deepa Reddy", rating: 4.6, reviews: "4.8k", progress: 0, enrolled: "19,700" }
    ],
    workshops: [
      { name: "Deploy on AWS in 60 Minutes", type: "Hands-on", date: "Apr 17, 2025", duration: "60 min" },
      { name: "Kubernetes Cluster Live Setup", type: "Live Demo", date: "Apr 24, 2025", duration: "90 min" },
      { name: "Cloud Certification Q&A", type: "Q&A Session", date: "May 1, 2025", duration: "45 min" },
      { name: "Serverless Architectures Workshop", type: "Hands-on", date: "May 8, 2025", duration: "2 hrs" },
      { name: "Monitoring with Prometheus & Grafana", type: "Live Demo", date: "May 15, 2025", duration: "75 min" },
      { name: "Cost Optimization on Cloud", type: "Q&A Session", date: "May 22, 2025", duration: "60 min" }
    ]
  },
  {
    id: "data",
    icon: "\u{1F4CA}",
    title: "Data Analyst",
    matchPct: 63,
    haveSkills: ["Python", "SQL", "Excel"],
    missingSkills: ["Power BI", "Machine Learning", "Statistics"],
    cohorts: [
      { name: "Data Analytics Bootcamp \u2013 Batch 7", instructor: "Sneha Kulkarni", initials: "SK", startDate: "Apr 22, 2025", schedule: "Mon / Wed / Fri", duration: "12 Weeks", seats: 2 },
      { name: "Business Intelligence with Power BI", instructor: "Manish Tripathi", initials: "MT", startDate: "May 6, 2025", schedule: "Tue / Thu", duration: "8 Weeks", seats: 6 },
      { name: "Python for Data Science Live", instructor: "Lata Krishnan", initials: "LK", startDate: "May 14, 2025", schedule: "Weekends", duration: "10 Weeks", seats: 12 },
      { name: "SQL & Advanced Analytics", instructor: "Ajay Rao", initials: "AR", startDate: "Jun 3, 2025", schedule: "Mon / Thu", duration: "6 Weeks", seats: 20 }
    ],
    ondemand: [
      { name: "Data Analytics with Python & SQL", instructor: "Pradeep Sen", rating: 4.8, reviews: "14.2k", progress: 44, enrolled: "57,800" },
      { name: "Power BI for Beginners to Advanced", instructor: "Rekha Iyer", rating: 4.7, reviews: "9.8k", progress: 0, enrolled: "43,200" },
      { name: "Statistics for Data Analysis", instructor: "Srinivas Rao", rating: 4.6, reviews: "6.1k", progress: 0, enrolled: "28,400" },
      { name: "Intro to Machine Learning", instructor: "Geeta Sharma", rating: 4.9, reviews: "25.3k", progress: 8, enrolled: "115,000" }
    ],
    workshops: [
      { name: "Excel to Power BI Migration", type: "Hands-on", date: "Apr 14, 2025", duration: "90 min" },
      { name: "Live Dashboard Build with Tableau", type: "Live Demo", date: "Apr 21, 2025", duration: "75 min" },
      { name: "Data Analyst Career Q&A", type: "Q&A Session", date: "Apr 29, 2025", duration: "45 min" },
      { name: "SQL Window Functions Workshop", type: "Hands-on", date: "May 5, 2025", duration: "60 min" },
      { name: "EDA with Python \u2014 Live", type: "Live Demo", date: "May 12, 2025", duration: "90 min" },
      { name: "Storytelling with Data", type: "Q&A Session", date: "May 19, 2025", duration: "60 min" }
    ]
  }
];
function pillStyle2(type) {
  if (type === "Hands-on") return { background: "rgba(36,72,85,.09)", color: C3.navy };
  if (type === "Live Demo") return { background: "rgba(230,72,51,.09)", color: C3.coral };
  return { background: "rgba(135,79,65,.09)", color: C3.brown };
}
function pillIcon2(type) {
  if (type === "Hands-on") return "\u{1F6E0}";
  if (type === "Live Demo") return "\u{1F4FA}";
  return "\u{1F4AC}";
}
function RecommendationPath() {
  const [, navigate] = useLocation();
  const [activePathIdx, setActivePathIdx] = useState(0);
  const [activeSec, setActiveSec] = useState("cohorts");
  const [toast, setToast] = useState({ msg: "", visible: false });
  const toastTimer = useRef(0);
  const progressRefs = useRef(paths.map(() => []));
  const ringRef = useRef(null);
  const ringTextRef = useRef(null);
  const counterRef = useRef(0);
  const showToast = (msg) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, visible: true });
    toastTimer.current = window.setTimeout(
      () => setToast((t) => ({ ...t, visible: false })),
      3200
    );
  };
  useEffect(() => {
    const p2 = paths[activePathIdx];
    const circ2 = 163;
    const offset = circ2 - circ2 * p2.matchPct / 100;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (ringRef.current) {
          ringRef.current.style.strokeDashoffset = String(circ2);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (ringRef.current) ringRef.current.style.strokeDashoffset = String(offset);
            });
          });
        }
      });
    });
    const start = performance.now();
    const duration = 1200;
    const target = p2.matchPct;
    cancelAnimationFrame(counterRef.current);
    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      if (ringTextRef.current)
        ringTextRef.current.textContent = Math.round(ease * target) + "%";
      if (t < 1) counterRef.current = requestAnimationFrame(tick);
    }
    counterRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(counterRef.current);
  }, [activePathIdx]);
  useEffect(() => {
    if (activeSec !== "ondemand") return;
    const refs = progressRefs.current[activePathIdx];
    const p2 = paths[activePathIdx];
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        refs.forEach((el, i) => {
          if (el) el.style.width = p2.ondemand[i]?.progress + "%";
        });
      });
    });
  }, [activeSec, activePathIdx]);
  const switchPath = (idx) => {
    const refs = progressRefs.current[idx];
    refs.forEach((el) => {
      if (el) el.style.width = "0%";
    });
    setActivePathIdx(idx);
    setActiveSec("cohorts");
  };
  const switchSec = (sec) => {
    setActiveSec(sec);
    if (sec === "ondemand") {
      const refs = progressRefs.current[activePathIdx];
      const p2 = paths[activePathIdx];
      refs.forEach((el) => {
        if (el) el.style.width = "0%";
      });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          refs.forEach((el, i) => {
            if (el) el.style.width = p2.ondemand[i]?.progress + "%";
          });
        });
      });
    }
  };
  const p = paths[activePathIdx];
  const circ = 163;
  return <div style={{ background: C3.cream, color: C3.navy, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0;transform:translateY(18px); } to { opacity:1;transform:translateY(0); } }
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.4;transform:scale(.6);} }
        .path-tab-btn { transition: all .25s; }
        .path-tab-btn:hover { border-color: ${C3.slate} !important; }
        .cohort-card, .od-card, .ws-card { transition: border-color .25s, box-shadow .25s, transform .25s; }
        .cohort-card:hover { border-color: ${C3.navy} !important; box-shadow: 0 6px 22px rgba(36,72,85,.11) !important; transform: translateY(-2px); }
        .od-card:hover    { border-color: ${C3.slate} !important; box-shadow: 0 6px 22px rgba(36,72,85,.09) !important; transform: translateY(-2px); }
        .ws-card:hover    { border-color: ${C3.brown} !important; box-shadow: 0 6px 20px rgba(135,79,65,.1)  !important; transform: translateY(-2px); }
        .cta-btn { transition: all .25s; }
        .cta-btn:active { transform: translateY(0) !important; }
        .sec-tab-btn { transition: all .25s; }
        .sec-tab-btn:hover { color: ${C3.navy} !important; }
        @media (max-width:600px){ .cohort-grid, .od-grid { grid-template-columns:1fr !important; } }
        @media (max-width:700px){ .ws-grid { grid-template-columns:1fr 1fr !important; } }
        @media (max-width:460px){ .ws-grid { grid-template-columns:1fr !important; } }
      `}</style>

      <div style={{ maxWidth: 1e3, margin: "0 auto", padding: "28px 20px 90px", display: "flex", flexDirection: "column", gap: 20 }}>

        <Toast message={toast.msg} visible={toast.visible} />

        {
    /* ── TOP NAV ── */
  }
        <div style={{ background: C3.navy, borderRadius: 16, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", animation: "fadeUp .5s ease .04s both" }}>
          <div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(1.1rem,3.5vw,1.5rem)", fontWeight: 800, color: C3.white, lineHeight: 1.2 }}>
              Recommended Learning Paths
            </h1>
            <p style={{ fontSize: "0.82rem", color: C3.slate, marginTop: 3, fontWeight: 500 }}>
              Curated programs matched to your skill profile
            </p>
          </div>
          <div style={{ background: C3.coral, color: "#fff", fontSize: "0.82rem", fontWeight: 800, padding: "7px 18px", borderRadius: 99, whiteSpace: "nowrap", flexShrink: 0 }}>
            70% Ready 🚀
          </div>
        </div>

        {
    /* ── PATH SELECTOR TABS ── */
  }
        <div style={{ animation: "fadeUp .5s ease .1s both" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, padding: "4px 2px" }}>
            {paths.map((pt, i) => <button
    key={pt.id}
    className="path-tab-btn"
    onClick={() => switchPath(i)}
    aria-selected={i === activePathIdx}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 7,
      padding: "9px 16px",
      borderRadius: 99,
      border: `2px solid ${i === activePathIdx ? C3.navy : C3.border}`,
      background: i === activePathIdx ? C3.navy : C3.white,
      fontFamily: "inherit",
      fontSize: "0.84rem",
      fontWeight: 700,
      color: i === activePathIdx ? "#fff" : C3.navy,
      cursor: "pointer",
      whiteSpace: "nowrap",
      boxShadow: i === activePathIdx ? "0 4px 16px rgba(36,72,85,.22)" : "none"
    }}
  >
                <span style={{ fontSize: "0.95rem" }}>{pt.icon}</span>
                {pt.title}
                <span style={{
    fontSize: "0.7rem",
    fontWeight: 800,
    padding: "2px 8px",
    borderRadius: 99,
    background: i === activePathIdx ? "rgba(255,255,255,.18)" : "rgba(36,72,85,.08)",
    color: i === activePathIdx ? "rgba(255,255,255,.85)" : C3.brown
  }}>{pt.matchPct}%</span>
              </button>)}
          </div>
        </div>

        {
    /* ── MATCH BANNER ── */
  }
        <div style={{ background: C3.white, borderRadius: 16, boxShadow: "0 2px 16px rgba(36,72,85,.09)", borderLeft: `4px solid ${C3.navy}`, padding: "22px 24px", display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap", animation: "fadeUp .5s ease .16s both" }}>
          {
    /* SVG Ring */
  }
          <div style={{ position: "relative", width: 68, height: 68, flexShrink: 0 }}>
            <svg width={68} height={68} viewBox="0 0 68 68" style={{ transform: "rotate(-90deg)", position: "absolute", inset: 0 }} aria-hidden>
              <circle cx={34} cy={34} r={26} fill="none" stroke={C3.cream} strokeWidth={6} />
              <circle
    ref={ringRef}
    cx={34}
    cy={34}
    r={26}
    fill="none"
    stroke={C3.coral}
    strokeWidth={6}
    strokeLinecap="round"
    strokeDasharray={circ}
    strokeDashoffset={circ}
    style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1) .2s" }}
  />
            </svg>
            <div ref={ringTextRef} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 800, color: C3.navy }}>
              0%
            </div>
          </div>

          {
    /* Text + chips */
  }
          <div style={{ flex: 1, minWidth: 200 }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(1rem,2.8vw,1.25rem)", fontWeight: 800, color: C3.navy, marginBottom: 6 }}>
              {p.icon} {p.title}
            </h2>
            <p style={{ fontSize: "0.84rem", color: "#5a6472", fontWeight: 500, lineHeight: 1.55, marginBottom: 14 }}>
              You match <strong>{p.matchPct}%</strong> of the skills required. Fill the gaps with the programs below.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {p.haveSkills.map((s) => <span key={s} style={{ fontSize: "0.76rem", fontWeight: 700, padding: "4px 12px", borderRadius: 99, background: "#EEF4F4", color: C3.navy, border: `1.5px solid rgba(36,72,85,.14)`, display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ color: C3.slate }}>✓</span>{s}
                </span>)}
              {p.missingSkills.map((s) => <span key={s} style={{ fontSize: "0.76rem", fontWeight: 700, padding: "4px 12px", borderRadius: 99, background: "#FDF0EE", color: C3.coral, border: `1.5px solid rgba(230,72,51,.18)`, display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ color: C3.coral }}>+</span>{s}
                </span>)}
            </div>
          </div>
        </div>

        {
    /* ── CONTENT CARD ── */
  }
        <div style={{ background: C3.white, borderRadius: 16, boxShadow: "0 2px 16px rgba(36,72,85,.09)", animation: "fadeUp .5s ease .22s both", overflow: "hidden" }}>

          {
    /* Section tabs */
  }
          <div style={{ display: "flex", gap: 0, borderBottom: `2px solid ${C3.border}`, padding: "0 24px", overflowX: "auto", scrollbarWidth: "none" }}>
            {["cohorts", "ondemand", "workshops"].map((sec) => {
    const isActive = sec === activeSec;
    const labels = { cohorts: "\u{1F5D3} Cohorts", ondemand: "\u25B6 On-Demand", workshops: "\u2726 Workshops" };
    const counts = { cohorts: p.cohorts.length, ondemand: p.ondemand.length, workshops: p.workshops.length };
    return <button
      key={sec}
      className="sec-tab-btn"
      onClick={() => switchSec(sec)}
      style={{
        padding: "14px 20px",
        fontFamily: "inherit",
        fontSize: "0.86rem",
        fontWeight: isActive ? 800 : 700,
        color: isActive ? C3.navy : C3.slate,
        background: "none",
        border: "none",
        borderBottom: `3px solid ${isActive ? C3.coral : "transparent"}`,
        cursor: "pointer",
        marginBottom: -2,
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        gap: 7
      }}
    >
                  {labels[sec]}
                  <span style={{ fontSize: "0.7rem", fontWeight: 800, padding: "2px 8px", borderRadius: 99, background: isActive ? C3.coral : "rgba(36,72,85,.08)", color: isActive ? "#fff" : C3.navy }}>
                    {counts[sec]}
                  </span>
                </button>;
  })}
          </div>

          {
    /* ── COHORTS PANEL ── */
  }
          {activeSec === "cohorts" && <div style={{ padding: 24 }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: C3.slate, marginBottom: 14 }}>
                Live Instructor-Led Cohorts
              </div>
              <div className="cohort-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {p.cohorts.map((c, ci) => <div key={ci} className="cohort-card" style={{ border: `1.5px solid ${C3.border}`, borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
                    {
    /* Top row */
  }
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: C3.navy, color: "#fff", fontSize: "0.78rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {c.initials}
                      </div>
                      <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "3px 10px", borderRadius: 99, whiteSpace: "nowrap", flexShrink: 0, ...c.seats <= 5 ? { background: "rgba(230,72,51,.1)", color: C3.coral, border: `1.5px solid rgba(230,72,51,.25)` } : { background: "rgba(144,174,173,.12)", color: C3.slate, border: `1.5px solid rgba(144,174,173,.3)` } }}>
                        {c.seats <= 5 ? "\u{1F525}" : "\u{1FA91}"} {c.seats} seats left
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.93rem", fontWeight: 800, color: C3.navy, lineHeight: 1.35 }}>{c.name}</div>
                      <div style={{ fontSize: "0.78rem", color: "#6b7280", fontWeight: 500, marginTop: 2 }}>by {c.instructor}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {[{ icon: "\u{1F4C5}", text: `Starts ${c.startDate}` }, { icon: "\u{1F550}", text: c.schedule }, { icon: "\u23F1", text: c.duration }].map((row) => <div key={row.icon} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "0.79rem", color: "#6b7280", fontWeight: 500 }}>
                          <span style={{ fontSize: "0.85rem" }}>{row.icon}</span>{row.text}
                        </div>)}
                    </div>
                    <button
    className="cta-btn"
    onClick={() => showToast("Opening full course \u{1F4DA}")}
    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit", fontSize: "0.82rem", fontWeight: 800, padding: "10px 18px", borderRadius: 99, border: `2px solid ${C3.coral}`, background: C3.coral, color: "#fff", cursor: "pointer", width: "100%" }}
    onMouseEnter={(e) => Object.assign(e.currentTarget.style, { background: "#c93b28", borderColor: "#c93b28", transform: "translateY(-1px)", boxShadow: "0 5px 16px rgba(230,72,51,.3)" })}
    onMouseLeave={(e) => Object.assign(e.currentTarget.style, { background: C3.coral, borderColor: C3.coral, transform: "none", boxShadow: "none" })}
  >
                      Join Batch →
                    </button>
                  </div>)}
              </div>
            </div>}

          {
    /* ── ON-DEMAND PANEL ── */
  }
          {activeSec === "ondemand" && <div style={{ padding: 24 }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: C3.slate, marginBottom: 14 }}>
                Self-Paced On-Demand Courses
              </div>
              <div className="od-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {p.ondemand.map((od, oi) => <div key={oi} className="od-card" style={{ border: `1.5px solid ${C3.border}`, borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 800, padding: "4px 10px", borderRadius: 99, background: "rgba(255,193,7,.12)", color: "#b8860b", border: `1.5px solid rgba(255,193,7,.3)`, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap", flexShrink: 0 }}>
                        ⭐ {od.rating} ({od.reviews})
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.93rem", fontWeight: 800, color: C3.navy, lineHeight: 1.35 }}>{od.name}</div>
                      <div style={{ fontSize: "0.78rem", color: "#6b7280", fontWeight: 500, marginTop: 2 }}>by {od.instructor}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem", fontWeight: 700, color: C3.slate }}>
                        <span>{od.progress > 0 ? "Progress" : "Not started"}</span>
                        <span>{od.progress}%</span>
                      </div>
                      <div style={{ width: "100%", height: 8, background: C3.cream, borderRadius: 99, overflow: "hidden" }}>
                        <div
    ref={(el) => {
      progressRefs.current[activePathIdx][oi] = el;
    }}
    style={{ height: "100%", background: `linear-gradient(90deg, ${C3.slate}, ${C3.navy})`, borderRadius: 99, width: "0%", transition: "width 1.2s cubic-bezier(.4,0,.2,1)" }}
  />
                      </div>
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "#6b7280", fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
                      👥 {od.enrolled} enrolled
                    </div>
                    <button
    className="cta-btn"
    onClick={() => showToast("Opening full course \u{1F4DA}")}
    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit", fontSize: "0.82rem", fontWeight: 800, padding: "10px 18px", borderRadius: 99, border: `2px solid ${C3.slate}`, background: C3.slate, color: "#fff", cursor: "pointer", width: "100%" }}
    onMouseEnter={(e) => Object.assign(e.currentTarget.style, { background: "#6a9a98", borderColor: "#6a9a98", transform: "translateY(-1px)", boxShadow: "0 5px 14px rgba(144,174,173,.3)" })}
    onMouseLeave={(e) => Object.assign(e.currentTarget.style, { background: C3.slate, borderColor: C3.slate, transform: "none", boxShadow: "none" })}
  >
                      Start Now →
                    </button>
                  </div>)}
              </div>
            </div>}

          {
    /* ── WORKSHOPS PANEL ── */
  }
          {activeSec === "workshops" && <div style={{ padding: 24 }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: C3.slate, marginBottom: 14 }}>
                Live Workshops & Sessions
              </div>
              <div className="ws-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                {p.workshops.map((ws, wi) => <div key={wi} className="ws-card" style={{ border: `1.5px solid ${C3.border}`, borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 11 }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "3px 11px", borderRadius: 99, alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 5, ...pillStyle2(ws.type) }}>
                      {pillIcon2(ws.type)} {ws.type}
                    </span>
                    <div style={{ fontSize: "0.88rem", fontWeight: 800, color: C3.navy, lineHeight: 1.35 }}>{ws.name}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ fontSize: "0.76rem", color: "#6b7280", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>📅 {ws.date}</div>
                      <div style={{ fontSize: "0.76rem", color: "#6b7280", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>⏱ {ws.duration}</div>
                    </div>
                    <button
    className="cta-btn"
    onClick={() => showToast("Opening full course \u{1F4DA}")}
    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit", fontSize: "0.82rem", fontWeight: 800, padding: "10px 18px", borderRadius: 99, border: `2px solid ${C3.brown}`, background: "transparent", color: C3.brown, cursor: "pointer", width: "100%" }}
    onMouseEnter={(e) => Object.assign(e.currentTarget.style, { background: C3.brown, color: "#fff", transform: "translateY(-1px)", boxShadow: "0 5px 14px rgba(135,79,65,.25)" })}
    onMouseLeave={(e) => Object.assign(e.currentTarget.style, { background: "transparent", color: C3.brown, transform: "none", boxShadow: "none" })}
  >
                      Register →
                    </button>
                  </div>)}
              </div>
            </div>}
        </div>

        {
    /* ── EXPLORE MORE COURSES BANNER ── */
  }
        <div style={{ background: `linear-gradient(135deg, ${C3.navy} 0%, #1a3540 100%)`, borderRadius: 16, padding: "28px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap", animation: "fadeUp .5s ease .3s both", boxShadow: "0 6px 28px rgba(36,72,85,.22)" }}>
          <div>
            <div style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: C3.slate, marginBottom: 6 }}>Not finding the right fit?</div>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(1rem,2.8vw,1.2rem)", fontWeight: 800, color: "#fff", margin: "0 0 6px", lineHeight: 1.3 }}>Explore our full course catalogue</h3>
            <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,.6)", margin: 0, fontWeight: 500 }}>500+ programs across tech, data, design &amp; business</p>
          </div>
          <button
    className="cta-btn"
    onClick={() => {
      markProfileFlowCompleted();
      navigate("/student-dashboard");
    }}
    style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit", fontSize: "0.9rem", fontWeight: 800, padding: "13px 26px", borderRadius: 99, border: "2px solid rgba(255,255,255,.35)", background: "rgba(255,255,255,.12)", color: "#fff", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, boxShadow: "0 4px 18px rgba(0,0,0,.12)" }}
    onMouseEnter={(e) => Object.assign(e.currentTarget.style, { background: "rgba(255,255,255,.2)", transform: "translateY(-2px)", boxShadow: "0 8px 24px rgba(0,0,0,.18)" })}
    onMouseLeave={(e) => Object.assign(e.currentTarget.style, { background: "rgba(255,255,255,.12)", transform: "none", boxShadow: "0 4px 18px rgba(0,0,0,.12)" })}
  >
            Continue to Dashboard →
          </button>
          <button
    className="cta-btn"
    onClick={() => showToast("Opening full course catalogue \u{1F4DA}")}
    style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit", fontSize: "0.9rem", fontWeight: 800, padding: "13px 26px", borderRadius: 99, border: `2px solid ${C3.coral}`, background: C3.coral, color: "#fff", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, boxShadow: "0 4px 18px rgba(230,72,51,.35)" }}
    onMouseEnter={(e) => Object.assign(e.currentTarget.style, { background: "#c93b28", borderColor: "#c93b28", transform: "translateY(-2px)", boxShadow: "0 8px 24px rgba(230,72,51,.45)" })}
    onMouseLeave={(e) => Object.assign(e.currentTarget.style, { background: C3.coral, borderColor: C3.coral, transform: "none", boxShadow: "0 4px 18px rgba(230,72,51,.35)" })}
  >
            🔍 Explore More Courses
          </button>
        </div>

        {
    /* ── BACK ROW ── */
  }
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, animation: "fadeUp .5s ease .34s both" }}>
          <button
    onClick={() => window.history.back()}
    style={{ fontFamily: "inherit", fontSize: "0.84rem", fontWeight: 700, color: C3.brown, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3, display: "flex", alignItems: "center", gap: 5 }}
    onMouseEnter={(e) => e.currentTarget.style.color = C3.navy}
    onMouseLeave={(e) => e.currentTarget.style.color = C3.brown}
  >
            ← Back to Results
          </button>
          <span style={{ fontSize: "0.78rem", color: C3.slate, fontWeight: 600 }}>
            Recommended Learning Paths · CareerAI
          </span>
        </div>

      </div>
    </div>;
}

export default RecommendationPath;
