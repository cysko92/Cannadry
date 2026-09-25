/**
 * Layered coastal mountain ridgelines with a fog band.
 * Decorative only (aria-hidden). Original artwork.
 */
export function Ridgeline({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className={`block h-40 w-full md:h-56 ${className}`}
    >
      <defs>
        <linearGradient id="cd-fog" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f5f3ee" stopOpacity="0" />
          <stop offset="1" stopColor="#f5f3ee" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <path
        fill="#e4e1d9"
        d="M0 210 C60 196 90 170 140 168 C190 166 220 188 270 176 C330 160 350 118 410 112 C470 106 500 150 560 146 C620 142 650 96 720 90 C790 84 820 136 880 138 C940 140 980 104 1040 100 C1100 96 1130 132 1190 130 C1250 128 1290 100 1350 104 C1400 108 1420 122 1440 126 L1440 320 L0 320 Z"
      />
      <rect x="0" y="120" width="1440" height="110" fill="url(#cd-fog)" />
      <path
        fill="#cfcac0"
        d="M0 238 C70 226 110 200 170 204 C230 208 250 232 310 226 C370 220 400 176 470 172 C540 168 570 214 640 216 C710 218 740 184 800 182 C860 180 900 220 960 222 C1020 224 1060 190 1130 186 C1200 182 1240 214 1300 216 C1360 218 1400 204 1440 200 L1440 320 L0 320 Z"
      />
      <rect x="0" y="200" width="1440" height="70" fill="url(#cd-fog)" />
      <path
        fill="#7a8b6f"
        fillOpacity="0.55"
        d="M0 268 C80 258 120 240 190 244 C260 248 300 270 370 266 C440 262 480 236 560 238 C640 240 680 268 760 270 C840 272 880 246 960 244 C1040 242 1080 266 1160 268 C1240 270 1290 250 1360 250 C1400 250 1420 256 1440 258 L1440 320 L0 320 Z"
      />
      <path
        fill="#1f3a2e"
        d="M0 296 C90 288 150 280 230 284 C310 288 360 300 450 298 C540 296 600 282 690 282 C780 282 840 298 930 298 C1020 298 1080 284 1170 284 C1260 284 1330 294 1440 290 L1440 320 L0 320 Z"
      />
    </svg>
  );
}
