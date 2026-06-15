import {
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
}

function TabSVG({ width, height, active, hovered }: TabSVGProps) {
  if (width < 10 || height < 10) return null;

  const path = buildTabPath(width, height, TOP_INSET, TOP_R, active);

  const fill = active
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

interface TabButtonProps {
  label: string;
  active: boolean;
  first: boolean;
  zIndex: number;
  compact?: boolean;
  onClick: () => void;
}

function TabButton({
  label,
  active,
  first,
  zIndex,
  compact = false,
  onClick,
}: TabButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const innerRef = useRef<HTMLDivElement>(null);
  const [tabSize, setTabSize] = useState({ w: 0, h: 0 });

  const tabHeight = compact ? TAB_HEIGHT.collapsed : TAB_HEIGHT.expanded;

  useLayoutEffect(() => {
    if (!innerRef.current) return;

    const measure = () => {
      if (!innerRef.current) return;
      const rect = innerRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setTabSize({ w: rect.width, h: rect.height });
      }
    };

    measure();
    requestAnimationFrame(measure);
  }, [label, compact]);

  return (
    <div
      className={cn(
        "group/tab relative shrink-0 transition-[height] duration-300 ease-out",
        !first && TAB_OVERLAP_CLASS
      )}
      style={{
        zIndex: active ? 100 : zIndex,
        height: tabHeight,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={innerRef}
        role="tab"
        tabIndex={0}
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
          hovered={isHovered}
        />

        <span
          className={cn(
            "relative z-[2] px-6 whitespace-nowrap uppercase transition-all duration-200",
            "text-[12px] tracking-[-0.5px]",
            active
              ? "font-bold text-white"
              : "font-normal text-brand-navy group-hover/tab:text-brand-navy"
          )}
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {label}
        </span>
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
}

interface TrapezoidalTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  compact?: boolean;
  className?: string;
  children?: ReactNode;
}

export function TrapezoidalTabs({
  tabs,
  activeTab,
  onTabChange,
  compact = false,
  className,
}: TrapezoidalTabsProps) {
  return (
    <div
      className={cn("flex items-end justify-center", className)}
      role="tablist"
    >
      {tabs.map((tab, index) => (
        <TabButton
          key={tab.id}
          label={tab.label}
          active={activeTab === tab.id}
          first={index === 0}
          zIndex={tabs.length - index}
          compact={compact}
          onClick={() => onTabChange(tab.id)}
        />
      ))}
    </div>
  );
}

export default TrapezoidalTabs;
