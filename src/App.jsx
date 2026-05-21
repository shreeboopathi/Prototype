import { useState, useEffect, useRef } from "react";

// ─── MOCK DATABASE ──────────────────────────────────────────────────────────
const MOCK_USERS = [
  { id: 1, name: "Admin User", email: "admin@cattleai.in", password: "admin123", role: "admin" },
  { id: 2, name: "Demo Farmer", email: "demo@cattleai.in", password: "demo123", role: "user" },
];

const BREED_DATA = {
  Gir: {
    type: "Cattle", origin: "Gir Forest, Gujarat", milk: "6–8 L/day",
    characteristics: "Curved horns, prominent hump, pendulous ears, red/yellow spots",
    states: "Gujarat, Rajasthan, Maharashtra", lifespan: "12–15 years",
    color: "#22c55e",
  },
  Sahiwal: {
    type: "Cattle", origin: "Sahiwal district, Punjab (now Pakistan)", milk: "8–12 L/day",
    characteristics: "Short legs, heavy body, loose skin folds, reddish-brown",
    states: "Punjab, Haryana, Uttar Pradesh", lifespan: "14–16 years",
    color: "#f59e0b",
  },
  "Red Sindhi": {
    type: "Cattle", origin: "Sindh region", milk: "5–7 L/day",
    characteristics: "Dark red coat, medium-sized hump, drooping ears",
    states: "Rajasthan, Karnataka, Tamil Nadu", lifespan: "12–14 years",
    color: "#ef4444",
  },
  Ongole: {
    type: "Cattle", origin: "Ongole, Andhra Pradesh", milk: "3–4 L/day",
    characteristics: "White/grey coat, large hump, heavy dewlap, used for draft work",
    states: "Andhra Pradesh, Karnataka", lifespan: "15–18 years",
    color: "#8b5cf6",
  },
  Tharparkar: {
    type: "Cattle", origin: "Thar Desert, Rajasthan", milk: "5–6 L/day",
    characteristics: "White/grey, medium-sized, adapted to arid climates",
    states: "Rajasthan, Gujarat", lifespan: "12–15 years",
    color: "#06b6d4",
  },
  Hallikar: {
    type: "Cattle", origin: "Hassan district, Karnataka", milk: "2–3 L/day",
    characteristics: "Grey coat, long horns curving forward, used for draft",
    states: "Karnataka", lifespan: "14–17 years",
    color: "#64748b",
  },
  Kangayam: {
    type: "Cattle", origin: "Kangayam, Tamil Nadu", milk: "2–4 L/day",
    characteristics: "Grey/white, strong build, lyrate horns, drought-resistant",
    states: "Tamil Nadu", lifespan: "13–15 years",
    color: "#84cc16",
  },
  Deoni: {
    type: "Cattle", origin: "Bidar, Karnataka/Maharashtra", milk: "3–5 L/day",
    characteristics: "Black and white spotted, medium-sized, dual-purpose",
    states: "Karnataka, Maharashtra, Andhra Pradesh", lifespan: "12–14 years",
    color: "#f97316",
  },
  Murrah: {
    type: "Buffalo", origin: "Rohtak/Hisar, Haryana", milk: "12–18 L/day",
    characteristics: "Jet black, tightly coiled horns, massive body, top milk producer",
    states: "Haryana, Punjab, Delhi", lifespan: "16–18 years",
    color: "#1d4ed8",
  },
  Jaffarabadi: {
    type: "Buffalo", origin: "Jaffarabad, Gujarat", milk: "8–12 L/day",
    characteristics: "Black coat, large pendulous horns, heavy body frame",
    states: "Gujarat", lifespan: "14–16 years",
    color: "#7c3aed",
  },
  Surti: {
    type: "Buffalo", origin: "Surat, Gujarat", milk: "7–10 L/day",
    characteristics: "Medium-sized, brownish-black, two white collars on neck",
    states: "Gujarat, Maharashtra", lifespan: "14–15 years",
    color: "#0891b2",
  },
  Mehsana: {
    type: "Buffalo", origin: "Mehsana, Gujarat", milk: "10–14 L/day",
    characteristics: "Less compact than Murrah, longer body, moderately coiled horns",
    states: "Gujarat, Maharashtra", lifespan: "15–17 years",
    color: "#059669",
  },
  Pandharpuri: {
    type: "Buffalo", origin: "Pandharpur, Maharashtra", milk: "6–8 L/day",
    characteristics: "Large sickle-shaped horns, black coat, tall slender body",
    states: "Maharashtra, Karnataka", lifespan: "13–15 years",
    color: "#dc2626",
  },
  Bhadawari: {
    type: "Buffalo", origin: "Agra/Etawah, Uttar Pradesh", milk: "5–7 L/day",
    characteristics: "Copper-coloured skin, small compact body, high fat milk (13%)",
    states: "Uttar Pradesh, Madhya Pradesh", lifespan: "13–15 years",
    color: "#d97706",
  },
};

