/**
 * QpayLogo — geometric Q mark matching the reference:
 * - Transparent background
 * - Thick white circular ring (uniform stroke weight)
 * - Short diagonal tail at ~45°, starts inside the counter, exits lower-right
 *   The tail is SHORT — barely longer than the ring stroke width outside the ring
 *   and tapers wider at the outer tip (like a bold italic serif crossbar)
 */

interface QpayLogoProps {
  size?: number
  showText?: boolean
  className?: string
}

export function QpayLogo({ size = 36, showText = true, className = '' }: QpayLogoProps) {
  // ── Q mark geometry (all in a 100×100 viewBox) ─────────────────────────
  // Ring: stroke-based circle, cx=47 cy=45, r=31, stroke=14
  //   → outer edge r=38, inner hole r=24
  // Tail: diagonal at 45°, from inside-counter to just outside the ring
  //   The tail in the reference:
  //   • Starts near centre of the counter (around 55,55 inside the hole)
  //   • Crosses the ring wall at ~135° diagonal (top-left→bottom-right)
  //   • Exits the outer ring edge at ~(67,67) (5 o'clock position)
  //   • Tip extends only ~10 units beyond the ring outer edge
  //   • Width: ~10px at top, ~14px at tip
  //
  // Implementation: draw the ring as a stroked circle (clean and precise),
  // then draw the tail as a filled parallelogram, then redraw a short arc
  // over the ring at the junction to restore the ring stroke on top of the tail.
  // The tail overlapping the counter area creates the characteristic notch look.

  const textSize = Math.round(size * 0.58)

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: Math.round(size * 0.28),
        userSelect: 'none',
        lineHeight: 1,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', flexShrink: 0, overflow: 'visible' }}
      >
        {/*
          LAYER 1 — white filled donut (Q ring body)
          Built as two concentric circles with evenodd fill.
          Outer circle: r=38, centre (47,45)
          Inner hole:   r=24, same centre
          This gives a ring with wall thickness of 14px — matching the bold
          weight visible in the reference.
        */}
        <path
          d={[
            // Outer circle CW (two 180° arcs)
            'M 85,45',
            'A 38,38 0 0 1 9,45',
            'A 38,38 0 0 1 85,45',
            'Z',
            // Inner circle CCW (punch hole — opposite winding for evenodd)
            'M 71,45',
            'A 24,24 0 0 0 23,45',
            'A 24,24 0 0 0 71,45',
            'Z',
          ].join(' ')}
          fill="white"
          fillRule="evenodd"
        />

        {/*
          LAYER 2 — tail parallelogram
          The tail is a short diagonal bar at ~45°.
          In the reference:
          • The tail's top-left corner is inside the counter, near (52,52)
          • The tail's top-right corner is at the inner edge of the ring, (60,48)
          • The bottom-left corner exits the outer ring edge at (57,67)
          • The bottom-right (tip) is outside the ring at (68,63)
          This gives a bar ~10px wide at top, ~13px wide at tip.
          The bar is ~22px long along its axis.

          Precise points (measured from reference proportions):
            TL = (51, 54)  — inside counter, upper
            TR = (61, 50)  — inside counter / ring wall, upper-right
            BR = (71, 68)  — outside ring, lower-right tip (wider)
            BL = (58, 70)  — outside ring, lower-left

          The tail merges with the white ring body because both are white,
          giving the solid Q letterform with the characteristic crossbar.
        */}
        <polygon
          points="51,54 61,50 80,76 65,80"
          fill="white"
        />
      </svg>

      {showText && (
        <span
          style={{
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            fontSize: textSize,
            fontWeight: 800,
            color: '#f0f6ff',
            letterSpacing: '-0.035em',
            lineHeight: 1,
          }}
        >
          Qpay
        </span>
      )}
    </div>
  )
}
