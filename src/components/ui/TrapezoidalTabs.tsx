import {
  useEffect,
  useState,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Trapezoidal Tab Shape Constants
// ─────────────────────────────────────────────────────────────────────────────

/** How much narrower the top edge is than the bottom (px) — creates the slant */
const TOP_INSET = 14;

/** Top corner radius for smooth rounded corners */
const TOP_R = 8;

/** Negative margin overlap between adjacent tabs (px) - value used in TAB_OVERLAP_CLASS */
const TAB_OVERLAP_CLASS = "-ml-[18px]";

/** Tab heights (expanded vs collapsed states) */
const TAB_HEIGHT = { expanded: 48, collapsed: 32 };

/** Minimum tab width */
const TAB_MIN_WIDTH = 100;

// ─────────────────────────────────────────────────────────────────────────────
// Color Constants (mapped to cb-slg-prototype design system)
// ─────────────────────────────────────────────────────────────────────────────

/** Colors from the design system */
const COLORS = {
  brandNavy: "#1c1b2e",
  neutral100: "#f4f4f8",
  hoverBg: "#e8e8f0",
  /** Highlight fill used for the Tasks tab in customer scenarios. */
  taskYellow: "#f4d562",
};

// ─────────────────────────────────────────────────────────────────────────────
// SVG Path Construction
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds the SVG path for a trapezoidal tab — narrower at top, wider at bottom.
 * The path is OPEN (no Z) so the stroke doesn't render on the bottom edge.
 * Uses quadratic curves for smooth top corner fillets.
 *
 * For inactive tabs, we end the path 1px above the bottom so the horizontal line shows through.
 * For active tabs, the path extends to the full height to cover the horizontal line.
 */
function buildTabPath(W: number, H: number, inset = TOP_INSET, R = TOP_R, active = true): string {
  const bottomY = active ? H : H - 1;
  const L = Math.sqrt(inset * inset + H * H);
  const ux = inset / L;
  const uy = H / L;

  // Calculate the X offset for the 1px shorter inactive tabs
  const xOffset = active ? 0 : (1 * inset) / H;

  return [
    `M ${xOffset} ${bottomY}`,
    `L ${inset - R * ux} ${R * uy}`,
    `Q ${inset} 0 ${inset + R} 0`,
    `L ${W - inset - R} 0`,
    `Q ${W - inset} 0 ${W - inset + R * ux} ${R * uy}`,
    `L ${W - xOffset} ${bottomY}`,
  ].join(" ");
}

// ─────────────────────────────────────────────────────────────────────────────
// TabSVG Component
// ─────────────────────────────────────────────────────────────────────────────

interface TabSVGProps {
  width: number;
  height: number;
  active: boolean;
  hovered?: boolean;
  tone?: "default" | "yellow";
}

function TabSVG({ width, height, active, hovered, tone = "default" }: TabSVGProps) {
  if (width < 10 || height < 10) return null;

  const path = buildTabPath(width, height, TOP_INSET, TOP_R, active);
  const highlighted = tone === "yellow";

  const fill = highlighted
    ? COLORS.taskYellow
    : active
      ? COLORS.brandNavy
      : hovered
        ? COLORS.hoverBg
        : COLORS.neutral100;

  const stroke = COLORS.brandNavy;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      <path
        d={path}
        fill={fill}
        stroke={stroke}
        strokeWidth={1}
        style={{ transition: "fill 160ms ease, stroke 160ms ease" }}
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab Button Component
// ─────────────────────────────────────────────────────────────────────────────

/** Presence timing — width, overlap and fade share one curve so neighbours glide together. */
const PRESENCE_MS = 560;
const PRESENCE_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const OVERLAP_PX = 18;

interface TabPresence {
  phase: "idle" | "enter" | "leave";
  delay: number;
  loading: boolean;
  onSettled: () => void;
}

interface TabButtonProps {
  label: string;
  active: boolean;
  first: boolean;
  zIndex: number;
  compact?: boolean;
  tone?: "default" | "yellow";
  presence?: TabPresence;
  onClick: () => void;
}

function TabButton({
  label,
  active,
  first,
  zIndex,
  compact = false,
  tone = "default",
  presence,
  onClick,
}: TabButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const innerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [tabSize, setTabSize] = useState({ w: 0, h: 0 });
  const [open, setOpen] = useState(presence?.phase !== "enter");
  const settledRef = useRef(presence?.onSettled);
  settledRef.current = presence?.onSettled;

  const tabHeight = compact ? TAB_HEIGHT.collapsed : TAB_HEIGHT.expanded;
  const hasPresence = !!presence;
  const phase = presence?.phase ?? "idle";
  const delay = presence?.delay ?? 0;

  useLayoutEffect(() => {
    if (!innerRef.current) return;

    const measure = () => {
      if (!innerRef.current) return;
      if (hasPresence) {
        // offset* ignores the presence scale transform; getBoundingClientRect would shrink the shape.
        const { offsetWidth, offsetHeight } = innerRef.current;
        if (offsetWidth > 0 && offsetHeight > 0) {
          setTabSize({ w: offsetWidth, h: offsetHeight });
        }
        return;
      }
      const rect = innerRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setTabSize({ w: rect.width, h: rect.height });
      }
    };

    measure();
    if (!hasPresence) {
      requestAnimationFrame(measure);
      return;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(innerRef.current);
    return () => observer.disconnect();
  }, [label, compact, hasPresence]);

  useLayoutEffect(() => {
    if (phase === "idle") {
      setOpen(true);
      return;
    }
    // Flush the starting width so the flip to the target width transitions instead of snapping.
    wrapperRef.current?.getBoundingClientRect();
    setOpen(phase === "enter");
    const timer = window.setTimeout(() => settledRef.current?.(), PRESENCE_MS + delay + 40);
    return () => window.clearTimeout(timer);
  }, [phase, delay]);

  const loading = !!presence?.loading && !active;
  const width = presence ? (open ? (tabSize.w || undefined) : 0) : undefined;
  const marginLeft = first ? 0 : open ? -OVERLAP_PX : 0;
  const transition = presence
    ? [
        `width ${PRESENCE_MS}ms ${PRESENCE_EASE} ${delay}ms`,
        `margin-left ${PRESENCE_MS}ms ${PRESENCE_EASE} ${delay}ms`,
        `opacity ${open ? 380 : 260}ms ease ${open ? delay + 140 : delay}ms`,
        `transform ${PRESENCE_MS}ms ${PRESENCE_EASE} ${delay}ms`,
        `filter ${PRESENCE_MS}ms ${PRESENCE_EASE} ${delay}ms`,
        `height 300ms ease-out`,
      ].join(", ")
    : undefined;

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "group/tab relative shrink-0",
        !presence && "transition-[height] duration-300 ease-out",
        !presence && !first && TAB_OVERLAP_CLASS
      )}
      style={{
        zIndex: active ? 100 : zIndex,
        height: tabHeight,
        ...(presence
          ? {
              width,
              marginLeft,
              overflow: phase === "idle" ? "visible" : "hidden",
              opacity: open ? 1 : 0,
              transform: open ? "translateY(0) scale(1)" : "translateY(6px) scale(0.96)",
              transformOrigin: "bottom center",
              filter: open ? "blur(0)" : "blur(2px)",
              pointerEvents: phase === "leave" || loading ? "none" : undefined,
              transition,
            }
          : null),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={innerRef}
        role="tab"
        tabIndex={0}
        aria-busy={loading || undefined}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onClick();
        }}
        className={cn(
          "relative inline-flex items-center justify-center cursor-pointer transition-[height] duration-300 ease-out",
          `min-w-[${TAB_MIN_WIDTH}px]`,
        )}
        style={{
          height: tabHeight,
          minWidth: TAB_MIN_WIDTH,
        }}
      >
        <TabSVG
          width={tabSize.w}
          height={tabSize.h}
          active={active}
          hovered={isHovered && !loading}
          tone={tone}
        />

        <span
          className={cn(
            "relative z-[2] px-6 whitespace-nowrap uppercase",
            hasPresence ? "transition-opacity duration-300" : "transition-all duration-200",
            "text-[12px] tracking-[-0.5px]",
            loading && "opacity-0",
            active && tone === "yellow"
              ? "font-bold text-brand-navy"
              : active
                ? "font-bold text-white"
                : "font-medium text-brand-navy group-hover/tab:text-brand-navy"
          )}
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {label}
        </span>

        {hasPresence ? (
          <span
            aria-hidden="true"
            className={cn(
              "c360-tab-skeleton pointer-events-none absolute left-1/2 top-1/2 z-[2] h-2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-300",
              loading ? "opacity-100" : "opacity-0"
            )}
            style={{ width: Math.max(28, tabSize.w - 60) }}
          />
        ) : null}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TrapezoidalTabs Container
// ─────────────────────────────────────────────────────────────────────────────

export interface TabItem {
  id: string;
  label: string;
  /** Yellow stays filled with navy text whether or not the tab is selected. */
  tone?: "default" | "yellow";
}

interface TrapezoidalTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  compact?: boolean;
  className?: string;
  /** Folds tabs in and out when the set changes. Off for every other caller. */
  animatePresence?: boolean;
  children?: ReactNode;
}

