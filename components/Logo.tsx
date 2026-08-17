"use client";

import React from "react";
import Image from "next/image";

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  textColor?: string;
  variant?: "auto" | "dark" | "light";
}

export function Logo({
  size = 36,
  className = "",
  showText = true,
  textColor,
  variant = "auto",
}: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        {variant === "auto" ? (
          <>
            {/* Light Mode Logo (b2blight.webp) shown in light theme */}
            <Image
              src="/b2blight.webp"
              alt="bits2bytes logo"
              width={size}
              height={size}
              className="dark:hidden block object-contain w-full h-full"
              priority
            />
            {/* Dark Mode Logo (b2bdark.webp) shown in dark theme */}
            <Image
              src="/b2bdark.webp"
              alt="bits2bytes logo"
              width={size}
              height={size}
              className="hidden dark:block object-contain w-full h-full"
              priority
            />
          </>
        ) : (
          <Image
            src={variant === "light" ? "/b2blight.webp" : "/b2bdark.webp"}
            alt="bits2bytes logo"
            width={size}
            height={size}
            className="object-contain w-full h-full"
            priority
          />
        )}
      </div>

      {showText && (
        <span
          className="font-extrabold tracking-tight"
          style={{
            fontSize: size >= 40 ? "1.2rem" : "1.05rem",
            color: textColor || "var(--foreground, currentColor)",
          }}
        >
          bits<span style={{ color: "#7cc62f" }}>2</span>bytes
        </span>
      )}
    </div>
  );
}

export default Logo;
