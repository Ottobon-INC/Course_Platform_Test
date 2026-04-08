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

var C = {
  navy: "#244855",
  coral: "#E64833",
  brown: "#874F41",
  slate: "#90AEAD",
  cream: "#FBE9D0",
  border: "#E8D9C0",
  white: "#FFFFFF"
};
function pillStyle(type) {
  if (type === "Hands-on") return { background: "rgba(36,72,85,.09)", color: C.navy };
  if (type === "Live Demo") return { background: "rgba(230,72,51,.09)", color: C.coral };
  return { background: "rgba(135,79,65,.09)", color: C.brown };
}
function pillIcon(type) {
  if (type === "Hands-on") return "\u{1F6E0}";
  if (type === "Live Demo") return "\u{1F4FA}";
  return "\u{1F4AC}";
}
function stars(n, max = 5) {
  return Array.from({ length: max }, (_, i) => i < n ? "\u2605" : "\u2606").join("");
}
function GoalMatch() {
  const [, navigate] = useLocation();
  const [activeSection, setActiveSection] = useState("cohorts");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [toast, setToast] = useState({ msg: "", visible: false });
  const strFillRef = useRef(null);
  const toastTimer = useRef(0);
  const progressRefs = useRef([]);
  const showToast = (msg) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, visible: true });
    toastTimer.current = window.setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3300);
  };
  useEffect(() => {
    const t2 = window.setTimeout(() => {
      if (strFillRef.current) strFillRef.current.style.width = `${course.profileStrength}%`;
    }, 200);
    return () => {
      clearTimeout(t2);
    };
  }, []);
  useEffect(() => {
    if (activeSection !== "ondemand") return;
    const refs = progressRefs.current;
    refs.forEach((el) => {
      if (el) el.style.width = "0%";
    });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        refs.forEach((el, i) => {
          if (el) el.style.width = (onDemand[i]?.progress ?? 0) + "%";
        });
      });
    });
  }, [activeSection]);
  const switchSection = (sec) => {
    if (sec === "ondemand") {
      progressRefs.current.forEach((el) => {
        if (el) el.style.width = "0%";
      });
    }
    setActiveSection(sec);
  };
  const circ = 2 * Math.PI * 30;
  
  const query = searchQuery.toLowerCase();
  const filteredCohorts = cohorts.filter(c => c.name.toLowerCase().includes(query) || c.instructor.toLowerCase().includes(query));
  const filteredOnDemand = onDemand.filter(c => c.name.toLowerCase().includes(query) || c.instructor.toLowerCase().includes(query));
  const filteredWorkshops = workshops.filter(c => c.name.toLowerCase().includes(query));

  const globalStyles = (
    <style>{`
      * { box-sizing: border-box; }
      @keyframes fadeUp { from { opacity:0;transform:translateY(18px); } to { opacity:1;transform:translateY(0); } }
      .sec-tab-btn { transition: all .25s; }
      .sec-tab-btn:hover { color: ${C.navy} !important; }
      .cohort-card, .od-card, .ws-card { transition: border-color .25s, box-shadow .25s, transform .25s; }
      .cohort-card:hover { border-color: ${C.navy}   !important; box-shadow: 0 6px 22px rgba(36,72,85,.11)  !important; transform: translateY(-2px); }
      .od-card:hover     { border-color: ${C.slate}  !important; box-shadow: 0 6px 22px rgba(36,72,85,.09)  !important; transform: translateY(-2px); }
      .ws-card:hover     { border-color: ${C.brown}  !important; box-shadow: 0 6px 20px rgba(135,79,65,.10) !important; transform: translateY(-2px); }
      .cta-card-btn { transition: all .25s; }
      .cta-card-btn:active { transform: translateY(0) !important; }
      @media (max-width:600px){ .cohort-grid, .od-grid { grid-template-columns:1fr !important; } }
      @media (max-width:700px){ .ws-grid { grid-template-columns:1fr 1fr !important; } }
      @media (max-width:460px){ .ws-grid { grid-template-columns:1fr !important; } }
    `}</style>
  );

  if (!hasSearched) {
      return (
        <div style={{ background: C.cream, color: C.navy, minHeight: "100vh", padding: "28px 18px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: "border-box", width: "100%", overflowX: "hidden" }}>
          {globalStyles}
          <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse at 8% 12%, rgba(36,72,85,.10) 0%, transparent 50%), radial-gradient(ellipse at 92% 88%, rgba(135,79,65,.09) 0%, transparent 50%)", pointerEvents: "none", zIndex: 0 }} />
          
          <div style={{ position: "relative", zIndex: 1, width: "94%", maxWidth: 500, background: C.white, padding: " clamp(24px, 5vw, 40px) clamp(20px, 4vw, 32px)", borderRadius: 24, boxShadow: "0 16px 60px rgba(36,72,85,.12)", textAlign: "center", animation: "fadeUp .55s cubic-bezier(.4,0,.2,1) both", boxSizing: "border-box" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: C.navy, marginBottom: 12 }}>Find Your Course</h1>
            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 32, lineHeight: 1.5 }}>Enter the specific course or skill you want to learn to see available live cohorts or on-demand materials.</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <input 
                autoFocus
                type="text" 
                placeholder="e.g. Full Stack, Data Science..." 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { 
                  if (e.key === 'Enter' && searchInput.trim()) { 
                    setSearchQuery(searchInput); 
                    setHasSearched(true); 
                  } 
                }}
                style={{ width: "100%", padding: "16px 20px", borderRadius: 14, border: `2px solid ${C.slate}`, outline: "none", fontSize: "1rem", color: C.navy }}
              />
              <button 
                onClick={() => {
                  if (searchInput.trim()) {
                    setSearchQuery(searchInput);
                    setHasSearched(true);
                  } else {
                    showToast("Please enter a course name \u26A0\uFE0F");
                  }
                }}
                style={{ width: "100%", padding: "16px", borderRadius: 14, background: C.coral, color: C.white, border: "none", fontSize: "1rem", fontWeight: 700, cursor: "pointer", transition: "transform .2s", boxShadow: "0 8px 24px rgba(230,72,51,.25)" }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
              >
                Search Options →
              </button>
            </div>
          </div>
          <Toast message={toast.msg} visible={toast.visible} />
        </div>
      );
  }

  return <div style={{ background: C.cream, color: C.navy, minHeight: "100vh", padding: "28px 18px 64px", position: "relative", fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: "border-box", overflowX: "hidden" }}>
      {globalStyles}

      {
    /* Soft BG */
  }
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse at 8% 12%, rgba(36,72,85,.10) 0%, transparent 50%), radial-gradient(ellipse at 92% 88%, rgba(135,79,65,.09) 0%, transparent 50%)", pointerEvents: "none", zIndex: 0 }} />

      <Toast message={toast.msg} visible={toast.visible} />

      <div style={{ maxWidth: 720, margin: "0 auto", position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 14 }}>

        {/* ── 1. Top Search Bar ── */}
        <Card style={{ padding: "10px 14px" }} delay={1}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input 
              type="text" 
              placeholder="Search for another course..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { 
                if (e.key === 'Enter' && searchInput.trim()) { 
                  setSearchQuery(searchInput); 
                } 
              }}
              style={{ flex: "1 1 240px", padding: "11px 16px", borderRadius: 10, border: `1.5px solid ${C.coral}`, outline: "none", fontSize: "14px", color: C.navy, minWidth: 0, background: "#FFF6F1", boxShadow: "inset 0 1px 2px rgba(230,72,51,.08)" }}
            />
            <button 
              onClick={() => {
                if (searchInput.trim()) {
                  setSearchQuery(searchInput);
                }
              }}
              style={{ flex: "0 0 auto", padding: "0 18px", height: 42, borderRadius: 10, background: C.coral, color: C.white, border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer", transition: "all .2s", boxShadow: "0 6px 18px rgba(230,72,51,.22)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#c93b28"}
              onMouseLeave={(e) => e.currentTarget.style.background = C.coral}
            >
              Search
            </button>
          </div>
        </Card>

        {
    /* ── 2. Course Header ── */
  }
        <Card style={{ borderTop: `3px solid ${C.navy}`, padding: "24px 24px 20px" }} delay={2}>
          <Micro>Search Results</Micro>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "clamp(1.2rem, 4vw, 1.55rem)", fontWeight: 800, color: C.navy, lineHeight: 1.25, marginBottom: 10, textTransform: "capitalize" }}>
              {searchQuery}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: "6px 14px", fontSize: "0.82rem", color: C.brown, fontWeight: 500 }}>
              <span>⏱ {course.duration}</span>
              <span style={{ color: C.border }}>·</span>
              <span style={{ letterSpacing: 1 }}>{stars(course.rating)}</span>
              <span style={{ color: C.border }}>·</span>
              <span>👤 {course.instructor}</span>
            </div>
          </div>
        </Card>

        {
    /* ── 3. Three-Tab Availability Section ── */
  }
        <Card style={{ overflow: "hidden", padding: 0 }} delay={3}>

          {
    /* Tab bar */
  }
          <div style={{ display: "flex", borderBottom: `2px solid ${C.border}`, padding: "0 20px", overflowX: "auto", scrollbarWidth: "none" }}>
            {["cohorts", "ondemand", "workshops"].map((sec) => {
    const isActive = sec === activeSection;
    const labels = { cohorts: "\u{1F5D3} Cohorts", ondemand: "\u25B6 On-Demand", workshops: "\u2726 Workshops" };
    const counts = { cohorts: filteredCohorts.length, ondemand: filteredOnDemand.length, workshops: filteredWorkshops.length };
    return <button
      key={sec}
      className="sec-tab-btn"
      onClick={() => switchSection(sec)}
      style={{
        padding: "14px 18px",
        fontFamily: "inherit",
        fontSize: "0.86rem",
        fontWeight: isActive ? 800 : 700,
        color: isActive ? C.navy : C.slate,
        background: "none",
        border: "none",
        borderBottom: `3px solid ${isActive ? C.coral : "transparent"}`,
        cursor: "pointer",
        marginBottom: -2,
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        gap: 7
      }}
    >
                  {labels[sec]}
                  <span style={{
      fontSize: "0.7rem",
      fontWeight: 800,
      padding: "2px 8px",
      borderRadius: 99,
      background: isActive ? C.coral : "rgba(36,72,85,.08)",
      color: isActive ? "#fff" : C.navy
    }}>
                    {counts[sec]}
                  </span>
                </button>;
  })}
          </div>

          {
    /* ── COHORTS PANEL ── */
  }
          {activeSection === "cohorts" && <div style={{ padding: 20 }}>
              <Micro style={{ marginBottom: 14 }}>Live Instructor-Led Cohorts</Micro>
              <div className="cohort-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                


                {filteredCohorts.map((c, ci) => <div key={ci} className="cohort-card" style={{ border: `1.5px solid ${C.border}`, borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                    {
    /* Top row */
  }
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.navy, color: "#fff", fontSize: "0.75rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {c.initials}
                      </div>
                      <span style={{ fontSize: "0.7rem", fontWeight: 800, padding: "3px 9px", borderRadius: 99, whiteSpace: "nowrap", flexShrink: 0, ...c.seats <= 5 ? { background: "rgba(230,72,51,.1)", color: C.coral, border: `1.5px solid rgba(230,72,51,.25)` } : { background: "rgba(144,174,173,.12)", color: C.slate, border: `1.5px solid rgba(144,174,173,.3)` } }}>
                        {c.seats <= 5 ? "\u{1F525}" : "\u{1FA91}"} {c.seats} seats left
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 800, color: C.navy, lineHeight: 1.35 }}>{c.name}</div>
                      <div style={{ fontSize: "0.76rem", color: "#6b7280", fontWeight: 500, marginTop: 2 }}>by {c.instructor}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {[{ icon: "\u{1F4C5}", text: `Starts ${c.startDate}` }, { icon: "\u{1F550}", text: c.schedule }, { icon: "\u23F1", text: c.duration }].map((row) => <div key={row.icon} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.77rem", color: "#6b7280", fontWeight: 500 }}>
                          <span style={{ fontSize: "0.82rem" }}>{row.icon}</span>{row.text}
                        </div>)}
                    </div>
                    <button
    className="cta-card-btn"
    onClick={() => showToast("Opening full course \u{1F4DA}")}
    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit", fontSize: "0.82rem", fontWeight: 800, padding: "10px 18px", borderRadius: 99, border: `2px solid ${C.coral}`, background: C.coral, color: "#fff", cursor: "pointer", width: "100%" }}
    onMouseEnter={(e) => Object.assign(e.currentTarget.style, { background: "#c93b28", borderColor: "#c93b28", transform: "translateY(-1px)", boxShadow: "0 5px 16px rgba(230,72,51,.3)" })}
    onMouseLeave={(e) => Object.assign(e.currentTarget.style, { background: C.coral, borderColor: C.coral, transform: "none", boxShadow: "none" })}
  >
                      Join Batch →
                    </button>
                  </div>)}
              </div>
            </div>}

          {
    /* ── ON-DEMAND PANEL ── */
  }
          {activeSection === "ondemand" && <div style={{ padding: 20 }}>
              <Micro style={{ marginBottom: 14 }}>Self-Paced On-Demand Courses</Micro>
              <div className="od-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                


                {filteredOnDemand.map((od, oi) => <div key={oi} className="od-card" style={{ border: `1.5px solid ${C.border}`, borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "3px 9px", borderRadius: 99, background: "rgba(255,193,7,.12)", color: "#b8860b", border: `1.5px solid rgba(255,193,7,.3)`, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                        ⭐ {od.rating} ({od.reviews})
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 800, color: C.navy, lineHeight: 1.35 }}>{od.name}</div>
                      <div style={{ fontSize: "0.76rem", color: "#6b7280", fontWeight: 500, marginTop: 2 }}>by {od.instructor}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 700, color: C.slate }}>
                        <span>{od.progress > 0 ? "Progress" : "Not started"}</span>
                        <span>{od.progress}%</span>
                      </div>
                      <div style={{ width: "100%", height: 7, background: C.cream, borderRadius: 99, overflow: "hidden" }}>
                        <div
    ref={(el) => {
      progressRefs.current[oi] = el;
    }}
    style={{ height: "100%", background: `linear-gradient(90deg, ${C.slate}, ${C.navy})`, borderRadius: 99, width: "0%", transition: "width 1.2s cubic-bezier(.4,0,.2,1)" }}
  />
                      </div>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
                      👥 {od.enrolled} enrolled
                    </div>
                    <button
    className="cta-card-btn"
    onClick={() => showToast("Opening full course \u{1F4DA}")}
    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit", fontSize: "0.82rem", fontWeight: 800, padding: "10px 18px", borderRadius: 99, border: `2px solid ${C.slate}`, background: C.slate, color: "#fff", cursor: "pointer", width: "100%" }}
    onMouseEnter={(e) => Object.assign(e.currentTarget.style, { background: "#6a9a98", borderColor: "#6a9a98", transform: "translateY(-1px)", boxShadow: "0 5px 14px rgba(144,174,173,.3)" })}
    onMouseLeave={(e) => Object.assign(e.currentTarget.style, { background: C.slate, borderColor: C.slate, transform: "none", boxShadow: "none" })}
  >
                      Start Now →
                    </button>
                  </div>)}
              </div>
            </div>}

          {
    /* ── WORKSHOPS PANEL ── */
  }
          {activeSection === "workshops" && <div style={{ padding: 20 }}>
              <Micro style={{ marginBottom: 14 }}>Live Workshops & Sessions</Micro>
              <div className="ws-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                


                {filteredWorkshops.map((ws, wi) => <div key={wi} className="ws-card" style={{ border: `1.5px solid ${C.border}`, borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 800, padding: "3px 10px", borderRadius: 99, alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 5, ...pillStyle(ws.type) }}>
                      {pillIcon(ws.type)} {ws.type}
                    </span>
                    <div style={{ fontSize: "0.87rem", fontWeight: 800, color: C.navy, lineHeight: 1.35 }}>{ws.name}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <div style={{ fontSize: "0.74rem", color: "#6b7280", fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>📅 {ws.date}</div>
                      <div style={{ fontSize: "0.74rem", color: "#6b7280", fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>⏱ {ws.duration}</div>
                    </div>
                    <button
    className="cta-card-btn"
    onClick={() => showToast("Opening full course \u{1F4DA}")}
    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit", fontSize: "0.8rem", fontWeight: 800, padding: "9px 16px", borderRadius: 99, border: `2px solid ${C.brown}`, background: "transparent", color: C.brown, cursor: "pointer", width: "100%" }}
    onMouseEnter={(e) => Object.assign(e.currentTarget.style, { background: C.brown, color: "#fff", transform: "translateY(-1px)", boxShadow: "0 5px 14px rgba(135,79,65,.25)" })}
    onMouseLeave={(e) => Object.assign(e.currentTarget.style, { background: "transparent", color: C.brown, transform: "none", boxShadow: "none" })}
  >
                      Register →
                    </button>
                  </div>)}
              </div>
            </div>}
        </Card>

        {
    /* ── 4. CTA — Preview Course ── */
  }
        <Card style={{ padding: "22px 24px", textAlign: "center" }} delay={4}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <Btn id="dashboardBtn" onClick={() => {
              markProfileFlowCompleted();
              navigate("/student-dashboard");
            }}>
              Continue to Dashboard →
            </Btn>
            <Btn id="exploreBtn" onClick={() => {
              setHasSearched(false);
              setSearchInput("");
              setSearchQuery("");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}>
              Explore More Courses 🔍
            </Btn>
          </div>
        </Card>

        {
    /* ── 5. Back Row ── */
  }
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, padding: "8px 0", animation: "fadeUp .55s cubic-bezier(.4,0,.2,1) .3s both" }}>
          <button
            onClick={() => navigate("/profile-review#intent")}
            style={{ fontFamily: "inherit", fontSize: "0.84rem", fontWeight: 700, color: C.brown, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3, display: "flex", alignItems: "center", gap: 5 }}
            onMouseEnter={(e) => e.currentTarget.style.color = C.navy}
            onMouseLeave={(e) => e.currentTarget.style.color = C.brown}
          >
            ← Back to Intent
          </button>
          <span style={{ fontSize: "0.78rem", color: C.slate, fontWeight: 600 }}>
            Finish setup and continue when you're ready
          </span>
        </div>

      </div>
    </div>;
}
function Card({ children, style, delay }) {
  return <div
    style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 14px rgba(36,72,85,.07)", transition: "box-shadow .32s", animation: `fadeUp .55s cubic-bezier(.4,0,.2,1) ${(delay ?? 0) * 0.06}s both`, ...style }}
    onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 6px 28px rgba(36,72,85,.11)"}
    onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 2px 14px rgba(36,72,85,.07)"}
  >
      {children}
    </div>;
}
function Micro({ children, style }) {
  return <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: ".10em", textTransform: "uppercase", color: "#90AEAD", ...style }}>
      {children}
    </div>;
}
function Btn({ children, onClick, id }) {
  return <button
    id={id}
    onClick={onClick}
    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit", fontSize: "0.95rem", fontWeight: 700, borderRadius: 99, padding: "14px 36px", cursor: "pointer", transition: "all .25s", whiteSpace: "nowrap", border: "2px solid #E64833", background: "#E64833", color: "#fff", boxShadow: "0 4px 18px rgba(230,72,51,.28)" }}
    onMouseEnter={(e) => Object.assign(e.currentTarget.style, { background: "#c93b28", borderColor: "#c93b28", transform: "translateY(-2px)", boxShadow: "0 8px 24px rgba(230,72,51,.4)" })}
    onMouseLeave={(e) => Object.assign(e.currentTarget.style, { background: "#E64833", borderColor: "#E64833", transform: "none", boxShadow: "0 4px 18px rgba(230,72,51,.28)" })}
  >{children}</button>;
}

export default GoalMatch;