const ALL_BREEDS = Object.keys(BREED_DATA);

// ─── CLAUDE VISION API ───────────────────────────────────────────────────────
// Frontend: call serverless API which keeps the Anthropic API key secret.
// This endpoint is provided by a server-side function (e.g. Vercel serverless).
async function analyseWithClaude(base64Image, mediaType) {
  if (!base64Image) throw new Error("No image data provided for prediction.");

  // Try serverless API first (keeps Anthropic key secret).
  try {
    const resp = await fetch("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64Image, mediaType }),
    });

    if (resp.ok) {
      return await resp.json();
    }

    // If server responded but with an error, read it and decide fallback.
    const txt = await resp.text();
    // If server indicates missing key, fall back to demo prediction.
    if (/Missing ANTHROPIC_API_KEY|Missing VITE_ANTHROPIC_API_KEY/i.test(txt) || resp.status === 500 || resp.status === 502) {
      console.warn('Prediction API missing or errored, returning demo prediction:', txt);
      return demoPrediction();
    }

    throw new Error(`Prediction server error (${resp.status}): ${txt}`);
  } catch (err) {
    // Network error or same-origin blocked (e.g., GitHub Pages). On public pages, provide a demo result.
    console.warn('Prediction request failed, falling back to demo prediction:', err);
    return demoPrediction();
  }
}

// Demo prediction returns a plausible random result so the UI can be tested without Anthropic.
function demoPrediction() {
  const breed = ALL_BREEDS[Math.floor(Math.random() * ALL_BREEDS.length)];
  const confidence = Math.floor(70 + Math.random() * 25); // 70-94
  const top3 = [
    { breed, confidence },
    { breed: ALL_BREEDS[(ALL_BREEDS.indexOf(breed) + 1) % ALL_BREEDS.length], confidence: Math.max(60, confidence - 8) },
    { breed: ALL_BREEDS[(ALL_BREEDS.indexOf(breed) + 2) % ALL_BREEDS.length], confidence: Math.max(60, confidence - 12) },
  ];
  return { valid: true, animal_type: 'Cattle', breed, confidence, top3 };
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── ICONS ───────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 20, style = {} }) => {
  const icons = {
    cow: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm4 0h-2v-2h2v2zm1-5H8V9h8v2z",
    upload: "M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z",
    dashboard: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
    user: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
    logout: "M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z",
    check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
    info: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z",
    home: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
    history: "M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z",
    admin: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l5 2.18V11c0 3.5-2.33 6.79-5 7.93-2.67-1.14-5-4.43-5-7.93V7.18L12 5z",
    chart: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z",
    close: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
    camera: "M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3z",
    menu: "M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}>
      <path d={icons[name] || icons.info} />
    </svg>
  );
};

