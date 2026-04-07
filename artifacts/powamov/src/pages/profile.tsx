import { useState } from "react";
import { motion } from "framer-motion";
import {
  User, Mail, Phone, MapPin, Lock, Shield, Key,
  Check, AlertTriangle, Camera,
} from "lucide-react";
import { getUser, updateProfile, changePassword } from "@/utils/auth";
import { useEmissionsStore } from "@/stores/emissionsStore";

const fadeIn = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } };
const stagger = { animate: { transition: { staggerChildren: 0.06 } } };

function SectionCard({ title, icon: Icon, color, children }: {
  title: string; icon: React.ElementType; color: string; children: React.ReactNode;
}) {
  return (
    <motion.div variants={fadeIn} className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className="h-8 w-8 rounded-md flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <h2 className="font-mono font-medium text-sm tracking-wide text-foreground">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </motion.div>
  );
}

function Field({ label, icon: Icon, value, onChange, type = "text", placeholder }: {
  label: string; icon: React.ElementType; value: string;
  onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
        />
      </div>
    </div>
  );
}

function StatusMsg({ msg, isError }: { msg: string; isError?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono ${
        isError ? "bg-destructive/10 border border-destructive/30 text-destructive" : "bg-accent/10 border border-accent/30 text-accent"
      }`}
    >
      {isError ? <AlertTriangle className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
      {msg}
    </motion.div>
  );
}

export default function Profile() {
  const user = getUser();
  const { calculatorScenarios, trackerEntries } = useEmissionsStore();

  const [info, setInfo] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: "",
    country: user?.country ?? "",
    region: user?.region ?? "",
  });
  const [infoMsg, setInfoMsg] = useState<{ text: string; error: boolean } | null>(null);

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState<{ text: string; error: boolean } | null>(null);
  const [showPw, setShowPw] = useState(false);

  const [twoFa, setTwoFa] = useState(false);

  const initials = [info.firstName, info.lastName]
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase() || (user?.email?.[0]?.toUpperCase() ?? "U");

  const handleSaveInfo = () => {
    updateProfile({
      firstName: info.firstName,
      lastName: info.lastName,
      country: info.country,
      region: info.region,
    });
    setInfoMsg({ text: "Profile updated successfully.", error: false });
    setTimeout(() => setInfoMsg(null), 3000);
  };

  const handleChangePassword = () => {
    if (pw.next !== pw.confirm) {
      setPwMsg({ text: "New passwords do not match.", error: true });
      return;
    }
    if (pw.next.length < 6) {
      setPwMsg({ text: "Password must be at least 6 characters.", error: true });
      return;
    }
    const { error } = changePassword(pw.current, pw.next);
    if (error) {
      setPwMsg({ text: error, error: true });
    } else {
      setPwMsg({ text: "Password changed successfully.", error: false });
      setPw({ current: "", next: "", confirm: "" });
    }
    setTimeout(() => setPwMsg(null), 3000);
  };

  return (
    <motion.div initial="initial" animate="animate" variants={stagger} className="space-y-6 max-w-2xl">
      <motion.div variants={fadeIn}>
        <h1 className="text-2xl font-bold font-mono text-foreground tracking-wide">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account information and security</p>
      </motion.div>

      {/* Avatar + stats */}
      <motion.div variants={fadeIn} className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="h-16 w-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
              <span className="text-xl font-mono font-bold text-primary">{initials}</span>
            </div>
            <button className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors">
              <Camera className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-mono font-bold text-foreground text-lg leading-tight">
              {[info.firstName, info.lastName].filter(Boolean).join(" ") || "Unnamed User"}
            </div>
            <div className="text-sm text-muted-foreground mt-0.5 truncate">{user?.email}</div>
            <div className="flex items-center gap-1.5 mt-2">
              {user?.country && (
                <span className="text-xs font-mono bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded">
                  {user.country}
                </span>
              )}
              <span className="text-xs font-mono bg-muted/50 text-muted-foreground border border-border px-2 py-0.5 rounded">
                Offline Mode
              </span>
            </div>
          </div>
          <div className="hidden sm:grid grid-cols-2 gap-4 text-right">
            <div>
              <div className="text-xl font-mono font-bold text-primary">{calculatorScenarios.length}</div>
              <div className="text-xs text-muted-foreground">Scenarios</div>
            </div>
            <div>
              <div className="text-xl font-mono font-bold text-accent">{trackerEntries.length}</div>
              <div className="text-xs text-muted-foreground">Entries</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Personal Info */}
      <SectionCard title="PERSONAL INFORMATION" icon={User} color="#22d3ee">
        <div className="grid grid-cols-2 gap-4">
          <Field label="First Name" icon={User} value={info.firstName} onChange={(v) => setInfo((i) => ({ ...i, firstName: v }))} placeholder="First name" />
          <Field label="Last Name" icon={User} value={info.lastName} onChange={(v) => setInfo((i) => ({ ...i, lastName: v }))} placeholder="Last name" />
        </div>
        <Field
          label="Email Address"
          icon={Mail}
          value={user?.email ?? ""}
          onChange={() => {}}
          placeholder="Email"
        />
        <Field label="Phone Number" icon={Phone} value={info.phone} onChange={(v) => setInfo((i) => ({ ...i, phone: v }))} placeholder="+267 74 000 000" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-1.5">Country</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                value={info.country}
                onChange={(e) => setInfo((i) => ({ ...i, country: e.target.value, region: "" }))}
                className="w-full pl-9 pr-3 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              >
                <option value="">Select</option>
                <option>Botswana</option>
                <option>South Africa</option>
              </select>
            </div>
          </div>
          <Field label="Region" icon={MapPin} value={info.region} onChange={(v) => setInfo((i) => ({ ...i, region: v }))} placeholder="Region / City" />
        </div>

        {infoMsg && <StatusMsg msg={infoMsg.text} isError={infoMsg.error} />}

        <button
          onClick={handleSaveInfo}
          className="px-5 py-2.5 bg-primary text-primary-foreground text-xs font-mono rounded-lg hover:bg-primary/90 transition-colors"
        >
          Save Changes
        </button>
      </SectionCard>

      {/* Security */}
      <SectionCard title="SECURITY" icon={Lock} color="#f59e0b">
        <div className="flex items-center justify-between py-1">
          <div>
            <div className="text-sm text-foreground">Two-Factor Authentication</div>
            <div className="text-xs text-muted-foreground mt-0.5">Requires additional verification on sign-in</div>
          </div>
          <button
            onClick={() => setTwoFa((v) => !v)}
            className={`relative h-5 w-9 rounded-full transition-colors flex-shrink-0 ${twoFa ? "bg-primary" : "bg-muted"}`}
          >
            <motion.div
              animate={{ x: twoFa ? 16 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm"
            />
          </button>
        </div>

        <div className="h-px bg-border" />

        <div>
          <button
            onClick={() => setShowPw((v) => !v)}
            className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors font-medium"
          >
            <Key className="h-4 w-4" />
            Change Password
            <motion.span
              animate={{ rotate: showPw ? 90 : 0 }}
              className="text-muted-foreground"
            >›</motion.span>
          </button>

          {showPw && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-3"
            >
              <Field label="Current Password" icon={Lock} value={pw.current} onChange={(v) => setPw((p) => ({ ...p, current: v }))} type="password" placeholder="Current password" />
              <Field label="New Password" icon={Lock} value={pw.next} onChange={(v) => setPw((p) => ({ ...p, next: v }))} type="password" placeholder="New password (min 6 chars)" />
              <Field label="Confirm New Password" icon={Lock} value={pw.confirm} onChange={(v) => setPw((p) => ({ ...p, confirm: v }))} type="password" placeholder="Confirm new password" />
              {pwMsg && <StatusMsg msg={pwMsg.text} isError={pwMsg.error} />}
              <button
                onClick={handleChangePassword}
                className="px-5 py-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono rounded-lg hover:bg-amber-500/20 transition-colors"
              >
                Update Password
              </button>
            </motion.div>
          )}
        </div>
      </SectionCard>

      {/* Account Info */}
      <SectionCard title="ACCOUNT DETAILS" icon={Shield} color="#4ade80">
        <div className="space-y-3">
          {[
            { label: "Account ID", value: user?.id ? user.id.slice(0, 16) + "..." : "—" },
            { label: "Member Since", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" }) : "—" },
            { label: "Auth Mode", value: "Offline / Browser-Local" },
            { label: "Data Storage", value: "localStorage (this device only)" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{label}</span>
              <span className="text-xs font-mono text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </motion.div>
  );
}
