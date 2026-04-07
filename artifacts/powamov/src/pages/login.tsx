import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Mail, Lock, User, MapPin, Eye, EyeOff, ArrowRight, Leaf } from "lucide-react";
import { login, signup } from "@/utils/auth";

const BW_REGIONS = ["Gaborone", "Francistown", "Maun", "Kasane", "Serowe", "Lobatse", "Molepolole", "Kanye"];
const ZA_REGIONS = ["Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape", "Limpopo", "Mpumalanga", "North West", "Free State", "Northern Cape"];
const COUNTRIES: Record<string, string[]> = { Botswana: BW_REGIONS, "South Africa": ZA_REGIONS };

function FloatingOrb({ x, y, size, color, delay }: { x: string; y: string; size: number; color: string; delay: number }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none opacity-[0.04]"
      style={{ left: x, top: y, width: size, height: size, background: `radial-gradient(circle, ${color}, transparent 70%)` }}
    />
  );
}

function GridLines() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" className="text-border" strokeWidth="0.5" opacity="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

interface FormState {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  country: string;
  region: string;
  tos: boolean;
}

export default function Login() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [form, setForm] = useState<FormState>({
    email: "", password: "", confirmPassword: "",
    firstName: "", lastName: "", country: "", region: "", tos: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const update = (field: keyof FormState, value: string | boolean) =>
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "country") next.region = "";
      return next;
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    await new Promise((r) => setTimeout(r, 400));

    if (mode === "signin") {
      const { error } = login(form.email, form.password);
      if (error) { setError(error); setLoading(false); return; }
    } else {
      if (form.password !== form.confirmPassword) { setError("Passwords do not match."); setLoading(false); return; }
      if (!form.tos) { setError("You must accept the Terms of Service."); setLoading(false); return; }
      const { error } = signup(form.email, form.password, {
        firstName: form.firstName, lastName: form.lastName,
        country: form.country, region: form.region,
      });
      if (error) { setError(error); setLoading(false); return; }
    }

    setLoading(false);
    setLocation("/");
  };

  const regions = COUNTRIES[form.country] ?? [];

  return (
    <div className="min-h-screen bg-background flex overflow-hidden relative">
      <GridLines />
      <FloatingOrb x="5%" y="10%" size={400} color="#4a90b8" delay={0} />
      <FloatingOrb x="60%" y="60%" size={500} color="#3d8a5e" delay={2} />
      <FloatingOrb x="80%" y="5%" size={300} color="#7c6db5" delay={4} />
      <FloatingOrb x="20%" y="70%" size={250} color="#4a90b8" delay={1} />

      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-mono font-bold text-lg tracking-wider text-foreground leading-none">ECOSPHERE</div>
            <div className="text-[10px] font-mono text-primary/60 mt-0.5">v2.1 · POWAMOV INTELLIGENCE</div>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold text-foreground leading-tight"
            >
              Carbon Intelligence
              <br />
              <span className="text-primary">for Southern Africa</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 text-muted-foreground text-lg leading-relaxed"
            >
              Monitor infrastructure energy harvesting, track carbon emissions, and unlock data-driven sustainability insights for Botswana and South Africa.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 gap-4"
          >
            {[
              { label: "BW Grid Intensity", value: "734 gCO₂/kWh", color: "#c07a16" },
              { label: "ZA Grid Intensity", value: "655 gCO₂/kWh", color: "#4a90b8" },
              { label: "POWAMOV Nodes",    value: "Active Infrastructure", color: "#3d8a5e" },
              { label: "Data Coverage",    value: "2023 – 2024",           color: "#7c6db5" },
            ].map((stat) => (
              <div key={stat.label} className="bg-card border border-border rounded-lg p-4">
                <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</div>
                <div className="font-mono font-semibold text-sm" style={{ color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Leaf className="h-4 w-4 text-accent" />
            <span>Real datasets from Electricity Maps · Botswana & South Africa 2023–2024</span>
          </motion.div>
        </div>

        <div className="text-xs font-mono text-muted-foreground/40">
          ECOSPHERE 2.1 · POWAMOV Infrastructure Intelligence Platform
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Logo (mobile) */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-mono font-bold tracking-wider">ECOSPHERE 2.1</span>
          </div>

          {/* Card */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl shadow-black/20">
            {/* Tabs */}
            <div className="flex border-b border-border">
              {(["signin", "signup"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setMode(tab); setError(null); }}
                  className={`flex-1 py-4 text-sm font-mono font-medium tracking-wider transition-all relative ${
                    mode === tab ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
                  {mode === tab && (
                    <motion.div layoutId="authTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <AnimatePresence mode="wait">
                {mode === "signup" && (
                  <motion.div
                    key="signup-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="First name"
                          value={form.firstName}
                          onChange={(e) => update("firstName", e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                        />
                      </div>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Last name"
                          value={form.lastName}
                          onChange={(e) => update("lastName", e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                        />
                      </div>
                    </div>

                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <select
                        value={form.country}
                        onChange={(e) => update("country", e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                      >
                        <option value="">Select country</option>
                        <option>Botswana</option>
                        <option>South Africa</option>
                      </select>
                    </div>

                    {regions.length > 0 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <select
                          value={form.region}
                          onChange={(e) => update("region", e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                        >
                          <option value="">Select region</option>
                          {regions.map((r) => <option key={r}>{r}</option>)}
                        </select>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  required
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  className="w-full pl-9 pr-10 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <AnimatePresence>
                {mode === "signup" && (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type={showConfirm ? "text" : "password"}
                        placeholder="Confirm password"
                        value={form.confirmPassword}
                        onChange={(e) => update("confirmPassword", e.target.value)}
                        autoComplete="new-password"
                        className="w-full pl-9 pr-10 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <div
                        onClick={() => update("tos", !form.tos)}
                        className={`mt-0.5 h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center transition-all cursor-pointer ${
                          form.tos ? "bg-primary border-primary" : "border-border"
                        }`}
                      >
                        {form.tos && <div className="h-2 w-2 bg-primary-foreground rounded-sm" />}
                      </div>
                      <span className="text-xs text-muted-foreground leading-relaxed">
                        I agree to the Terms of Service and acknowledge this platform uses simulated offline authentication for demo purposes.
                      </span>
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="px-3 py-2.5 bg-destructive/10 border border-destructive/30 rounded-lg text-xs text-destructive font-mono"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-2.5 bg-primary text-primary-foreground font-mono font-medium text-sm rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>
                    {mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>

              <p className="text-center text-xs text-muted-foreground">
                {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
                  className="text-primary hover:underline font-medium"
                >
                  {mode === "signin" ? "Create one" : "Sign in"}
                </button>
              </p>
            </form>
          </div>

          <p className="text-center text-[10px] text-muted-foreground/40 font-mono mt-4">
            OFFLINE MODE · Data stored locally · No server authentication
          </p>
        </motion.div>
      </div>
    </div>
  );
}
