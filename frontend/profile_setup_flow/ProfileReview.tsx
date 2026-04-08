// @ts-nocheck
import { getProfileDraft, saveProfile } from '../utils/profileStore';
import { useState, useRef, useEffect  } from "react";
import { useLocation  } from "wouter";
import { motion, AnimatePresence  } from "framer-motion";

// --- Injected CSS from bundled files ---
if (typeof document !== 'undefined' && !document.getElementById('career-app-intent-styles')) {
  const style = document.createElement('style');
  style.id = 'career-app-intent-styles';
  style.textContent = `
/* Keyframes injected directly for the popup component */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
* { box-sizing: border-box; }
  `;
  document.head.appendChild(style);
}

// ============== COLORS & TOKENS ==============
var C7 = {
  navy: "#244855",
  coral: "#E64833",
  brown: "#874F41",
  slate: "#90AEAD",
  cream: "#FBE9D0",
  white: "#FFFFFF",
  border: "#e8e0d0",
  gray: "#6b7280"
};

// ============== POPUP / INTENT UI ===============
var INTENTS = [
  { id: "explorer", icon: "\u{1F50D}", title: "Explore Courses", desc: "Show me recommended learning paths based on my profile" },
  { id: "specific", icon: "\u{1F393}", title: "Apply for a Specific Course", desc: "I know what I want to learn" }
];

var overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};
var popupVariants = {
  hidden: { scale: 0.88, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 220, damping: 18 } },
  exit: { scale: 0.92, opacity: 0, transition: { duration: 0.16, ease: [0.4, 0, 1, 1] } }
};
var listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } }
};
var cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] } }
};

