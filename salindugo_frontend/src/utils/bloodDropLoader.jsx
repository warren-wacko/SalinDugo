export default function BloodDropLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      {/* Main loader container */}
      <div className="relative w-32 h-40">
        {/* Outer glow effect */}
        <div className="absolute inset-0 animate-pulse">
          <div className="w-full h-full rounded-full bg-gradient-to-b from-destructive/30 to-destructive/10 blur-2xl" />
        </div>

        {/* Heart container */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Animated heart */}
          <svg
            className="w-24 h-24 animate-bounce"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient
                id="heartGradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#dc2626" stopOpacity="1" />
                <stop offset="100%" stopColor="#991b1b" stopOpacity="1" />
              </linearGradient>
              <filter
                id="heartShadow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feDropShadow
                  dx="0"
                  dy="4"
                  stdDeviation="6"
                  floodOpacity="0.3"
                />
              </filter>
            </defs>

            {/* Heart shape */}
            <path
              d="M50 85 C20 65, 5 50, 5 35 C5 20, 15 10, 25 10 C35 10, 45 18, 50 28 C55 18, 65 10, 75 10 C85 10, 95 20, 95 35 C95 50, 80 65, 50 85 Z"
              fill="url(#heartGradient)"
              filter="url(#heartShadow)"
            />

            {/* Highlight for depth */}
            <ellipse
              cx="40"
              cy="35"
              rx="10"
              ry="12"
              fill="white"
              opacity="0.3"
            />
          </svg>
        </div>

        {/* Pulsing ring effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute w-28 h-28 rounded-full border-2 border-destructive/40 animate-pulse" />
          <div
            className="absolute w-28 h-28 rounded-full border-2 border-destructive/20 animate-pulse"
            style={{ animationDelay: "0.3s" }}
          />
        </div>
      </div>

      {/* Loading text with animation */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground">Loading</span>
        <div className="flex gap-1">
          <span
            className="w-1.5 h-1.5 bg-destructive rounded-full animate-bounce"
            style={{ animationDelay: "0s" }}
          />
          <span
            className="w-1.5 h-1.5 bg-destructive rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          />
          <span
            className="w-1.5 h-1.5 bg-destructive rounded-full animate-bounce"
            style={{ animationDelay: "0.4s" }}
          />
        </div>
      </div>
    </div>
  );
}
