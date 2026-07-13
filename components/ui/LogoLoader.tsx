import Image from "next/image";

export function LogoLoader({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-20 w-20",
    lg: "h-32 w-32",
  };

  const imageSize = {
    sm: 32,
    md: 64,
    lg: 96,
  };

  const pulseSize = {
    sm: "h-16 w-16",
    md: "h-32 w-32",
    lg: "h-48 w-48",
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center ${className}`}
    >
      {/* Pulsing rings behind the logo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`${pulseSize[size]} animate-ping rounded-full bg-primary-100/60 opacity-75`}
        ></div>
      </div>

      {/* Logo container with floating animation */}
      <div
        className={`relative z-10 flex ${sizeClasses[size]} animate-bounce items-center justify-center rounded-2xl bg-white p-2 shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden`}
        style={{ animationDuration: "2s" }}
      >
        <div className="relative w-full h-full">
          <Image
            src="/logo.png"
            alt="Loading DaanSetu..."
            fill
            sizes="96px"
            className="object-cover scale-[1.5]"
            priority
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center">
        <p className="flex items-center gap-1 text-sm font-medium text-slate-500">
          <span
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-500"
            style={{ animationDelay: "0ms" }}
          ></span>
          <span
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-500"
            style={{ animationDelay: "150ms" }}
          ></span>
          <span
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-500"
            style={{ animationDelay: "300ms" }}
          ></span>
        </p>
      </div>
    </div>
  );
}