type ShownTab = TabItem & { phase: "idle" | "enter" | "leave"; delay?: number };

/** Leaving tabs fold in toward Tasks from the outside; entering tabs unfold outward from it. */
function staggerTabs(tabs: ShownTab[]): ShownTab[] {
  const tasksIndex = tabs.findIndex((tab) => tab.id === "tasks");
  const anchor = tasksIndex === -1 ? 0 : tasksIndex;
  const maxDistance = tabs.reduce(
    (furthest, _tab, index) => Math.max(furthest, Math.abs(index - anchor)),
    0
  );
  return tabs.map((tab, index) => {
    const distance = Math.abs(index - anchor);
    if (tab.phase === "leave") return { ...tab, delay: (maxDistance - distance) * 40 };
    if (tab.phase === "enter") return { ...tab, delay: 120 + distance * 60 };
    return { ...tab, delay: 0 };
  });
}

function reconcileTabs(previous: ShownTab[], next: TabItem[]): ShownTab[] {
  const nextIds = next.map((tab) => tab.id);
  const nextById = new Map(next.map((tab) => [tab.id, tab]));
  const previousById = new Map(previous.map((tab) => [tab.id, tab]));
  const order = previous.map((tab) => tab.id);

  nextIds.forEach((id, index) => {
    if (order.includes(id)) return;
    let insertAt = order.length;
    for (let cursor = index + 1; cursor < nextIds.length; cursor += 1) {
      const position = order.indexOf(nextIds[cursor]);
      if (position !== -1) {
        insertAt = position;
        break;
      }
    }
    order.splice(insertAt, 0, id);
  });

  return order.flatMap((id): ShownTab[] => {
    const fresh = nextById.get(id);
    const prior = previousById.get(id);
    if (!fresh) {
      return prior ? [{ ...prior, phase: "leave" }] : [];
    }
    if (!prior || prior.phase === "leave") {
      return [{ ...fresh, phase: "enter" }];
    }
    return [{ ...fresh, phase: prior.phase === "enter" ? "enter" : "idle" }];
  });
}

