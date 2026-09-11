/**
 * The visual layer for generated LinkedIn images.
 *
 * Pure element builders with no server or Next imports, so the same tree can be
 * rendered by `next/og` in production and by satori directly in the local
 * preview harness (`@vercel/og` cannot initialise on Windows, so rendering
 * through Next is not an option while iterating on design).
 *
 * Satori constraints worth remembering:
 * - `filter` is unsupported; use gradients for falloff.
 * - Every element with more than one child needs an explicit `display: flex`.
 * - There is no text measurement, so type scales step down by character count.
 */
import type { CardLayout } from "@/lib/linkedin-card";
import type { CarouselSlide } from "@/lib/admin-types";

/** 4:5 is the tallest ratio LinkedIn shows uncropped in the feed. */
export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

/**
 * One accent, three text tones, no chrome. The greys are Apple's system greys,
 * which hold their weight on a dark field better than pure-value greys.
 */
const C = {
  bg: "#08090a",
  text: "#f5f5f7",
  muted: "#86868b",
  dim: "#5b5b60",
  accent: "#00e07a",
  hairline: "rgba(245,245,247,0.10)",
};

const DISPLAY = "Inter Tight";
const TEXT = "Inter";

/**
 * Satori positions absolutely placed children against the padding box, not the
 * border box, so full-bleed layers have to cancel the shell padding by hand.
 */
const PAD_Y = 96;
const PAD_X = 92;

function headlineSize(text: string): number {
  if (text.length > 150) return 58;
  if (text.length > 110) return 68;
  if (text.length > 75) return 80;
  if (text.length > 45) return 94;
  return 110;
}

function Ambience() {
  return (
    <div
      style={{
        display: "flex",
        position: "absolute",
        top: -PAD_Y,
        left: -PAD_X,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        // Satori's gradient parser rejects the two-value size syntax
        // (`900px 620px at ...`), so keep to the shape + position form.
        background:
          "radial-gradient(circle at 8% 10%, rgba(0,224,122,0.13), rgba(8,9,10,0) 62%)",
      }}
    />
  );
}

function Artwork({ dataUri }: { dataUri: string }) {
  return (
    <>
      {/* Satori renders this element into the final PNG; next/image cannot be
          used inside an ImageResponse element tree. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dataUri}
        alt=""
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
        style={{
          position: "absolute",
          top: -PAD_Y,
          left: -PAD_X,
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          objectFit: "cover",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: -PAD_Y,
          left: -PAD_X,
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          background: "rgba(3,5,6,0.30)",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: -PAD_Y,
          left: -PAD_X,
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          background:
            "linear-gradient(180deg, rgba(3,5,6,0.66) 0%, rgba(3,5,6,0.14) 22%, rgba(3,5,6,0.48) 55%, rgba(3,5,6,0.96) 88%)",
        }}
      />
    </>
  );
}

function Eyebrow({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          width: 36,
          height: 4,
          borderRadius: 2,
          background: C.accent,
        }}
      />
      <span
        style={{
          fontFamily: TEXT,
          fontWeight: 500,
          fontSize: 21,
          letterSpacing: "0.18em",
          color: C.dim,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function Footer({ right }: { right: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 28,
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          height: 1,
          width: "100%",
          background: C.hairline,
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: TEXT,
            fontWeight: 500,
            fontSize: 26,
            color: C.muted,
          }}
        >
          Mazhar Hayat
        </span>
        <span
          style={{
            fontFamily: TEXT,
            fontWeight: 400,
            fontSize: 26,
            color: C.dim,
          }}
        >
          {right}
        </span>
      </div>
    </div>
  );
}

function Shell({
  eyebrow,
  footer,
  artworkDataUri,
  children,
}: {
  eyebrow: string;
  footer: string;
  artworkDataUri?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: C.bg,
        color: C.text,
        padding: `${PAD_Y}px ${PAD_X}px`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {artworkDataUri && <Artwork dataUri={artworkDataUri} />}
      <Ambience />
      <Eyebrow label={eyebrow} />
      {/* Anchored to the lower third: centring leaves the card looking as if
          the text landed there by accident. */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: "auto",
          paddingBottom: 84,
          position: "relative",
        }}
      >
        {children}
      </div>
      <Footer right={footer} />
    </div>
  );
}

function Headline({ text, size }: { text: string; size?: number }) {
  return (
    <span
      style={{
        fontFamily: DISPLAY,
        fontWeight: 700,
        fontSize: size ?? headlineSize(text),
        lineHeight: 1.04,
        letterSpacing: "-0.035em",
        color: C.text,
      }}
    >
      {text}
    </span>
  );
}

/**
 * "95%" should stay one large glyph run, but "2 days" set at the same size
 * reads like an accident and its descender crowds the label. Word units get
 * demoted to a baseline-aligned suffix; symbol units stay attached.
 */
function splitStat(stat: string): { value: string; unit: string } {
  const match = stat.trim().match(/^([\d.,]+)\s*(.*)$/);
  if (!match) return { value: stat.trim(), unit: "" };
  const [, value, rest] = match;
  return /^[%xÃ—+]+$/i.test(rest)
    ? { value: `${value}${rest}`, unit: "" }
    : { value, unit: rest };
}

