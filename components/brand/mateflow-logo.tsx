import React from "react";

interface LogoProps {
    className?: string;
    size?: number;
    showText?: boolean;
    textClassName?: string;
}

export function MateFlowIcon({ size = 32, className = "" }: { size?: number; className?: string }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="8 13 48 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`overflow-visible ${className}`}
        >
            <defs>
                {/* Top / Upper Light Surfaces */}
                <linearGradient id="mf-top-grad" x1="8" y1="13" x2="56" y2="27" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#7DD3FC" />
                    <stop offset="1" stopColor="#38BDF8" />
                </linearGradient>
                {/* Left Dropping Faces */}
                <linearGradient id="mf-left-grad" x1="8" y1="20" x2="32" y2="52" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#0284C7" />
                    <stop offset="1" stopColor="#0369A1" />
                </linearGradient>
                {/* Right Dropping Faces */}
                <linearGradient id="mf-right-grad" x1="32" y1="20" x2="56" y2="52" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#0369A1" />
                    <stop offset="1" stopColor="#075985" />
                </linearGradient>
                {/* Lower Flow Floating Face */}
                <linearGradient id="mf-core-grad" x1="20" y1="34" x2="44" y2="48" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#38BDF8" />
                    <stop offset="1" stopColor="#0284C7" />
                </linearGradient>
            </defs>

            {/* PERFECT SYMMETRIC ISOMETRIC M - NO BACKGROUND, PERFECT BOUNDS */}
            <g>
                {/* Top surface Left & Right Bridge */}
                <path d="M8 20L20 13L32 20L20 27L8 20Z" fill="url(#mf-top-grad)" />
                <path d="M32 20L44 13L56 20L44 27L32 20Z" fill="url(#mf-top-grad)" />

                {/* Left Outer Pillar */}
                <path d="M8 20L20 27V42L8 35V20Z" fill="url(#mf-left-grad)" />
                {/* Right Outer Pillar */}
                <path d="M44 27L56 20V35L44 42V27Z" fill="url(#mf-right-grad)" />

                {/* Inner Valley Left & Right */}
                <path d="M20 27L32 20V34L20 41V27Z" fill="url(#mf-right-grad)" opacity="0.9" />
                <path d="M32 20L44 27V41L32 34V20Z" fill="url(#mf-left-grad)" opacity="0.9" />

                {/* Lower Flow Center Layer */}
                <path d="M20 41L32 34L44 41L32 48L20 41Z" fill="url(#mf-core-grad)" />
                <path d="M20 41L32 48V53L20 46V41Z" fill="url(#mf-left-grad)" />
                <path d="M32 48L44 41V46L32 53V48Z" fill="url(#mf-right-grad)" />
            </g>
        </svg>
    );
}

export function MateFlowLogo({
    size = 32,
    showText = true,
    className = "",
    textClassName = "",
}: LogoProps) {
    return (
        <div className={`flex items-center gap-2.5 bg-transparent ${className}`}>
            <div className="flex items-center justify-center shrink-0 bg-transparent">
                <MateFlowIcon size={size} />
            </div>
            {showText && (
                <div className={`flex flex-col select-none bg-transparent ${textClassName}`}>
                    <span className="text-base font-bold tracking-tight text-foreground flex items-center leading-none">
                        Mate&nbsp;<span className="text-primary font-extrabold">Flow</span>
                    </span>
                    <span className="text-[10px] tracking-wider uppercase font-semibold text-muted-foreground mt-0.5">
                        Backoffice ERP
                    </span>
                </div>
            )}
        </div>
    );
}