function IntentCard({ intent, selected, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      variants={cardVariants}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `2px solid ${selected ? C7.navy : hovered ? C7.slate : C7.border}`,
        borderRadius: 14,
        padding: "16px 18px",
        background: selected ? "#EEF4F4" : hovered ? C7.cream : C7.white,
        cursor: "pointer",
        transition: "border-color .18s, background .18s",
        display: "flex",
        alignItems: "center",
        gap: 14,
        userSelect: "none"
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: selected ? "rgba(36,72,85,.08)" : hovered ? "rgba(230,72,51,.08)" : C7.cream,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, transition: "background .18s"
      }}>
        {intent.icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C7.navy, marginBottom: 3 }}>{intent.title}</div>
        <div style={{ fontSize: 12, color: C7.gray, lineHeight: 1.5 }}>{intent.desc}</div>
      </div>
      <div style={{
        width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
        border: `2px solid ${selected ? C7.navy : C7.border}`,
        background: selected ? C7.navy : "transparent", transition: "all .18s",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        {selected && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
      </div>
    </motion.div>
  );
}

function ToastMsg({ message, visible }) {
  return (
    <motion.div
      initial={false}
      animate={{ y: visible ? 0 : 70, opacity: visible ? 1 : 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      style={{
        position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
        background: C7.navy, color: "#fff", fontFamily: "inherit", fontSize: "0.92rem", fontWeight: 700,
        padding: "13px 28px", borderRadius: 99, boxShadow: "0 8px 28px rgba(36,72,85,.28)",
        zIndex: 300, whiteSpace: "nowrap", pointerEvents: "none"
      }}
    >
      {message}
    </motion.div>
  );
}

function ProceedButton({ enabled, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      disabled={!enabled}
      onClick={onClick}
      onMouseEnter={() => enabled && setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "100%", padding: "14px", borderRadius: 12, border: "none",
        fontFamily: "inherit", fontSize: 15, fontWeight: 700,
        cursor: enabled ? "pointer" : "not-allowed",
        background: enabled ? hov ? "#c93b28" : C7.coral : "#d1d5db",
        color: enabled ? "#fff" : "#9ca3af",
        transition: "background .2s, transform .15s, box-shadow .2s",
        transform: enabled && hov ? "translateY(-1px)" : "none",
        boxShadow: enabled && hov ? "0 6px 20px rgba(230,72,51,.35)" : "none"
      }}
    >
      Continue →
    </button>
  );
}

function IntentStep({ onClose }) {
  const [, navigate] = useLocation();
  const [selected, setSelected] = useState(null);
  const [courseName] = useState("");
  const [toast, setToast] = useState({ msg: "", visible: false });
  const toastTimer = useRef(0);
  
  const isEnabled = selected !== null && (selected !== "specific" || courseName.trim().length >= 0);

  const showToast = (msg) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, visible: true });
    toastTimer.current = window.setTimeout(
      () => setToast((t) => ({ ...t, visible: false })),
      3200
    );
  };

  const handleSelect = (id) => {
    setSelected(id);
    if (id === "specific") {
      navigate("/goal-match");
    }
  };

  const handleProceed = () => {
    if (selected === "explorer") {
      navigate("/recommendation");
    }
    showToast("Loading your path... \u{1F680}");
  };

  return (
    <>
      <motion.div
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{
          position: "fixed", inset: 0, background: "rgba(36,72,85,0.45)",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          variants={popupVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{
            background: C7.white, borderRadius: 24, padding: "clamp(24px, 5vw, 36px) clamp(20px, 4vw, 32px)",
            maxWidth: 500, width: "92%", boxShadow: "0 16px 60px rgba(36,72,85,.20)"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C7.navy, margin: "0 0 8px", fontFamily: "'Syne', sans-serif" }}>
            What's your goal? 🎯
          </h2>
          <p style={{ fontSize: 13, color: C7.gray, lineHeight: 1.5, margin: "0 0 24px" }}>
            Tell us what you're looking for and we'll find the best match.
          </p>

          <motion.div variants={listVariants} initial="hidden" animate="visible" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {INTENTS.map((intent) => (
              <IntentCard key={intent.id} intent={intent} selected={selected === intent.id} onClick={() => handleSelect(intent.id)} />
            ))}
          </motion.div>

          <div style={{ marginTop: 24 }}>
            <ProceedButton enabled={isEnabled} onClick={handleProceed} />
          </div>

          <p style={{ fontSize: 11, color: C7.slate, textAlign: "center", marginTop: 14, marginBottom: 4 }}>
            You can change this later from your dashboard.
          </p>
          
          {onClose && (
            <button
              onClick={onClose}
              style={{
                display: "block", margin: "0 auto", background: "none", border: "none",
                fontSize: 11, color: C7.slate, cursor: "pointer", fontFamily: "inherit",
                textDecoration: "underline", textUnderlineOffset: 3, paddingBottom: 2,
                opacity: 0.7, transition: "opacity .18s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "0.7"}
            >
              ← Go back
            </button>
          )}
        </motion.div>
      </motion.div>
      <ToastMsg message={toast.msg} visible={toast.visible} />
    </>
  );
}

// ============== PROFILE REVIEW UI =============

function fmt(val) {
  return val && val.trim() ? val : "\u2014";
}
function SectionHead({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{ flex: 1, height: 1.5, background: C7.border, borderRadius: 99 }} />
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: C7.slate, whiteSpace: "nowrap" }}>
        {children}
      </span>
      <div style={{ flex: 1, height: 1.5, background: C7.border, borderRadius: 99 }} />
    </div>
  );
}
function InfoRow({ label, value }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 3, padding: "12px 14px",
      background: C7.white, borderRadius: 10, border: `1.5px solid ${C7.border}`
    }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: C7.slate, textTransform: "uppercase", letterSpacing: ".07em" }}>
        {label}
      </span>
      <span style={{ fontSize: 14, fontWeight: 600, color: C7.navy }}>
        {value}
      </span>
    </div>
  );
}

