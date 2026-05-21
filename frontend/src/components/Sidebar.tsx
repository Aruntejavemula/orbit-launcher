import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  LogOut,
  Settings,
  LayoutGrid,
  BarChart3,
  Calendar as CalendarIcon,
  Zap,
  Pencil,
  X,
} from "lucide-react";
import HeroLogo from "./HeroLogo";
import BrandIcon from "./BrandIcon";
import { useAuth } from "../context/AuthContext";
import { useApps } from "../context/AppsContext";
import { usePrefs } from "../context/PreferencesContext";
import type { PageId } from "../types";
import ProfileEditorModal from "./ProfileEditorModal";
import { lastOpenedAt } from "../utils/appActivity";
import { listRowPriceLabel } from "../utils/appListRowFormat";
import { recentlyOpenedApps, upcomingRenewalApps, renewalUrgent } from "../utils/sidebarData";
import { sidebarOpenedShort, sidebarRenewalMonthDay } from "../utils/sidebarFormat";
import { tapOnlyHandlers } from "../utils/tapOnly";

const MOBILE_DRAWER_MOTION = {
  container: {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.042, delayChildren: 0.14 },
    },
  },
  item: {
    hidden: { opacity: 0, x: -14 },
    show: {
      opacity: 1,
      x: 0,
      transition: { type: "spring", stiffness: 400, damping: 32 },
    },
  },
} as const;

function Initials({ name, avatarUrl, dark }: { name: string; avatarUrl?: string | null; dark: boolean }) {
  const [imgFailed, setImgFailed] = useState(false);
  if (avatarUrl && !imgFailed) {
    return <img src={avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" onError={() => setImgFailed(true)} />;
  }
  const parts = name.trim().split(" ").filter(Boolean);
  const text = parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : (parts[0]?.[0] ?? "?");
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
      style={dark
        ? { background: "var(--surface-2)", color: "var(--text)" }
        : { background: "var(--hero-2)", color: "var(--text)" }
      }
    >
      {text.toUpperCase()}
    </div>
  );
}

interface Props {
  page: PageId;
  onNavigate: (page: PageId) => void;
  /** Mobile drawer: show close control and use full-height flex layout */
  onMobileClose?: () => void;
}

const NAV_MAIN: { id: PageId; label: string; icon: typeof LayoutGrid }[] = [
  { id: "home", label: "All Apps", icon: LayoutGrid },
  { id: "insights", label: "Insights", icon: BarChart3 },
  { id: "calendar", label: "Calendar", icon: CalendarIcon },
  { id: "activity", label: "Activity", icon: Zap },
];

