"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Overview", icon: GridIcon },
  { href: "/endpoints", label: "Endpoints", icon: DatabaseIcon },
  { href: "/categories", label: "Categories", icon: LayersIcon },
  { href: "/compare", label: "Compare", icon: CompareIcon },
  { href: "/status", label: "Status", icon: ActivityIcon },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Glass background with gradient border */}
      <div className="absolute inset-0 glass border-b border-border/50" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="relative container-neural h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <NeuralLogo />
          <div className="flex flex-col">
            <span className="font-display text-lg leading-tight tracking-tight">
              Clarity<span className="text-primary">x402</span>
            </span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground hidden sm:block">
              Intelligence Layer
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50 border border-border/50">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-300 flex items-center gap-2",
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <span className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-md glow-cyan" />
                  )}
                  <span className="relative flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Right side: MCP + GitHub + Mobile menu */}
        <div className="flex items-center gap-3">
          {/* Tonbi Studio Badge */}
          <a
            href="https://tonbistudio.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-white/10 to-rose-500/20 border border-white/10 hover:border-rose-500/30 transition-all duration-300"
          >
            <span className="text-[10px] text-white/60">A</span>
            <span className="text-[10px] font-medium bg-gradient-to-r from-white to-rose-400 bg-clip-text text-transparent">
              Tonbi Studio
            </span>
            <span className="text-[10px] text-white/60">Project</span>
          </a>

          {/* Status indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/50 border border-border/50">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot" />
            <span className="text-xs font-medium text-muted-foreground">
              Live
            </span>
          </div>

          {/* MCP Server link */}
          <Link
            href="/mcp"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-all duration-300"
          >
            <PlugIcon className="w-4 h-4" />
            <span className="text-xs font-medium">MCP</span>
          </Link>

          {/* GitHub link */}
          <a
            href="https://github.com/ntombisol/clarityx402"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-9 h-9 rounded-md bg-secondary/50 border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30 transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
          </a>

          {/* Mobile menu button */}
          <MobileMenu pathname={pathname} />
        </div>
      </div>
    </header>
  );
}

function NeuralLogo() {
  return (
    <div className="relative w-10 h-10 group-hover:scale-105 transition-transform duration-300">
      {/* Outer glow ring */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 blur-sm group-hover:blur-md transition-all duration-300" />

      {/* Main container */}
      <div className="relative w-full h-full rounded-xl bg-gradient-to-br from-secondary to-background border border-border overflow-hidden">
        {/* Circuit pattern overlay */}
        <svg
          className="absolute inset-0 w-full h-full opacity-30"
          viewBox="0 0 40 40"
        >
          {/* Horizontal lines */}
          <line
            x1="0"
            y1="10"
            x2="15"
            y2="10"
            stroke="#06b6d4"
            strokeWidth="0.5"
          />
          <line
            x1="25"
            y1="10"
            x2="40"
            y2="10"
            stroke="#06b6d4"
            strokeWidth="0.5"
          />
          <line
            x1="0"
            y1="30"
            x2="15"
            y2="30"
            stroke="#06b6d4"
            strokeWidth="0.5"
          />
          <line
            x1="25"
            y1="30"
            x2="40"
            y2="30"
            stroke="#06b6d4"
            strokeWidth="0.5"
          />

          {/* Vertical lines */}
          <line
            x1="10"
            y1="0"
            x2="10"
            y2="15"
            stroke="#06b6d4"
            strokeWidth="0.5"
          />
          <line
            x1="30"
            y1="0"
            x2="30"
            y2="15"
            stroke="#06b6d4"
            strokeWidth="0.5"
          />
          <line
            x1="10"
            y1="25"
            x2="10"
            y2="40"
            stroke="#06b6d4"
            strokeWidth="0.5"
          />
          <line
            x1="30"
            y1="25"
            x2="30"
            y2="40"
            stroke="#06b6d4"
            strokeWidth="0.5"
          />

          {/* Corner nodes */}
          <circle cx="10" cy="10" r="1.5" fill="#06b6d4" />
          <circle cx="30" cy="10" r="1.5" fill="#06b6d4" />
          <circle cx="10" cy="30" r="1.5" fill="#06b6d4" />
          <circle cx="30" cy="30" r="1.5" fill="#06b6d4" />
        </svg>

        {/* C letter */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-xl text-primary glow-text">C</span>
        </div>

        {/* Animated scan line */}
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          <div
            className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent"
            style={{
              animation: "scan-line 3s linear infinite",
            }}
          />
        </div>
      </div>

      {/* Corner accents */}
      <div className="absolute -top-0.5 -left-0.5 w-2 h-2 border-l-2 border-t-2 border-primary/50 rounded-tl" />
      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 border-r-2 border-t-2 border-primary/50 rounded-tr" />
      <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 border-l-2 border-b-2 border-primary/50 rounded-bl" />
      <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 border-r-2 border-b-2 border-primary/50 rounded-br" />
    </div>
  );
}

function MobileMenu({ pathname }: { pathname: string }) {
  return (
    <div className="md:hidden">
      <input type="checkbox" id="mobile-menu" className="peer hidden" />
      <label
        htmlFor="mobile-menu"
        className="flex items-center justify-center w-9 h-9 rounded-md bg-secondary/50 border border-border/50 text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
      >
        <svg
          className="w-5 h-5 peer-checked:hidden"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </label>

      {/* Mobile dropdown */}
      <div className="absolute top-full left-0 right-0 glass border-b border-border/50 hidden peer-checked:block">
        <nav className="container-neural py-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
          {/* MCP link in mobile menu */}
          <Link
            href="/mcp"
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors",
              pathname === "/mcp"
                ? "bg-accent/10 text-accent"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <PlugIcon className="w-5 h-5" />
            MCP Server
          </Link>
        </nav>
      </div>
    </div>
  );
}

// Icons
function GridIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
      />
    </svg>
  );
}

function DatabaseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
      />
    </svg>
  );
}

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
      />
    </svg>
  );
}

function CompareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}

function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M22 12h-4l-3 9L9 3l-3 9H2"
      />
    </svg>
  );
}

function PlugIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  );
}
