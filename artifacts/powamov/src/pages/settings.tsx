import { useState } from "react";
import { motion } from "framer-motion";
import {
  Globe, Bell, Shield, Download, Trash2, Monitor, Moon, Sun,
  ChevronRight, Check, AlertTriangle,
} from "lucide-react";
import { logout, getUser } from "@/utils/auth";
import { useLocation } from "wouter";
import { useEmissionsStore } from "@/stores/emissionsStore";
import { useTheme } from "@/components/theme-provider";

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

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition-colors flex-shrink-0 ${checked ? "bg-primary" : "bg-muted"}`}
    >
      <motion.div
        animate={{ x: checked ? 16 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm"
      />
    </button>
  );
}

function ToggleRow({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm text-foreground">{label}</div>
        {desc && <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

export default function Settings() {
  const user = getUser();
  const [, setLocation] = useLocation();
  const { calculatorScenarios, trackerEntries, clearTrackerEntries } = useEmissionsStore();

  const [lang, setLang] = useState("en");
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState({ email: true, push: false, digest: true });
  const [privacy, setPrivacy] = useState({ dataSharing: false, analytics: true, crashReports: true });
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const exportData = () => {
    const data = {
      profile: user,
      calculatorScenarios,
      trackerEntries,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ecosphere-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = () => {
    const USERS_KEY = "e2_users";
    const SESSION_KEY = "e2_session";
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    const filtered = users.filter((u: any) => u.id !== user?.id);
    localStorage.setItem(USERS_KEY, JSON.stringify(filtered));
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("e2_calculator_scenarios");
    localStorage.removeItem("e2_tracker_entries");
    setLocation("/login");
  };

  return (
    <motion.div initial="initial" animate="animate" variants={stagger} className="space-y-6 max-w-2xl">
      <motion.div variants={fadeIn}>
        <h1 className="text-2xl font-bold font-mono text-foreground tracking-wide">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your preferences and account configuration</p>
      </motion.div>

      {/* Language & Region */}
      <SectionCard title="LANGUAGE & DISPLAY" icon={Globe} color="#22d3ee">
        <div>
          <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-2">Interface Language</label>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          >
            <option value="en">English</option>
            <option value="af">Afrikaans</option>
            <option value="ts">Setswana</option>
            <option value="zu">Zulu</option>
            <option value="fr">French</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-2">Appearance</label>
          <div className="flex gap-2">
            {([
              { value: "dark", icon: Moon, label: "Dark" },
              { value: "light", icon: Sun, label: "Light" },
              { value: "system", icon: Monitor, label: "System" },
            ] as const).map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-lg border transition-all text-xs font-mono ${
                  theme === value
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-background border-border text-muted-foreground hover:border-muted-foreground/50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Notifications */}
      <SectionCard title="NOTIFICATIONS" icon={Bell} color="#f59e0b">
        <ToggleRow
          label="Email Notifications"
          desc="Receive system alerts and reports via email"
          checked={notifications.email}
          onChange={(v) => setNotifications((n) => ({ ...n, email: v }))}
        />
        <div className="h-px bg-border" />
        <ToggleRow
          label="Push Notifications"
          desc="Browser notifications for critical alerts"
          checked={notifications.push}
          onChange={(v) => setNotifications((n) => ({ ...n, push: v }))}
        />
        <div className="h-px bg-border" />
        <ToggleRow
          label="Weekly Digest"
          desc="Summary of carbon metrics and POWAMOV performance"
          checked={notifications.digest}
          onChange={(v) => setNotifications((n) => ({ ...n, digest: v }))}
        />
        <button
          onClick={handleSave}
          className="mt-2 flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 text-primary text-xs font-mono rounded-lg hover:bg-primary/20 transition-colors"
        >
          {saved ? <><Check className="h-3.5 w-3.5" /> SAVED</> : <>Save Preferences <ChevronRight className="h-3.5 w-3.5" /></>}
        </button>
      </SectionCard>

      {/* Privacy */}
      <SectionCard title="PRIVACY & SECURITY" icon={Shield} color="#4ade80">
        <ToggleRow
          label="Data Sharing"
          desc="Allow anonymized usage data to improve the platform"
          checked={privacy.dataSharing}
          onChange={(v) => setPrivacy((p) => ({ ...p, dataSharing: v }))}
        />
        <div className="h-px bg-border" />
        <ToggleRow
          label="Analytics Tracking"
          desc="Track page visits and feature usage"
          checked={privacy.analytics}
          onChange={(v) => setPrivacy((p) => ({ ...p, analytics: v }))}
        />
        <div className="h-px bg-border" />
        <ToggleRow
          label="Crash Reports"
          desc="Send error reports to improve stability"
          checked={privacy.crashReports}
          onChange={(v) => setPrivacy((p) => ({ ...p, crashReports: v }))}
        />
        <div className="bg-muted/30 border border-border rounded-lg px-4 py-3 text-xs text-muted-foreground font-mono">
          This platform operates in offline mode. All data is stored locally in your browser. No server-side data processing occurs.
        </div>
      </SectionCard>

      {/* Data Export */}
      <SectionCard title="DATA & EXPORT" icon={Download} color="#a78bfa">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-foreground">Export All Data</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {calculatorScenarios.length} scenarios · {trackerEntries.length} tracker entries
            </div>
          </div>
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-mono rounded-lg hover:bg-purple-500/20 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export JSON
          </button>
        </div>
        <div className="h-px bg-border" />
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-foreground">Clear Tracker History</div>
            <div className="text-xs text-muted-foreground mt-0.5">{trackerEntries.length} emission entries</div>
          </div>
          <button
            onClick={clearTrackerEntries}
            className="px-4 py-2 bg-muted/50 border border-border text-muted-foreground text-xs font-mono rounded-lg hover:bg-muted transition-colors"
          >
            Clear
          </button>
        </div>
      </SectionCard>

      {/* Danger Zone */}
      <SectionCard title="ACCOUNT MANAGEMENT" icon={Trash2} color="#ef4444">
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Delete Account</div>
              <div className="text-xs text-muted-foreground mt-1">This will permanently remove all your local data including scenarios, tracker entries, and profile. This cannot be undone.</div>
            </div>
          </div>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="px-4 py-2 bg-destructive/10 border border-destructive/30 text-destructive text-xs font-mono rounded-lg hover:bg-destructive/20 transition-colors"
            >
              Delete Account
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-destructive text-destructive-foreground text-xs font-mono rounded-lg hover:bg-destructive/90 transition-colors"
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 bg-muted text-muted-foreground text-xs font-mono rounded-lg hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-foreground">Sign Out</div>
          <button
            onClick={() => { logout(); setLocation("/login"); }}
            className="px-4 py-2 bg-muted/50 border border-border text-muted-foreground text-xs font-mono rounded-lg hover:bg-muted transition-colors"
          >
            Sign Out
          </button>
        </div>
      </SectionCard>
    </motion.div>
  );
}