/** How long surviving tabs show the skeleton before the new set swaps in. */
export const TAB_LOADING_MS = 2000;

const TAB_PRESENCE_STYLES = `
.c360-tab-skeleton {
  background: linear-gradient(90deg, rgba(28,27,46,0.08) 0%, rgba(28,27,46,0.18) 50%, rgba(28,27,46,0.08) 100%);
  background-size: 200% 100%;
  animation: c360-tab-shimmer 1.2s ease-in-out infinite;
}
@keyframes c360-tab-shimmer {
  from { background-position: 100% 0; }
  to { background-position: -100% 0; }
}
`;

export function TrapezoidalTabs({
  tabs,
  activeTab,
  onTabChange,
  compact = false,
  className,
  animatePresence = false,
}: TrapezoidalTabsProps) {
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;
  const signature = tabs.map((tab) => tab.id).join("|");
  const labelSignature = tabs.map((tab) => `${tab.id}:${tab.label}:${tab.tone ?? ""}`).join("|");
  const [shown, setShown] = useState<ShownTab[]>(() =>
    tabs.map((tab) => ({ ...tab, phase: "idle" }))
  );
  const [loading, setLoading] = useState(false);
  const lastSignatureRef = useRef(signature);

  useEffect(() => {
    if (!animatePresence) return;
    if (signature === lastSignatureRef.current) return;
    lastSignatureRef.current = signature;
    setLoading(true);
    const timer = window.setTimeout(() => {
      setLoading(false);
      setShown((previous) => staggerTabs(reconcileTabs(previous, tabsRef.current)));
    }, TAB_LOADING_MS);
    return () => window.clearTimeout(timer);
  }, [animatePresence, signature]);

  useEffect(() => {
    if (!animatePresence) return;
    const byId = new Map(tabsRef.current.map((tab) => [tab.id, tab]));
    setShown((previous) =>
      previous.map((tab) => {
        const fresh = byId.get(tab.id);
        return fresh ? { ...tab, label: fresh.label, tone: fresh.tone } : tab;
      })
    );
  }, [animatePresence, labelSignature]);

  const settle = (id: string, phase: "enter" | "leave") => {
    setShown((previous) => {
      if (phase === "leave") return previous.filter((tab) => tab.id !== id);
      return previous.map((tab) =>
        tab.id === id && tab.phase === "enter" ? { ...tab, phase: "idle", delay: 0 } : tab
      );
    });
  };

  const rendered: ShownTab[] = animatePresence
    ? shown
    : tabs.map((tab) => ({ ...tab, phase: "idle", delay: 0 }));
  const firstVisibleIndex = rendered.findIndex((tab) => tab.phase !== "leave");

  return (
    <div
      className={cn("flex items-end justify-center", className)}
      role="tablist"
    >
      {animatePresence ? <style>{TAB_PRESENCE_STYLES}</style> : null}
      {rendered.map((tab, index) => {
        const delay = tab.delay ?? 0;
        const phase = tab.phase;
        return (
          <TabButton
            key={tab.id}
            label={tab.label}
            active={activeTab === tab.id}
            tone={tab.tone}
            first={animatePresence ? index === firstVisibleIndex || index === 0 : index === 0}
            zIndex={rendered.length - index}
            compact={compact}
            presence={
              animatePresence
                ? {
                    phase,
                    delay,
                    loading,
                    onSettled: () => {
                      if (phase !== "idle") settle(tab.id, phase);
                    },
                  }
                : undefined
            }
            onClick={() => onTabChange(tab.id)}
          />
        );
      })}
    </div>
  );
}

export default TrapezoidalTabs;
