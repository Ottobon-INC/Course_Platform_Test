// @ts-nocheck
import { saveProfileDraft } from '../utils/profileStore';
import { useState  } from "react";
import { useLocation  } from "wouter";
import { AnimatePresence , motion  } from "framer-motion";

var C5 = {
  navy: "#244855",
  coral: "#E64833",
  brown: "#874F41",
  slate: "#90AEAD",
  cream: "#FBE9D0",
  white: "#FFFFFF",
  border: "#e8e0d0",
  gray: "#6b7280"
};
var SKILLS_GROUPS = [
  {
    label: "PROGRAMMING & DEVELOPMENT",
    skills: ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Vue.js", "Angular", "Node.js", "Python", "Java", "SQL", "Git", "REST APIs", "GraphQL"]
  },
  {
    label: "TOOLS & PLATFORMS",
    skills: ["VS Code", "Git/GitHub", "Figma", "Docker", "AWS", "Linux", "Jira", "Postman"]
  },
  {
    label: "SOFT SKILLS",
    skills: ["Problem Solving", "Communication", "Teamwork", "Critical Thinking", "Time Management", "Leadership"]
  }
];
var JOB_ROLES = ["Full Stack Developer", "Frontend Developer", "Backend Developer", "Data Scientist", "DevOps Engineer", "Product Manager", "UI/UX Designer", "Cloud Engineer"];
var QUALIFICATIONS = ["B.Tech", "M.Tech", "BCA", "BSc", "MBA", "Other"];
var LEARNING_MODES = ["Self-paced", "Live Classes", "Weekends only", "Intensive bootcamp"];
var WEEKLY_HOURS = ["2\u20135 hrs/week", "5\u201310 hrs/week", "10\u201315 hrs/week", "15+ hrs/week"];
var stepVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } }
};
function NavBar({ step }) {
  const labels = ["Personal Basics", "Your Skills", "Your Aspirations"];
  return <div style={{ background: C5.navy, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {[1, 2, 3].map((i) => <div key={i} style={{
    width: i < step ? 24 : i === step ? 24 : 24,
    height: 24,
    borderRadius: "50%",
    background: i < step ? C5.slate : i === step ? C5.coral : "rgba(255,255,255,.18)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 800,
    color: "#fff",
    transition: "background .3s",
    flexShrink: 0
  }}>
            {i < step ? "\u2713" : i}
          </div>)}
        <span style={{ fontSize: 12, color: "rgba(255,255,255,.55)", marginLeft: 4, fontWeight: 500 }}>
          {labels[step - 1]}
        </span>
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,.65)", letterSpacing: ".04em" }}>
        Profile Setup — Step {step} of 3
      </span>
    </div>;
}
function StepBars({ step }) {
  const color = (i) => i < step ? C5.navy : i === step ? C5.coral : "#e8e0d0";
  return <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
      {[1, 2, 3].map((i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: color(i), transition: "background .3s" }} />)}
    </div>;
}
function SectionLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: C5.slate, marginBottom: 10, marginTop: 4 }}>
      {children}
    </div>;
}
function StepTitle({ title, subtitle }) {
  return <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: C5.navy, margin: "0 0 6px", fontFamily: "'Syne', sans-serif", lineHeight: 1.2 }}>
        {title}
      </h2>
      <p style={{ fontSize: 14, color: C5.gray, margin: 0, lineHeight: 1.6 }}>{subtitle}</p>
    </div>;
}
function FormField({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange
}) {
  const [focused, setFocused] = useState(false);
  return <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 13, fontWeight: 600, color: C5.navy }}>{label}</label>
      <input
    id={id}
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onFocus={() => setFocused(true)}
    onBlur={() => setFocused(false)}
    style={{
      padding: "12px 16px",
      border: `1.5px solid ${focused ? C5.navy : C5.border}`,
      borderRadius: 10,
      fontFamily: "inherit",
      fontSize: 14,
      color: C5.navy,
      outline: "none",
      transition: "border-color .2s",
      background: "#fff",
      width: "100%",
      boxSizing: "border-box"
    }}
  />
    </div>;
}
function SelectField({
  id,
  label,
  options,
  value,
  onChange
}) {
  const [focused, setFocused] = useState(false);
  return <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 13, fontWeight: 600, color: C5.navy }}>{label}</label>
      <select
    id={id}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onFocus={() => setFocused(true)}
    onBlur={() => setFocused(false)}
    style={{
      padding: "12px 16px",
      border: `1.5px solid ${focused ? C5.navy : C5.border}`,
      borderRadius: 10,
      fontFamily: "inherit",
      fontSize: 14,
      color: C5.navy,
      outline: "none",
      transition: "border-color .2s",
      background: "#fff",
      cursor: "pointer",
      appearance: "auto",
      width: "100%",
      boxSizing: "border-box"
    }}
  >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>;
}
function SkillTag({
  label,
  selected,
  onClick
}) {
  const [hovered, setHovered] = useState(false);
  return <button
    type="button"
    onClick={onClick}
    onMouseEnter={() => setHovered(true)}
    onMouseLeave={() => setHovered(false)}
    style={{
      padding: "7px 14px",
      borderRadius: 20,
      fontSize: 13,
      fontWeight: 600,
      fontFamily: "inherit",
      cursor: "pointer",
      transition: "all .18s",
      border: `1.5px solid ${selected ? C5.navy : hovered ? C5.slate : C5.border}`,
      background: selected ? C5.navy : C5.white,
      color: selected ? "#fff" : hovered ? C5.navy : C5.gray
    }}
  >
      {label}
    </button>;
}
function PrimaryBtn2({ children, onClick }) {
  const [hov, setHov] = useState(false);
  return <button
    type="button"
    onClick={onClick}
    onMouseEnter={() => setHov(true)}
    onMouseLeave={() => setHov(false)}
    style={{
      padding: "13px 28px",
      borderRadius: 12,
      border: "none",
      background: hov ? "#c93b28" : C5.coral,
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 15,
      fontWeight: 700,
      cursor: "pointer",
      transition: "all .2s",
      transform: hov ? "translateY(-1px)" : "none",
      boxShadow: hov ? "0 6px 20px rgba(230,72,51,.35)" : "none",
      whiteSpace: "nowrap"
    }}
  >{children}</button>;
}
function OutlineBtn({ children, onClick }) {
  const [hov, setHov] = useState(false);
  return <button
    type="button"
    onClick={onClick}
    onMouseEnter={() => setHov(true)}
    onMouseLeave={() => setHov(false)}
    style={{
      padding: "13px 28px",
      borderRadius: 12,
      border: `2px solid ${C5.navy}`,
      background: hov ? C5.navy : "#fff",
      color: hov ? "#fff" : C5.navy,
      fontFamily: "inherit",
      fontSize: 15,
      fontWeight: 700,
      cursor: "pointer",
      transition: "all .2s",
      whiteSpace: "nowrap"
    }}
  >{children}</button>;
}
function Step1Form({ data, onChange, onNext }) {
  return <>
      <StepTitle title="Personal Basics" subtitle="Tell us a little about yourself to get started." />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <FormField id="s1-name" label="Full Name" placeholder="Sampath Kumar" value={data.name} onChange={(v) => onChange("name", v)} />
        <FormField id="s1-dob" label="Date of Birth" type="date" value={data.dob} onChange={(v) => onChange("dob", v)} />
        <FormField id="s1-location" label="Location" placeholder="City, Country" value={data.location} onChange={(v) => onChange("location", v)} />
        <FormField id="s1-phone" label="Phone" placeholder="+91 XXXXX XXXXX" value={data.phone} onChange={(v) => onChange("phone", v)} />
      </div>

      <SectionLabel>Education</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
        <SelectField id="s1-qual" label="Highest Qualification" options={QUALIFICATIONS} value={data.qualification} onChange={(v) => onChange("qualification", v)} />
        <FormField id="s1-field" label="Field of Study" placeholder="Computer Science" value={data.fieldOfStudy} onChange={(v) => onChange("fieldOfStudy", v)} />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <PrimaryBtn2 onClick={onNext}>Next: Skills →</PrimaryBtn2>
      </div>
    </>;
}
function Step2Form({ selected, onToggle, onNext, onBack }) {
  return <>
      <StepTitle title="Your Skills" subtitle="Select all the skills you currently have. Be honest!" />

      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 32 }}>
        {SKILLS_GROUPS.map((group) => <div key={group.label}>
            <SectionLabel>{group.label}</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {group.skills.map((skill) => <SkillTag
    key={skill}
    label={skill}
    selected={selected.has(skill)}
    onClick={() => onToggle(skill)}
  />)}
            </div>
          </div>)}
      </div>

      {
    /* Selection count */
  }
      <div style={{ fontSize: 13, color: C5.slate, marginBottom: 16, fontWeight: 600 }}>
        {selected.size} skill{selected.size !== 1 ? "s" : ""} selected
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <OutlineBtn onClick={onBack}>← Back</OutlineBtn>
        <PrimaryBtn2 onClick={onNext}>Next: Aspirations →</PrimaryBtn2>
      </div>
    </>;
}
function Step3Form({ data, onChange, onComplete, onBack }) {
  const toggleLearning = (mode) => {
    const next = new Set(data.learningMode);
    if (next.has(mode)) {
      if (next.size > 1) next.delete(mode);
    } else next.add(mode);
    onChange("learningMode", next);
  };
  const setWeekly = (val) => onChange("weeklyHours", val);
  return <>
      <StepTitle title="Your Aspirations" subtitle="Help us understand where you want to go." />

      <div style={{ marginBottom: 24 }}>
        <SelectField id="s3-role" label="Target Job Role" options={JOB_ROLES} value={data.targetRole} onChange={(v) => onChange("targetRole", v)} />
      </div>

      <div style={{ marginBottom: 24 }}>
        <SectionLabel>Preferred Learning Mode</SectionLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {LEARNING_MODES.map((mode) => <SkillTag key={mode} label={mode} selected={data.learningMode.has(mode)} onClick={() => toggleLearning(mode)} />)}
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        <SectionLabel>Weekly Time Available</SectionLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {WEEKLY_HOURS.map((h) => <SkillTag key={h} label={h} selected={data.weeklyHours === h} onClick={() => setWeekly(h)} />)}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <OutlineBtn onClick={onBack}>← Back</OutlineBtn>
        <PrimaryBtn2 onClick={onComplete}>Complete Profile ✓</PrimaryBtn2>
      </div>
    </>;
}
function ProfileSetup() {
  const [step, setStep] = useState(1);
  const [s1, setS1] = useState({
    name: "Sampath",
    dob: "",
    location: "",
    phone: "",
    qualification: "B.Tech",
    fieldOfStudy: ""
  });
  const [selectedSkills, setSelectedSkills] = useState(
    /* @__PURE__ */ new Set(["HTML", "CSS", "JavaScript", "React"])
  );
  const [s3, setS3] = useState({
    targetRole: "Full Stack Developer",
    learningMode: /* @__PURE__ */ new Set(["Self-paced"]),
    weeklyHours: "5\u201310 hrs/week"
  });
  const changeS1 = (key, val) => setS1((prev) => ({ ...prev, [key]: val }));
  const toggleSkill = (skill) => setSelectedSkills((prev) => {
    const next = new Set(prev);
    next.has(skill) ? next.delete(skill) : next.add(skill);
    return next;
  });
  const changeS3 = (key, val) => setS3((prev) => ({ ...prev, [key]: val }));
  const [, navigate] = useLocation();
  const handleComplete = () => {
    const firstName = s1.name.trim().split(" ")[0] || "there";
    saveProfileDraft({
      name: s1.name.trim(),
      dob: s1.dob,
      location: s1.location,
      phone: s1.phone,
      qualification: s1.qualification,
      fieldOfStudy: s1.fieldOfStudy,
      skills: [...selectedSkills],
      targetRole: s3.targetRole || "Full Stack Developer",
      learningMode: [...s3.learningMode],
      weeklyHours: s3.weeklyHours
    });
    localStorage.setItem("careerProfile", JSON.stringify({
      firstName,
      fullName: s1.name.trim(),
      targetRole: s3.targetRole || "Full Stack Developer",
      skills: [...selectedSkills],
      courseIntent: ""
    }));
    navigate("/profile-review");
  };
  return <div style={{
    minHeight: "100vh",
    background: C5.cream,
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Plus Jakarta Sans', sans-serif"
  }}>
      {
    /* Top nav bar */
  }
      <NavBar step={step} />

      {
    /* Centered card */
  }
      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px 64px" }}>
        <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
    style={{
      background: "#fff",
      borderRadius: 24,
      padding: 40,
      maxWidth: 640,
      width: "100%",
      boxShadow: "0 8px 40px rgba(36,72,85,.12)"
    }}
  >
          {
    /* Step bars */
  }
          <StepBars step={step} />

          {
    /* Animated step content */
  }
          <AnimatePresence mode="wait">
            {step === 1 && <motion.div key="step1" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                <Step1Form data={s1} onChange={changeS1} onNext={() => setStep(2)} />
              </motion.div>}
            {step === 2 && <motion.div key="step2" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                <Step2Form selected={selectedSkills} onToggle={toggleSkill} onNext={() => setStep(3)} onBack={() => setStep(1)} />
              </motion.div>}
            {step === 3 && <motion.div key="step3" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                <Step3Form data={s3} onChange={changeS3} onComplete={handleComplete} onBack={() => setStep(2)} />
              </motion.div>}
          </AnimatePresence>
        </motion.div>
      </div>

    </div>;
}

export default ProfileSetup;