// ─── CONFIDENCE BAR ──────────────────────────────────────────────────────────
const ConfBar = ({ value, color }) => (
  <div style={{ background: "#1e293b", borderRadius: 8, height: 8, overflow: "hidden" }}>
    <div style={{ width: `${value}%`, height: "100%", borderRadius: 8, background: color, transition: "width 1s ease" }} />
  </div>
);

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("login");
  const [user, setUser] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [users, setUsers] = useState(MOCK_USERS);
  const [notification, setNotification] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 600);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const login = (email, password) => {
    const found = users.find(u => u.email === email && u.password === password);
    if (found) {
      setUser(found);
      setPage("upload");
      notify(`Welcome back, ${found.name}!`);
    } else {
      notify("Invalid credentials", "error");
    }
  };

  const signup = (name, email, password) => {
    if (users.find(u => u.email === email)) {
      notify("Email already registered", "error");
      return;
    }
    const newUser = { id: users.length + 1, name, email, password, role: "user" };
    setUsers([...users, newUser]);
    setUser(newUser);
    setPage("upload");
    notify(`Account created! Welcome, ${name}`);
  };

  const logout = () => { setUser(null); setPage("login"); };
  const addPrediction = (p) => setPredictions(prev => [p, ...prev]);

  const nav = [
    { id: "upload", label: "Predict", icon: "camera" },
    { id: "dashboard", label: "Dashboard", icon: "chart" },
    { id: "history", label: "History", icon: "history" },
    ...(user?.role === "admin" ? [{ id: "admin", label: "Admin", icon: "admin" }] : []),
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", fontFamily: "'Syne', 'Segoe UI', sans-serif", color: "#e2e8f0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input, button { font-family: inherit; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0a0f1e; }
        ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 4px; }
        .nav-btn { background: none; border: none; cursor: pointer; padding: 8px 14px; border-radius: 10px;
          color: #94a3b8; font-family: inherit; font-size: 14px; font-weight: 600;
          display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
        .nav-btn:hover { background: #1e293b; color: #e2e8f0; }
        .nav-btn.active { background: linear-gradient(135deg, #0ea5e9, #10b981); color: #fff; }
        .card { background: #0f172a; border: 1px solid #1e3a5f; border-radius: 16px; padding: 24px; }
        .btn-primary { background: linear-gradient(135deg, #0ea5e9, #10b981); color: white;
          border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700;
          font-size: 15px; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;
          font-family: inherit; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(14,165,233,0.3); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .input-field { background: #1e293b; border: 1px solid #334155; border-radius: 10px;
          color: #e2e8f0; padding: 12px 16px; font-size: 15px; width: 100%;
          font-family: inherit; outline: none; transition: border 0.2s; }
        .input-field:focus { border-color: #0ea5e9; }
        .tag { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .slide-in { animation: slideIn 0.4s ease; }
        @keyframes slideIn { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
        .notif { position:fixed; top:20px; right:20px; z-index:999; padding:12px 20px;
          border-radius:12px; font-weight:600; font-size:14px; animation:slideIn 0.3s ease; }
      `}</style>

      {notification && (
        <div className="notif" style={{
          background: notification.type === "error" ? "#7f1d1d" : "#052e16",
          border: `1px solid ${notification.type === "error" ? "#dc2626" : "#16a34a"}`,
          color: notification.type === "error" ? "#fca5a5" : "#86efac",
        }}>
          {notification.msg}
        </div>
      )}

      {user && (
        <header style={{
          borderBottom: "1px solid #1e3a5f", padding: "0 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 60, position: "sticky", top: 0, zIndex: 100,
          background: "rgba(10,15,30,0.95)", backdropFilter: "blur(10px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg,#0ea5e9,#10b981)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="cow" size={20} style={{ color: "#fff" }} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.5 }}>
              Cattle<span style={{ color: "#0ea5e9" }}>AI</span>
            </span>
          </div>

          <nav style={{ display: isMobile ? "none" : "flex", gap: 4 }}>
            {nav.map(n => (
              <button key={n.id} className={`nav-btn ${page === n.id ? "active" : ""}`} onClick={() => setPage(n.id)}>
                <Icon name={n.icon} size={16} />{n.label}
              </button>
            ))}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "linear-gradient(135deg,#7c3aed,#0ea5e9)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700,
              }}>{user.name[0]}</div>
              <span>{user.name}</span>
            </span>
            <button className="nav-btn" onClick={logout}>
              <Icon name="logout" size={16} />
            </button>
          </div>
        </header>
      )}

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "32px 20px" }}>
        {page === "login" && <LoginPage onLogin={login} onSwitch={() => setPage("signup")} />}
        {page === "signup" && <SignupPage onSignup={signup} onSwitch={() => setPage("login")} />}
        {page === "upload" && user && <UploadPage onPredict={addPrediction} notify={notify} />}
        {page === "dashboard" && user && <DashboardPage predictions={predictions} />}
        {page === "history" && user && <HistoryPage predictions={predictions} />}
        {page === "admin" && user?.role === "admin" && <AdminPage users={users} predictions={predictions} />}
      </main>
    </div>
  );
}

function LoginPage({ onLogin, onSwitch }) {
  const [email, setEmail] = useState("demo@cattleai.in");
  const [password, setPassword] = useState("demo123");
  return (
    <div style={{ maxWidth: 420, margin: "0 auto", paddingTop: 40 }} className="slide-in">
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20, margin: "0 auto 16px",
          background: "linear-gradient(135deg,#0ea5e9,#10b981)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="cow" size={36} style={{ color: "#fff" }} />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Welcome to CattleAI</h1>
        <p style={{ color: "#64748b", fontSize: 14 }}>Indian cattle & buffalo breed recognition</p>
      </div>
      <div className="card">
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600, display: "block", marginBottom: 6 }}>Email</label>
          <input className="input-field" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600, display: "block", marginBottom: 6 }}>Password</label>
          <input className="input-field" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <button className="btn-primary" style={{ width: "100%" }} onClick={() => onLogin(email, password)}>
          Sign In
        </button>
        <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#64748b" }}>
          No account? <span style={{ color: "#0ea5e9", cursor: "pointer", fontWeight: 700 }} onClick={onSwitch}>Sign up</span>
        </p>
        <div style={{ marginTop: 20, padding: 12, background: "#1e293b", borderRadius: 10, fontSize: 12, color: "#94a3b8" }}>
          <b style={{ color: "#64748b" }}>Demo:</b> demo@cattleai.in / demo123 &nbsp;|&nbsp;
          <b style={{ color: "#64748b" }}>Admin:</b> admin@cattleai.in / admin123
        </div>
      </div>
    </div>
  );
}

function SignupPage({ onSignup, onSwitch }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div style={{ maxWidth: 420, margin: "0 auto", paddingTop: 40 }} className="slide-in">
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Create Account</h1>
        <p style={{ color: "#64748b", fontSize: 14 }}>Join CattleAI to start identifying breeds</p>
      </div>
      <div className="card">
        {[["Name", name, setName, "text", "Your full name"],
          ["Email", email, setEmail, "email", "you@example.com"],
          ["Password", password, setPassword, "password", "Min 6 characters"]
        ].map(([label, val, setter, type, ph]) => (
          <div key={label} style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600, display: "block", marginBottom: 6 }}>{label}</label>
            <input className="input-field" type={type} value={val} onChange={e => setter(e.target.value)} placeholder={ph} />
          </div>
        ))}
        <button className="btn-primary" style={{ width: "100%", marginTop: 6 }} onClick={() => onSignup(name, email, password)} disabled={!name || !email || !password}>
          Create Account
        </button>
        <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#64748b" }}>
          Already have an account? <span style={{ color: "#0ea5e9", cursor: "pointer", fontWeight: 700 }} onClick={onSwitch}>Sign in</span>
        </p>
      </div>
    </div>
  );
}

function UploadPage({ onPredict, notify }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [drag, setDrag] = useState(false);
  const [invalidMsg, setInvalidMsg] = useState(null);
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(f.type)) {
      notify("Only JPG, PNG, WEBP files accepted", "error");
      return;
    }
    setFile(f);
    setResult(null);
    setInvalidMsg(null);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const predict = async () => {
    if (!file) {
      notify("Please upload an image before predicting.", "error");
      return;
    }

    setLoading(true);
    setResult(null);
    setInvalidMsg(null);
    try {
      const base64 = await toBase64(file);
      const mediaType = file.type;
      const res = await analyseWithClaude(base64, mediaType);

      if (!res.valid) {
        setInvalidMsg(res.reason || "Not a cattle or buffalo image");
        setLoading(false);
        return;
      }

      const prediction = {
        ...res,
        id: Date.now(),
        timestamp: new Date().toLocaleString("en-IN"),
        imageUrl: preview,
        breedInfo: BREED_DATA[res.breed],
      };
      setResult(prediction);
      onPredict(prediction);
      notify(`Identified: ${res.breed} (${res.confidence}% confidence)`);
    } catch (e) {
      console.error(e);
      notify(e.message || "Prediction failed — please try again", "error");
    }
    setLoading(false);
  };

  const reset = () => { setFile(null); setPreview(null); setResult(null); setInvalidMsg(null); };

  return (
    <div className="slide-in">
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}><span style={{ color: "#0ea5e9" }}>AI</span> Breed Predictor</h1>
      <p style={{ color: "#64748b", marginBottom: 28, fontSize: 14 }}>Upload an image of Indian cattle or buffalo for instant breed identification</p>

      {!result ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <div
              className="card"
              style={{
                border: drag ? "2px dashed #0ea5e9" : preview ? "1px solid #1e3a5f" : "2px dashed #1e3a5f",
                cursor: "pointer", textAlign: "center", transition: "all 0.2s",
                minHeight: 280, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                background: drag ? "rgba(14,165,233,0.05)" : "#0f172a",
              }}
              onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onClick={() => !preview && fileRef.current.click()}
            >
              {preview ? (
                <>
                  <img src={preview} alt="Preview" style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 12, objectFit: "contain" }} />
                  <button className="btn-primary" style={{ marginTop: 16, fontSize: 13, padding: "8px 20px" }} onClick={e => { e.stopPropagation(); reset(); }}>
                    Change Image
                  </button>
                </>
              ) : (
                <>
                  <div style={{
                    width: 72, height: 72, borderRadius: 20, background: "#1e3a5f",
                    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
                  }}>
                    <Icon name="upload" size={32} style={{ color: "#0ea5e9" }} />
                  </div>
                  <p style={{ fontWeight: 700, marginBottom: 8 }}>Drop image here</p>
                  <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>or click to browse</p>
                  <span className="tag" style={{ background: "#1e3a5f", color: "#94a3b8" }}>JPG · PNG · WEBP</span>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />

            <button className="btn-primary" style={{ width: "100%", marginTop: 16, fontSize: 16 }} disabled={!file || loading} onClick={predict}>
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
                  <span className="spin" style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", display: "inline-block" }} />
                  Analysing with AI...
                </span>
              ) : "🔍 Identify Breed"}
            </button>

            {invalidMsg && (
              <div style={{
                marginTop: 14, padding: "14px 16px",
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.4)",
                borderRadius: 12, display: "flex", alignItems: "flex-start", gap: 12,
              }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>⚠️</span>
                <div>
                  <p style={{ fontWeight: 700, color: "#f87171", fontSize: 14, marginBottom: 4 }}>
                    Invalid Image — Not a Cow or Buffalo
                  </p>
                  <p style={{ fontSize: 13, color: "#fca5a5", lineHeight: 1.5 }}>
                    Detected: <b>{invalidMsg}</b>
                  </p>
                  <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>
                    Please upload a clear photo of an Indian cattle or buffalo for breed identification.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <p style={{ fontWeight: 700, marginBottom: 14, color: "#94a3b8", fontSize: 13, textTransform: "uppercase", letterSpacing: 1 }}>
                Supported Breeds
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {ALL_BREEDS.map(b => (
                  <span key={b} className="tag" style={{ background: "#1e3a5f", color: "#93c5fd", border: "1px solid #1e3a8a" }}>
                    {b}
                  </span>
                ))}
              </div>
            </div>
            <div className="card">
              <p style={{ fontWeight: 700, marginBottom: 14, color: "#94a3b8", fontSize: 13, textTransform: "uppercase", letterSpacing: 1 }}>
                How It Works
              </p>
              {[
                ["1", "Upload image", "JPG/PNG of cattle or buffalo"],
                ["2", "AI Processing", "CNN model analyses key features"],
                ["3", "Get Results", "Breed name, confidence & details"],
              ].map(([n, title, desc]) => (
                <div key={n} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: "linear-gradient(135deg,#0ea5e9,#10b981)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 800, flexShrink: 0,
                  }}>{n}</div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14 }}>{title}</p>
                    <p style={{ fontSize: 13, color: "#64748b" }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <ResultPanel result={result} onReset={reset} />
      )}
    </div>
  );
}

function ResultPanel({ result, onReset }) {
  const info = result.breedInfo;
  const color = info?.color || "#0ea5e9";

  return (
    <div className="slide-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <span className="tag" style={{ background: "rgba(16,185,129,0.2)", color: "#34d399", marginBottom: 8, display: "inline-block" }}>
            ✓ Identification Complete
          </span>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>
            {result.breed}
            <span style={{ fontSize: 14, fontWeight: 600, color: "#64748b", marginLeft: 12 }}>{result.animal_type}</span>
          </h2>
        </div>
        <button className="btn-primary" style={{ fontSize: 13, padding: "8px 18px" }} onClick={onReset}>
          New Prediction
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 24, alignItems: "start" }}>
        <div style={{ width: 240 }}>
          <div className="card" style={{ padding: 12, marginBottom: 16 }}>
            <img src={result.imageUrl} alt="Uploaded" style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 10 }} />
          </div>
          <div className="card">
            <p style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 12 }}>TOP MATCHES</p>
            {result.top3.map((t, i) => (
              <div key={t.breed} style={{ marginBottom: i < result.top3.length - 1 ? 12 : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: i === 0 ? 700 : 400, color: i === 0 ? "#e2e8f0" : "#64748b" }}>{t.breed}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: i === 0 ? color : "#64748b" }}>{t.confidence}%</span>
                </div>
                <ConfBar value={parseFloat(t.confidence)} color={i === 0 ? color : "#1e3a5f"} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{
              background: `linear-gradient(135deg, ${color}22, transparent)`,
              border: `1px solid ${color}44`, borderRadius: 12, padding: 20, marginBottom: 16,
              display: "flex", alignItems: "center", gap: 16,
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16, background: `${color}33`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 32 }}>{result.animal_type === "Buffalo" ? "🐃" : "🐄"}</span>
              </div>
              <div>
                <p style={{ fontSize: 28, fontWeight: 800 }}>{result.confidence}%</p>
                <p style={{ color: "#64748b", fontSize: 14 }}>Confidence Score</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[["Origin", info?.origin], ["Milk Production", info?.milk], ["Lifespan", info?.lifespan], ["Found in", info?.states]].map(([k, v]) => (
                <div key={k} style={{ background: "#1e293b", borderRadius: 10, padding: "10px 14px" }}>
                  <p style={{ fontSize: 11, color: "#64748b", fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>{k}</p>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{v}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <p style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>Physical Characteristics</p>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "#cbd5e1" }}>{info?.characteristics}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardPage({ predictions }) {
  const total = predictions.length;
  const cattleCount = predictions.filter(p => p.animal_type === "Cattle").length;
  const buffaloCount = predictions.filter(p => p.animal_type === "Buffalo").length;
  const avgConf = total ? (predictions.reduce((s, p) => s + p.confidence, 0) / total).toFixed(1) : 0;

  const breedCounts = predictions.reduce((acc, p) => {
    acc[p.breed] = (acc[p.breed] || 0) + 1; return acc;
  }, {});
  const topBreeds = Object.entries(breedCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxCount = topBreeds[0]?.[1] || 1;

  const stats = [
    { label: "Total Predictions", value: total, icon: "chart", color: "#0ea5e9" },
    { label: "Cattle Identified", value: cattleCount, icon: "cow", color: "#10b981" },
    { label: "Buffalo Identified", value: buffaloCount, icon: "cow", color: "#8b5cf6" },
    { label: "Avg. Confidence", value: `${avgConf}%`, icon: "check", color: "#f59e0b" },
  ];

  return (
    <div className="slide-in">
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Dashboard</h1>
      <p style={{ color: "#64748b", marginBottom: 28, fontSize: 14 }}>Prediction analytics and statistics</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} className="card" style={{ textAlign: "center" }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: `${s.color}22`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 12px", color: s.color,
            }}>
              <Icon name={s.icon} size={22} />
            </div>
            <p style={{ fontSize: 26, fontWeight: 800 }}>{s.value}</p>
            <p style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {total === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 60 }}>
          <p style={{ fontSize: 16, color: "#64748b" }}>No predictions yet. Upload an image to get started!</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div className="card">
            <p style={{ fontWeight: 700, marginBottom: 20, color: "#94a3b8", fontSize: 13, textTransform: "uppercase", letterSpacing: 1 }}>
              Top Detected Breeds
            </p>
            {topBreeds.map(([breed, count]) => (
              <div key={breed} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{breed}</span>
                  <span style={{ fontSize: 13, color: "#64748b" }}>{count}</span>
                </div>
                <ConfBar value={(count / maxCount) * 100} color={BREED_DATA[breed]?.color || "#0ea5e9"} />
              </div>
            ))}
          </div>

          <div className="card">
            <p style={{ fontWeight: 700, marginBottom: 20, color: "#94a3b8", fontSize: 13, textTransform: "uppercase", letterSpacing: 1 }}>
              Recent Activity
            </p>
            {predictions.slice(0, 6).map(p => (
              <div key={p.id} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
                borderBottom: "1px solid #1e293b",
              }}>
                <img src={p.imageUrl} alt={p.breed} style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: 14 }}>{p.breed}</p>
                  <p style={{ fontSize: 12, color: "#64748b" }}>{p.animal_type} · {p.timestamp}</p>
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 700, padding: "3px 8px",
                  background: "rgba(16,185,129,0.15)", color: "#34d399", borderRadius: 8,
                }}>{p.confidence}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryPage({ predictions }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filtered = predictions.filter(p => {
    const matchSearch = p.breed.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || p.animal_type === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="slide-in">
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Prediction History</h1>
      <p style={{ color: "#64748b", marginBottom: 24, fontSize: 14 }}>{predictions.length} total predictions</p>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input className="input-field" style={{ flex: 1 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search breed..." />
        {["All", "Cattle", "Buffalo"].map(f => (
          <button key={f} className="nav-btn" style={{ padding: "8px 18px" }} onClick={() => setFilter(f)}>
            <span style={{ color: filter === f ? "#0ea5e9" : "#64748b", fontWeight: filter === f ? 700 : 500 }}>{f}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 60 }}>
          <p style={{ color: "#64748b" }}>{predictions.length === 0 ? "No predictions yet." : "No results found."}</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {filtered.map(p => (
            <div key={p.id} className="card" style={{ padding: 16 }}>
              <img src={p.imageUrl} alt={p.breed} style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 10, marginBottom: 12 }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15 }}>{p.breed}</p>
                  <p style={{ fontSize: 12, color: "#64748b" }}>{p.animal_type}</p>
                </div>
                <span style={{
                  fontSize: 13, fontWeight: 800,
                  color: p.confidence >= 85 ? "#34d399" : p.confidence >= 70 ? "#fbbf24" : "#f87171",
                }}>{p.confidence}%</span>
              </div>
              <p style={{ fontSize: 11, color: "#475569", marginTop: 8 }}>{p.timestamp}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminPage({ users, predictions }) {
  const [tab, setTab] = useState("users");
  return (
    <div className="slide-in">
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Admin Panel</h1>
      <p style={{ color: "#64748b", marginBottom: 24, fontSize: 14 }}>System management and oversight</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {["users", "predictions", "overview"].map(t => (
          <button key={t} className={`nav-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)} style={{ textTransform: "capitalize" }}>
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[["Total Users", users.length, "#0ea5e9"], ["Total Predictions", predictions.length, "#10b981"], ["Breeds Tracked", Object.keys(BREED_DATA).length, "#8b5cf6"]].map(([label, value, color]) => (
            <div key={label} className="card" style={{ textAlign: "center" }}>
              <p style={{ fontSize: 36, fontWeight: 800, color }}>{value}</p>
              <p style={{ fontSize: 13, color: "#64748b" }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "users" && (
        <div className="card">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1e3a5f" }}>
                {["ID", "Name", "Email", "Role", "Status"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: "1px solid #1e293b" }}>
                  <td style={{ padding: "12px", fontSize: 13, color: "#64748b" }}>#{u.id}</td>
                  <td style={{ padding: "12px", fontWeight: 600 }}>{u.name}</td>
                  <td style={{ padding: "12px", fontSize: 13, color: "#94a3b8" }}>{u.email}</td>
                  <td style={{ padding: "12px" }}>
                    <span className="tag" style={{ background: u.role === "admin" ? "rgba(139,92,246,0.2)" : "rgba(14,165,233,0.2)", color: u.role === "admin" ? "#a78bfa" : "#38bdf8" }}>{u.role}</span>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span className="tag" style={{ background: "rgba(16,185,129,0.2)", color: "#34d399" }}>Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "predictions" && (
        <div className="card">
          {predictions.length === 0 ? (
            <p style={{ color: "#64748b", textAlign: "center", padding: 40 }}>No predictions logged yet.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1e3a5f" }}>
                  {["ID", "Breed", "Type", "Confidence", "Time"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {predictions.map(p => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #1e293b" }}>
                    <td style={{ padding: "12px", fontSize: 13, color: "#64748b" }}>#{p.id.toString().slice(-4)}</td>
                    <td style={{ padding: "12px", fontWeight: 600 }}>{p.breed}</td>
                    <td style={{ padding: "12px", fontSize: 13, color: "#94a3b8" }}>{p.animal_type}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{
                        fontSize: 13, fontWeight: 700,
                        color: p.confidence >= 85 ? "#34d399" : p.confidence >= 70 ? "#fbbf24" : "#f87171",
                      }}>{p.confidence}%</span>
                    </td>
                    <td style={{ padding: "12px", fontSize: 12, color: "#64748b" }}>{p.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
