import Image from "next/image";

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 backdrop-blur-3xl overflow-hidden">
      {/* Background ambient glows */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] animate-pulse"
        style={{ animationDuration: "4s" }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px] animate-pulse"
        style={{ animationDuration: "3s", animationDelay: "1s" }}
      />

      <div className="relative flex flex-col items-center">
        {/* Animated outer ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px]">
          <svg
            className="w-full h-full animate-[spin_8s_linear_infinite]"
            viewBox="0 0 100 100"
          >
            <defs>
              <linearGradient
                id="premium-gradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0" />
                <stop offset="50%" stopColor="#4F46E5" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#7C3AED" stopOpacity="1" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke="url(#premium-gradient)"
              strokeWidth="1.5"
              strokeDasharray="150 150"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Second reverse animated ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px]">
          <svg
            className="w-full h-full animate-[spin_12s_linear_infinite_reverse] opacity-50"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke="#60A5FA"
              strokeWidth="0.5"
              strokeDasharray="50 100"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* The Logo Container */}
        <div className="relative z-10 w-40 h-40 rounded-3xl bg-white shadow-[0_20px_50px_rgb(0,0,0,0.1)] overflow-hidden flex items-center justify-center p-2 border border-white/50 backdrop-blur-md animate-[bounce_4s_infinite]">
          <div className="w-full h-full relative rounded-2xl overflow-hidden shadow-inner">
            <Image
              src="/logo.png"
              alt="DaanSetu Logo"
              fill
              sizes="160px"
              className="object-cover scale-[1.7]"
              priority
            />
          </div>
        </div>

        {/* Text area */}
        <div className="mt-16 flex flex-col items-center">
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            DaanSetu
          </h2>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-8 h-[1px] bg-slate-300"></div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-semibold">
              A Bridge for Giving
            </span>
            <div className="w-8 h-[1px] bg-slate-300"></div>
          </div>

          {/* Premium Loading Dots */}
          <div className="mt-8 flex gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-[pulse_1s_infinite_0ms]"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-[pulse_1s_infinite_200ms]"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-[pulse_1s_infinite_400ms]"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