function StatCard({ layout }: { layout: CardLayout }) {
  const { value, unit } = splitStat(layout.stat ?? "");
  const valueSize = value.length > 4 ? 230 : value.length > 3 ? 270 : 300;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 24 }}>
        <span
          style={{
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: valueSize,
            lineHeight: 1,
            letterSpacing: "-0.05em",
            color: C.text,
          }}
        >
          {value}
        </span>
        {unit && (
          <span
            style={{
              fontFamily: DISPLAY,
              fontWeight: 700,
              fontSize: 92,
              lineHeight: 1,
              letterSpacing: "-0.03em",
              paddingBottom: Math.round(valueSize * 0.09),
              color: C.muted,
            }}
          >
            {unit}
          </span>
        )}
      </div>
      <span
        style={{
          fontFamily: TEXT,
          fontWeight: 400,
          fontSize: 46,
          lineHeight: 1.25,
          letterSpacing: "-0.01em",
          color: C.muted,
        }}
      >
        {layout.headline}
      </span>
    </div>
  );
}

function ChecklistCard({ layout }: { layout: CardLayout }) {
  const points = layout.points ?? [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
      <Headline text={layout.headline} size={66} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        {points.map((point, index) => (
          <div
            key={point}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 30,
              paddingTop: 28,
              paddingBottom: 28,
              borderTop: index === 0 ? "none" : `1px solid ${C.hairline}`,
            }}
          >
            <span
              style={{
                display: "flex",
                fontFamily: TEXT,
                fontWeight: 500,
                fontSize: 23,
                paddingTop: 10,
                color: C.accent,
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <span
              style={{
                display: "flex",
                fontFamily: TEXT,
                fontWeight: 400,
                fontSize: 38,
                lineHeight: 1.3,
                letterSpacing: "-0.01em",
                color: C.text,
              }}
            >
              {point}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComparisonCard({ layout }: { layout: CardLayout }) {
  const columns = [
    { ...layout.left!, tone: C.muted },
    { ...layout.right!, tone: C.accent },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
      <Headline text={layout.headline} size={62} />
      <div style={{ display: "flex", gap: 56 }}>
        {columns.map((column) => (
          <div
            key={column.title}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 24,
              flex: 1,
              borderTop: `3px solid ${column.tone}`,
              paddingTop: 28,
            }}
          >
            <span
              style={{
                fontFamily: TEXT,
                fontWeight: 500,
                fontSize: 21,
                letterSpacing: "0.18em",
                color: column.tone,
              }}
            >
              {column.title.toUpperCase()}
            </span>
            <span
              style={{
                fontFamily: TEXT,
                fontWeight: 400,
                fontSize: 34,
                lineHeight: 1.32,
                letterSpacing: "-0.01em",
                color: C.text,
              }}
            >
              {column.body}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardBody({ layout }: { layout: CardLayout }) {
  switch (layout.template) {
    case "stat":
      return <StatCard layout={layout} />;
    case "checklist":
      return <ChecklistCard layout={layout} />;
    case "comparison":
      return <ComparisonCard layout={layout} />;
    default:
      return <Headline text={layout.headline} />;
  }
}

export function cardElement(
  layout: CardLayout,
  artworkDataUri?: string,
): React.ReactElement {
  return (
    <Shell
      eyebrow={layout.kicker}
      footer={layout.footer}
      artworkDataUri={artworkDataUri}
    >
      <CardBody layout={layout} />
    </Shell>
  );
}

function slideBodySize(text: string): number {
  if (text.length > 260) return 34;
  if (text.length > 160) return 39;
  return 44;
}

export function slideElement(
  slide: CarouselSlide,
  index: number,
  total: number,
): React.ReactElement {
  const isCover = index === 0;
  const isLast = index === total - 1;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: C.bg,
        color: C.text,
        padding: `${PAD_Y}px ${PAD_X}px`,
        position: "relative",
      }}
    >
      <Ambience />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Eyebrow
          label={isCover ? "MAZHAR HAYAT" : "AI & SOFTWARE ENGINEERING"}
        />
        {!isCover && (
          <span
            style={{
              fontFamily: TEXT,
              fontWeight: 500,
              fontSize: 21,
              letterSpacing: "0.14em",
              color: C.dim,
            }}
          >
            {String(index + 1).padStart(2, "0")} â€”{" "}
            {String(total).padStart(2, "0")}
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 38,
          marginTop: "auto",
          paddingBottom: 84,
        }}
      >
        <span
          style={{
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: isCover ? headlineSize(slide.title) : 66,
            lineHeight: 1.04,
            letterSpacing: "-0.035em",
          }}
        >
          {slide.title}
        </span>
        <span
          style={{
            fontFamily: TEXT,
            fontWeight: 400,
            fontSize: slideBodySize(slide.body),
            lineHeight: 1.38,
            letterSpacing: "-0.01em",
            color: C.muted,
          }}
        >
          {slide.body}
        </span>
      </div>

      <Footer right={isLast ? "mazharhayat.live" : "Swipe â†’"} />
    </div>
  );
}