function ProfileReview() {
  const [, navigate] = useLocation();
  const [hash, setHash] = useState(window.location.hash);
  
  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    // Wouter triggers popstate, check hash there too
    const handlePopState = () => setHash(window.location.hash);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const showIntent = hash === "#intent";
  
  const draft = getProfileDraft();
  
  useEffect(() => {
    if (!draft) {
      navigate("/profile-setup");
    }
  }, [draft, navigate]);

  if (!draft) return null;
  
  const handleConfirm = () => {
    const firstName = draft.name.trim().split(" ")[0] || "there";
    saveProfile({
      firstName,
      fullName: draft.name.trim(),
      targetRole: draft.targetRole,
      skills: draft.skills,
      courseIntent: ""
    });
    // Add #intent to the current location, tracking it in History seamlessly
    window.location.hash = "intent";
  };
  
  return (
    <div style={{
      minHeight: "100vh", background: C7.cream, display: "flex", flexDirection: "column",
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      <div style={{
        background: C7.navy, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ width: 24, height: 24, borderRadius: "50%", background: C7.slate, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: C7.white }}>✓</div>
          ))}
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: C7.coral, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: C7.white, marginLeft: 2 }}>✦</div>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,.55)", marginLeft: 4, fontWeight: 500 }}>Review</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,.65)", letterSpacing: ".04em" }}>
          Profile Review — Final Step
        </span>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px 80px" }}>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          style={{ background: C7.white, borderRadius: 24, padding: "36px 36px 32px", maxWidth: 680, width: "100%", boxShadow: "0 8px 40px rgba(36,72,85,.12)" }}
        >
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(144,174,173,.12)", border: `1.5px solid rgba(144,174,173,.30)`, color: C7.slate, fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", padding: "5px 14px", borderRadius: 99, marginBottom: 14 }}>
              ✦ Final Review
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: C7.navy, margin: "0 0 8px", fontFamily: "'Syne', sans-serif", lineHeight: 1.2 }}>
              Looks good? Let's confirm 👀
            </h1>
            <p style={{ fontSize: 14, color: C7.gray, margin: 0, lineHeight: 1.6 }}>
              Review your details before we find your best match. You can go back and re-edit anything.
            </p>
          </div>

          <div style={{ marginBottom: 28 }}>
            <SectionHead>Personal Information</SectionHead>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <InfoRow label="Full Name" value={fmt(draft.name)} />
              <InfoRow label="Date of Birth" value={fmt(draft.dob)} />
              <InfoRow label="Location" value={fmt(draft.location)} />
              <InfoRow label="Phone" value={fmt(draft.phone)} />
              <InfoRow label="Qualification" value={fmt(draft.qualification)} />
              <InfoRow label="Field of Study" value={fmt(draft.fieldOfStudy)} />
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <SectionHead>Your Skills</SectionHead>
            {draft.skills.length === 0 ? (
              <p style={{ fontSize: 13, color: C7.gray, fontStyle: "italic" }}>No skills selected.</p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {draft.skills.map((skill) => (
                  <span key={skill} style={{ display: "inline-flex", alignItems: "center", padding: "6px 14px", borderRadius: 99, background: C7.navy, color: C7.white, fontSize: 13, fontWeight: 600 }}>
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 36 }}>
            <SectionHead>Career Aspirations</SectionHead>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <InfoRow label="Target Role" value={fmt(draft.targetRole)} />
              <InfoRow label="Learning Mode" value={draft.learningMode.length ? draft.learningMode.join(", ") : "\u2014"} />
              <InfoRow label="Weekly Time" value={fmt(draft.weeklyHours)} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", borderTop: `1.5px solid ${C7.border}`, paddingTop: 24 }}>
            <button
              id="reEditBtn"
              onClick={() => navigate("/profile-setup")}
              style={{ flex: "0 0 auto", padding: "13px 24px", borderRadius: 12, border: `2px solid ${C7.navy}`, background: "transparent", color: C7.navy, fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "all .2s", whiteSpace: "nowrap" }}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, { background: C7.navy, color: C7.white })}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, { background: "transparent", color: C7.navy })}
            >
              ← Re-edit Profile
            </button>
            <button
              id="confirmBtn"
              onClick={handleConfirm}
              style={{ flex: 1, minWidth: 180, padding: "13px 28px", borderRadius: 12, border: "none", background: C7.coral, color: C7.white, fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "all .2s", whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(230,72,51,.25)" }}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, { background: "#c93b28", transform: "translateY(-1px)", boxShadow: "0 8px 24px rgba(230,72,51,.38)" })}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, { background: C7.coral, transform: "none", boxShadow: "0 4px 16px rgba(230,72,51,.25)" })}
            >
              Confirm & Submit →
            </button>
          </div>
        </motion.div>
      </div>
      
      <AnimatePresence>
        {showIntent && (
          <IntentStep onClose={() => {
            window.history.back();
          }} />
        )}
      </AnimatePresence>

    </div>
  );
}

export default ProfileReview;