export default function Sidebar({ page, onNavigate, onMobileClose }: Props) {
  const { user, signOut } = useAuth();
  const { apps, history } = useApps();
  const { prefs } = usePrefs();
  const dark = prefs.theme === "dark";
  const [editProfile, setEditProfile] = useState(false);
  const country = prefs.country ?? "";

  const recent = useMemo(() => recentlyOpenedApps(apps, history, 3), [apps, history]);
  const renewals = useMemo(() => upcomingRenewalApps(apps, 3), [apps]);

  const navBtnStyle = (active: boolean): CSSProperties =>
    dark
      ? active
        ? {
            background: "var(--surface-2)",
            color: "var(--text)",
            borderLeft: "3px solid #6B8F71",
            paddingLeft: "calc(0.75rem - 3px)",
          }
        : { color: "var(--text-muted)" }
      : active
        ? { background: "#ffffff", color: "#2E4332", boxShadow: "0 1px 3px rgba(31,36,33,.08)" }
        : { color: "var(--text-muted)" };

  const isMobileDrawer = Boolean(onMobileClose);

  const scrollBody = (
    <>
      {onMobileClose ? (
        <DrawerBlock isMobileDrawer={isMobileDrawer}>
          <div className="mb-3 flex items-center justify-end md:hidden">
            <button
              type="button"
              onClick={onMobileClose}
              className="grid h-9 w-9 place-items-center rounded-lg transition hover:opacity-80"
              style={{ color: "var(--text-muted)" }}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
        </DrawerBlock>
      ) : null}
      <DrawerBlock isMobileDrawer={isMobileDrawer}>
        <button
          type="button"
          className="mb-4 flex w-full items-center gap-2.5 px-2 text-left"
          {...(isMobileDrawer
            ? tapOnlyHandlers(() => onNavigate("home"))
            : { onClick: () => onNavigate("home") })}
        >
          <HeroLogo className="h-9 w-9 rounded-xl object-cover" />
          <span className="text-lg font-semibold tracking-tight" style={{ color: dark ? "#ffffff" : "var(--text)" }}>
            Remio
          </span>
        </button>
      </DrawerBlock>

      <SidebarNav isMobileDrawer={isMobileDrawer}>
        {NAV_MAIN.map(({ id, label, icon: Icon }, i) => {
          const active = page === id;
          return (
            <NavButton
              key={id}
              active={active}
              dark={dark}
              delay={i * 0.04}
              drawerItem={isMobileDrawer}
              onClick={() => onNavigate(id)}
              useTapGuard={isMobileDrawer}
              style={navBtnStyle(active)}
              icon={<Icon size={19} style={{ color: dark ? (active ? "#6B8F71" : "var(--text-muted)") : undefined }} />}
              label={label}
            />
          );
        })}
        <DrawerBlock isMobileDrawer={isMobileDrawer}>
          <div className="my-2 h-px mx-2" style={{ background: "var(--line)" }} />
        </DrawerBlock>
        <NavButton
          active={page === "settings"}
          dark={dark}
          delay={0.2}
          drawerItem={isMobileDrawer}
          onClick={() => onNavigate("settings")}
          useTapGuard={isMobileDrawer}
          style={navBtnStyle(page === "settings")}
          icon={<Settings size={19} style={{ color: dark ? (page === "settings" ? "#6B8F71" : "var(--text-muted)") : undefined }} />}
          label="Settings"
        />
      </SidebarNav>

      <DrawerBlock isMobileDrawer={isMobileDrawer}>
        <SidebarSection label="Recently opened" className="mt-5">
          {recent.length === 0 ? (
            <p className="px-2 text-xs" style={{ color: "var(--text-muted)" }}>No recent opens</p>
          ) : (
            <ul className="space-y-1">
              {recent.map((a) => {
                const ts = lastOpenedAt(a.id, history, a.lastOpened);
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition hover:opacity-90"
                      style={{ color: "var(--text)" }}
                      {...(isMobileDrawer
                        ? tapOnlyHandlers(() => onNavigate("home"))
                        : { onClick: () => onNavigate("home") })}
                    >
                      <BrandIcon slug={a.slug} color={a.color} size={16} iconKey={a.iconKey} className="shrink-0" />
                      <span className="min-w-0 flex-1 truncate font-medium">{a.name}</span>
                      <span className="shrink-0 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                        {sidebarOpenedShort(ts)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </SidebarSection>

        <SidebarSection label="Upcoming renewals" className="mt-4">
          {renewals.length === 0 ? (
            <p className="px-2 text-xs" style={{ color: "var(--text-muted)" }}>None in the next 7 days</p>
          ) : (
            <ul className="space-y-1">
              {renewals.map((a, i) => {
                const urgent = renewalUrgent(a.expiresAt!);
                const price = listRowPriceLabel(a, country);
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs transition"
                      {...(isMobileDrawer
                        ? tapOnlyHandlers(() => onNavigate("calendar"))
                        : { onClick: () => onNavigate("calendar") })}
                      style={
                        i === 0 && urgent
                          ? {
                              background: dark ? "var(--surface)" : "rgba(255,255,255,0.55)",
                              border: "1px solid var(--line)",
                              color: "var(--text)",
                            }
                          : { color: "var(--text-muted)" }
                      }
                    >
                      <span className="shrink-0">{i === 0 ? "•" : "·"}</span>
                      <span className="min-w-0 flex-1 truncate font-medium" style={{ color: "var(--text)" }}>
                        {a.name}
                      </span>
                      <span className="shrink-0 tabular-nums">{sidebarRenewalMonthDay(a.expiresAt!)}</span>
                      {price ? <span className="shrink-0 tabular-nums">{price}</span> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </SidebarSection>
      </DrawerBlock>
    </>
  );

  const footerBody = (
    <>
      <button
        type="button"
        onClick={signOut}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition"
        style={{ color: "var(--text-muted)" }}
      >
        <LogOut size={18} />
        <span>Log out</span>
      </button>

      {!user ? (
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="h-9 w-9 rounded-full animate-pulse" style={{ background: "var(--bg-deep)" }} />
          <div className="h-3 flex-1 rounded animate-pulse" style={{ background: "var(--bg-deep)" }} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditProfile(true)}
          className="group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition"
          aria-label="Edit profile"
        >
          <span className="relative">
            <Initials name={user.name} avatarUrl={user.avatar_url} dark={dark} />
            <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-sage-dark text-paper opacity-0 shadow-card transition group-hover:opacity-100">
              <Pencil size={9} />
            </span>
          </span>
          <span
            className="min-w-0 flex-1 truncate text-sm font-semibold"
            style={{ color: dark ? "#ffffff" : "var(--text)" }}
          >
            {user.name}
          </span>
        </button>
      )}
    </>
  );

  const scrollClass = "min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-6";
  const footerClass = "shrink-0 space-y-1 border-t px-4 pb-6 pt-3";

  return (
    <aside
      className={
        isMobileDrawer
          ? "relative flex h-full w-full flex-col overflow-hidden"
          : "hidden md:sticky md:top-0 md:flex md:h-screen md:max-h-screen md:w-[260px] md:shrink-0 md:flex-col md:overflow-hidden"
      }
      style={dark
        ? { background: "var(--bg-deep)", borderRight: "1px solid var(--line)" }
        : { background: "var(--hero)", borderRight: "1px solid var(--line)" }
      }
    >
      {isMobileDrawer ? (
        <motion.div
          className={scrollClass}
          variants={MOBILE_DRAWER_MOTION.container}
          initial="hidden"
          animate="show"
        >
          {scrollBody}
        </motion.div>
      ) : (
        <div className={scrollClass}>{scrollBody}</div>
      )}

      {isMobileDrawer ? (
        <motion.div
          className={footerClass}
          style={{ borderColor: "var(--line)" }}
          variants={MOBILE_DRAWER_MOTION.item}
          initial="hidden"
          animate="show"
        >
          {footerBody}
        </motion.div>
      ) : (
        <div className={footerClass} style={{ borderColor: "var(--line)" }}>
          {footerBody}
        </div>
      )}

      <ProfileEditorModal open={editProfile} onClose={() => setEditProfile(false)} />
    </aside>
  );
}

function DrawerBlock({ isMobileDrawer, children }: { isMobileDrawer: boolean; children: ReactNode }) {
  if (!isMobileDrawer) return <>{children}</>;
  return <motion.div variants={MOBILE_DRAWER_MOTION.item}>{children}</motion.div>;
}

function SidebarNav({ isMobileDrawer, children }: { isMobileDrawer: boolean; children: ReactNode }) {
  if (isMobileDrawer) {
    return (
      <motion.nav className="flex flex-col gap-0.5" variants={MOBILE_DRAWER_MOTION.container}>
        {children}
      </motion.nav>
    );
  }
  return <nav className="flex flex-col gap-0.5">{children}</nav>;
}

function SidebarSection({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <h2
        className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </h2>
      {children}
    </section>
  );
}

function NavButton({
  active,
  dark,
  delay,
  drawerItem,
  onClick,
  useTapGuard,
  style,
  icon,
  label,
}: {
  active: boolean;
  dark: boolean;
  delay: number;
  drawerItem?: boolean;
  onClick: () => void;
  useTapGuard?: boolean;
  style: CSSProperties;
  icon: ReactNode;
  label: string;
}) {
  const tap = useTapGuard ? tapOnlyHandlers(onClick) : { onClick };

  return (
    <motion.button
      type="button"
      {...tap}
      variants={drawerItem ? MOBILE_DRAWER_MOTION.item : undefined}
      initial={drawerItem ? undefined : { opacity: 0, x: -12 }}
      animate={drawerItem ? undefined : { opacity: 1, x: 0 }}
      transition={drawerItem ? undefined : { duration: 0.2, delay, ease: "easeOut" }}
      whileTap={useTapGuard ? undefined : { scale: 0.97 }}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition"
      style={style}
      onMouseEnter={(e) => {
        if (dark && !active) {
          (e.currentTarget as HTMLButtonElement).style.background = "var(--surface)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--text)";
        } else if (!dark && !active) {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(247,244,238,0.5)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--text)";
        }
      }}
      onMouseLeave={(e) => {
        if (dark && !active) {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
        } else if (!dark && !active) {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
        }
      }}
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  );
}
