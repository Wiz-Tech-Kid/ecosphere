import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, User, Settings, LogOut, ChevronDown,
  Activity, Globe2, Calculator, Cpu, Zap, BarChart3,
  Radio, Wrench, Users, Sun, Moon,
} from "lucide-react";
import { getUser, logout } from "@/utils/auth";
import { useTheme } from "@/components/theme-provider";

const BREADCRUMB_MAP: Record<string, string> = {
  "/": "Intelligence Overview",
  "/command": "Command Center",
  "/digital-twin": "Digital Twin",
  "/maintenance": "Maintenance",
  "/analytics": "Energy Analytics",
  "/carbon-analytics": "Regional Carbon",
  "/calculator": "Manual Calculator",
  "/tracker": "Telemetry Engine",
  "/settings": "Settings",
  "/profile": "Profile",
  "/collaborators": "Operations Hub",
};

const ICON_MAP: Record<string, React.ElementType> = {
  "/command": Activity,
  "/digital-twin": Cpu,
  "/maintenance": Wrench,
  "/analytics": BarChart3,
  "/carbon-analytics": Globe2,
  "/calculator": Calculator,
  "/tracker": Radio,
  "/settings": Settings,
  "/profile": User,
  "/collaborators": Users,
};

const NOTIFICATIONS = [
  { id: 1, type: "warning", text: "Node BW-007 efficiency dropped 14%", time: "2 min ago", read: false },
  { id: 2, type: "info", text: "BW grid intensity peaked at 812 gCO₂/kWh", time: "18 min ago", read: false },
  { id: 3, type: "success", text: "DEP-003 Cape Town N2 — 4.1 kWh harvested today", time: "1 hour ago", read: true },
  { id: 4, type: "warning", text: "Node ZA-012 maintenance overdue by 3 days", time: "3 hours ago", read: true },
];

const NOTIF_COLORS: Record<string, string> = {
  warning: "#c07a16",
  info:    "#4a90b8",
  success: "#3d8a5e",
  error:   "#b84a4a",
};

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
}

export function Topbar({ onLogout }: { onLogout: () => void }) {
  const [location] = useLocation();
  const user = getUser();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notifs, setNotifs] = useState(NOTIFICATIONS);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useClickOutside(notifRef, () => setNotifOpen(false));
  useClickOutside(userRef, () => setUserOpen(false));

  const unread = notifs.filter((n) => !n.read).length;
  const PageIcon = ICON_MAP[location] ?? Zap;
  const pageTitle = BREADCRUMB_MAP[location] ?? "Dashboard";

  const initials = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .map((n) => n![0])
    .join("")
    .toUpperCase() || (user?.email?.[0]?.toUpperCase() ?? "U");

  const markAllRead = () => setNotifs((n) => n.map((notif) => ({ ...notif, read: true })));

  return (
    <div className="h-14 border-b border-border bg-card/60 backdrop-blur-sm flex items-center justify-between px-4 gap-4 flex-shrink-0 sticky top-0 z-20">
      {/* Left: page title */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="h-6 w-6 rounded flex items-center justify-center bg-primary/10 border border-primary/20 flex-shrink-0">
          <PageIcon className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-sm font-mono font-medium text-foreground truncate">{pageTitle}</span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <motion.button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          whileTap={{ scale: 0.92 }}
          className="relative h-8 w-14 rounded-full border border-border flex items-center transition-colors overflow-hidden"
          style={{ background: isDark ? "hsl(222 47% 10%)" : "hsl(43 50% 92%)" }}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          <motion.div
            animate={{ x: isDark ? 2 : 30 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute h-6 w-6 rounded-full flex items-center justify-center shadow-sm z-10"
            style={{ background: isDark ? "hsl(222 47% 20%)" : "hsl(0 0% 100%)" }}
          >
            {isDark
              ? <Moon className="h-3.5 w-3.5 text-primary" />
              : <Sun className="h-3.5 w-3.5 text-amber-500" />
            }
          </motion.div>
          <span className="absolute left-1.5 text-[8px] font-mono opacity-40 select-none">
            {isDark ? "" : "☀"}
          </span>
          <span className="absolute right-1.5 text-[8px] font-mono opacity-40 select-none">
            {isDark ? "☾" : ""}
          </span>
        </motion.button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen((v) => !v); setUserOpen(false); }}
            className="relative h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-destructive" />
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-10 w-80 bg-card border border-border rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <span className="text-xs font-mono font-medium text-foreground uppercase tracking-widest">Notifications</span>
                  {unread > 0 && (
                    <button onClick={markAllRead} className="text-[10px] font-mono text-primary hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifs.map((n) => (
                    <div
                      key={n.id}
                      className={`flex gap-3 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer ${!n.read ? "bg-primary/[0.03]" : ""}`}
                      onClick={() => setNotifs((ns) => ns.map((x) => x.id === n.id ? { ...x, read: true } : x))}
                    >
                      <div className="h-1.5 w-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: NOTIF_COLORS[n.type] ?? "#6b7280" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground leading-relaxed">{n.text}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{n.time}</p>
                      </div>
                      {!n.read && <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User menu */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => { setUserOpen((v) => !v); setNotifOpen(false); }}
            className="flex items-center gap-2 h-8 px-2 rounded-lg hover:bg-muted/50 transition-all text-muted-foreground hover:text-foreground"
          >
            <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-mono font-bold text-primary">{initials}</span>
            </div>
            <span className="text-xs font-mono hidden sm:block max-w-[120px] truncate text-foreground">
              {user?.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : user?.email ?? "User"}
            </span>
            <ChevronDown className="h-3 w-3 flex-shrink-0" />
          </button>

          <AnimatePresence>
            {userOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-10 w-52 bg-card border border-border rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-border">
                  <div className="text-xs font-mono font-medium text-foreground truncate">
                    {user?.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : "User"}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">{user?.email}</div>
                </div>
                <div className="py-1">
                  <Link href="/profile" onClick={() => setUserOpen(false)}>
                    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-mono text-foreground">Profile</span>
                    </div>
                  </Link>
                  <Link href="/settings" onClick={() => setUserOpen(false)}>
                    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-mono text-foreground">Settings</span>
                    </div>
                  </Link>
                  <div className="h-px bg-border my-1" />
                  <button
                    onClick={() => { setUserOpen(false); onLogout(); }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-destructive/10 cursor-pointer transition-colors w-full text-left"
                  >
                    <LogOut className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-mono text-foreground">Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
