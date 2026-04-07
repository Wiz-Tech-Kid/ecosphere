import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Cpu, Wrench, BarChart3, Menu, X, Zap,
  Calculator, Radio, Globe2, LayoutDashboard, ChevronDown,
  Users, User,
} from "lucide-react";
import { useHealthCheck, getHealthCheckQueryKey } from "@workspace/api-client-react";
import { getUser, logout } from "@/utils/auth";
import { Topbar } from "@/components/layout/topbar";
import { useLocation as useWouterLocation } from "wouter";

const POWAMOV_NAV = [
  { href: "/command", label: "Command Center", icon: Activity },
  { href: "/digital-twin", label: "Digital Twin", icon: Cpu },
  { href: "/maintenance", label: "Maintenance", icon: Wrench },
];

const CARBON_NAV = [
  { href: "/analytics", label: "Energy Analytics", icon: BarChart3 },
  { href: "/carbon-analytics", label: "Regional Carbon", icon: Globe2 },
  { href: "/calculator", label: "Manual Calculator", icon: Calculator },
  { href: "/tracker", label: "Telemetry Engine", icon: Radio },
];

const OPERATIONS_NAV = [
  { href: "/collaborators", label: "Operations Hub", icon: Users },
];

function NavSection({ title, items, location, onClose }: {
  title: string;
  items: typeof POWAMOV_NAV;
  location: string;
  onClose: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="mb-2">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center justify-between w-full px-3 py-1.5 text-[10px] font-mono font-bold tracking-widest text-muted-foreground/60 uppercase hover:text-muted-foreground transition-colors"
      >
        {title}
        <ChevronDown className={`h-3 w-3 transition-transform ${collapsed ? "-rotate-90" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden space-y-0.5"
          >
            {items.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={onClose}>
                  <div className={`relative flex items-center gap-3 px-3 py-2.5 rounded-md transition-all cursor-pointer group ${
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-sidebar-accent/40 hover:text-foreground"
                  }`}>
                    {isActive && (
                      <motion.div layoutId="activeNav" className="absolute left-0 w-0.5 h-5 bg-primary rounded-r-full" />
                    )}
                    <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground transition-colors"}`} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Shell({ children, onLogout }: { children: React.ReactNode; onLogout: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const user = getUser();

  const { data: health } = useHealthCheck({
    query: {
      queryKey: getHealthCheckQueryKey(),
      refetchInterval: 30000,
    }
  });

  const close = () => setIsOpen(false);

  const initials = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .map((n) => n![0])
    .join("")
    .toUpperCase() || (user?.email?.[0]?.toUpperCase() ?? "U");

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row overflow-hidden font-sans">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <span className="font-mono font-bold text-sm tracking-wider text-foreground">ECOSPHERE</span>
          <span className="text-[10px] font-mono text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">2.1</span>
        </div>
        <button onClick={() => setIsOpen(true)} className="text-muted-foreground p-2 hover:text-foreground transition-colors">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            onClick={close}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : undefined }}
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col md:relative md:translate-x-0 ${!isOpen ? "hidden md:flex" : "flex"}`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-sidebar-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-mono font-bold text-sm tracking-wider text-foreground leading-none">ECOSPHERE</div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[9px] font-mono text-primary/70">v2.1</span>
                <span className="text-[9px] text-muted-foreground/50">· POWAMOV</span>
              </div>
            </div>
          </div>
          <button className="md:hidden text-muted-foreground hover:text-foreground" onClick={close}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* User profile strip */}
        <Link href="/profile" onClick={close}>
          <div className="mx-3 mt-3 flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-sidebar-accent/40 cursor-pointer transition-all group border border-transparent hover:border-border">
            <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-mono font-bold text-primary">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-foreground truncate">
                {user?.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : "My Profile"}
              </div>
              <div className="text-[10px] text-muted-foreground/60 font-mono truncate">{user?.country ?? "User"}</div>
            </div>
            <User className="h-3 w-3 text-muted-foreground/50 group-hover:text-muted-foreground" />
          </div>
        </Link>

        {/* Dashboard link */}
        <div className="px-3 pt-2">
          <Link href="/" onClick={close}>
            <div className={`relative flex items-center gap-3 px-3 py-2.5 rounded-md transition-all cursor-pointer group ${
              location === "/" || location === ""
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:bg-sidebar-accent/40 hover:text-foreground"
            }`}>
              <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm font-medium">Dashboard</span>
            </div>
          </Link>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 py-3 px-3 overflow-y-auto space-y-1">
          <NavSection title="POWAMOV Infrastructure" items={POWAMOV_NAV} location={location} onClose={close} />
          <NavSection title="Carbon Intelligence" items={CARBON_NAV} location={location} onClose={close} />
          <NavSection title="Operations" items={OPERATIONS_NAV} location={location} onClose={close} />
        </nav>

        {/* System Status */}
        <div className="p-4 border-t border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 bg-card/50 rounded-md border border-border">
            <div className={`h-2 w-2 rounded-full flex-shrink-0 ${health?.status === "ok" ? "bg-accent" : "bg-destructive"}`} />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">System Status</span>
              <span className="text-xs font-mono font-medium truncate">{health?.status === "ok" ? "ALL SYSTEMS ONLINE" : "SYSTEM OFFLINE"}</span>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-[100dvh] md:h-[100dvh] overflow-hidden">
        <Topbar onLogout={onLogout} />
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
