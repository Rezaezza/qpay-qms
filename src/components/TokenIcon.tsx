/**
 * TokenIcon — official token logos as inline SVG
 * QMS  : purple rounded-square with bracket/frame mark
 * USDT : Tether green circle with T + ellipse
 * USDC : Circle blue coin with C-dollar mark
 */

interface TokenIconProps {
  symbol: string
  size?: number
  className?: string
}

export function TokenIcon({ symbol, size = 32, className }: TokenIconProps) {
  const s = size
  const r = Math.round(s * 0.22) // border-radius for rounded-square

  switch (symbol.toUpperCase()) {

    /* ── QMS ──────────────────────────────────────────────────────────────
       Purple rounded-square, white bracket/frame: a hollow square ring with
       4 notches (top-centre, bottom-centre, left-centre, right-centre).
       The mark is a rounded rectangle outline with rectangular cuts.
    ─────────────────────────────────────────────────────────────────────── */
    case 'QMS': {
      // All coords in a 100×100 viewBox, scaled to `size`
      // Outer rounded square bg: full viewBox
      // The mark: a square frame (outer 70×70, inner 42×42, centred at 50,50)
      // Notches: 4 rectangular cuts, each 10 wide × 8 tall, on mid-edges
      const mark = `
        M 15,15 H 85 V 85 H 15 Z
        M 27,27 H 73 V 73 H 27 Z
      `
      // Frame = outer rect MINUS inner rect (evenodd) MINUS 4 notches
      // Build notch cuts as separate filled rects on top
      return (
        <svg
          width={s} height={s}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          style={{ display: 'block', flexShrink: 0, borderRadius: r }}
        >
          {/* Background */}
          <rect width="100" height="100" rx={r * (100 / s)} fill="#6C5CE7" />

          {/* Frame ring: outer square minus inner square (evenodd) */}
          <path
            d={mark}
            fill="white"
            fillRule="evenodd"
          />

          {/* Top notch: cut into the top edge of the frame */}
          <rect x="44" y="14" width="12" height="9" fill="#6C5CE7" />
          {/* Bottom notch */}
          <rect x="44" y="77" width="12" height="9" fill="#6C5CE7" />
          {/* Left notch */}
          <rect x="14" y="44" width="9" height="12" fill="#6C5CE7" />
          {/* Right notch */}
          <rect x="77" y="44" width="9" height="12" fill="#6C5CE7" />
        </svg>
      )
    }

    /* ── USDT ─────────────────────────────────────────────────────────────
       Tether: green circle, white T-letterform + horizontal ellipse ring.
       T bar: wide rectangle across top third.
       T stem: narrow rectangle from bar centre to bottom.
       Ellipse ring: hollow ellipse (stroke) crossing mid-stem.
    ─────────────────────────────────────────────────────────────────────── */
    case 'USDT': {
      return (
        <svg
          width={s} height={s}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          style={{ display: 'block', flexShrink: 0 }}
        >
          {/* Green circle */}
          <circle cx="50" cy="50" r="50" fill="#26A17B" />

          {/* T horizontal bar: x 16→84, y 20→33 */}
          <rect x="16" y="20" width="68" height="13" rx="3" fill="white" />

          {/* T vertical stem: x 43→57, y 20→78 */}
          <rect x="43" y="20" width="14" height="58" rx="2" fill="white" />

          {/* Ellipse ring (hollow): centred at 50,57, rx=26 ry=8, stroke white 5px */}
          <ellipse cx="50" cy="57" rx="26" ry="8"
            fill="#26A17B"
            stroke="white"
            strokeWidth="5"
          />
        </svg>
      )
    }

    /* ── USDC ─────────────────────────────────────────────────────────────
       Official Circle USDC logo: blue circle, white USDC text mark.
       The canonical logo is a blue disc with a white bold "USDC" wordmark,
       but at small icon sizes Circle renders it as a blue circle with a
       white stylised dollar/C letterform — a thick open arc (C-shape) with
       two small horizontal serifs at top and bottom of the opening.
    ─────────────────────────────────────────────────────────────────────── */
    case 'USDC': {
      // Official USDC logo:
      // - Blue circle bg #2775CA
      // - Outer white ring (full circle stroke)
      // - Left bracket arc: from ~210° to ~150° going counter-clockwise (i.e. left half with gaps)
      // - Right bracket arc: from ~30° to ~330° going clockwise (right half with gaps)
      // - White $ sign in centre
      //
      // In SVG angles: 0°=right, 90°=down, 180°=left, 270°=up
      // Left arc: from 120° to 240° (bottom-left to top-left, the left bracket)
      // Right arc: from 300° to 60° (bottom-right to top-right, the right bracket)
      // Each arc has rounded caps and gap at top and bottom
      //
      // Arc helper: cx cy r startDeg endDeg → SVG arc path (large-arc if span>180)
      // Left bracket: 120°→240° = 120° span, rx=ry=28, centre 50,50
      // Converted to radians then to x,y coords:
      //   120° → x=50+28*cos(120°)=50-14=36,  y=50+28*sin(120°)=50+24.2=74.2
      //   240° → x=50+28*cos(240°)=50-14=36,  y=50+28*sin(240°)=50-24.2=25.8
      // Right bracket: 300°→60° = 120° span
      //   300° → x=50+28*cos(300°)=50+14=64,  y=50+28*sin(300°)=50-24.2=25.8
      //    60° → x=50+28*cos(60°) =50+14=64,  y=50+28*sin(60°) =50+24.2=74.2
      return (
        <svg
          width={s} height={s}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          style={{ display: 'block', flexShrink: 0 }}
        >
          {/* 1. Blue circle background */}
          <circle cx="50" cy="50" r="50" fill="#2775CA" />

          {/* 2. Outer white ring */}
          <circle cx="50" cy="50" r="44" fill="none" stroke="white" strokeWidth="5" />

          {/* 3. Left bracket arc — from 120° to 240°, r=28
               Start: (36.0, 74.2)  End: (36.0, 25.8)  — sweep CCW (large arc=0, sweep=0) */}
          <path
            d="M 36.0,74.2 A 28,28 0 0 1 36.0,25.8"
            stroke="white"
            strokeWidth="6.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* 4. Right bracket arc — from 300° to 60°, r=28
               Start: (64.0, 25.8)  End: (64.0, 74.2)  — sweep CW (large arc=0, sweep=1) */}
          <path
            d="M 64.0,25.8 A 28,28 0 0 1 64.0,74.2"
            stroke="white"
            strokeWidth="6.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* 5. Dollar sign $ as a text glyph — bold, white, centred */}
          <text
            x="50"
            y="58"
            textAnchor="middle"
            fontSize="36"
            fontWeight="900"
            fontFamily="Arial, Helvetica, sans-serif"
            fill="white"
          >$</text>
        </svg>
      )
    }

    /* ── Generic fallback ─────────────────────────────────────────────── */
    default: {
      const letter = symbol.charAt(0).toUpperCase()
      return (
        <svg
          width={s} height={s}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          style={{ display: 'block', flexShrink: 0 }}
        >
          <circle cx="50" cy="50" r="50" fill="#1e3a5f" />
          <text
            x="50" y="66"
            textAnchor="middle"
            fontSize="48"
            fontWeight="800"
            fontFamily="system-ui, sans-serif"
            fill="white"
          >
            {letter}
          </text>
        </svg>
      )
    }
  }
}
