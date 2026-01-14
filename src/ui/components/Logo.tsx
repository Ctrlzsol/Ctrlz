
import React from 'react';
import { useLogo } from '../../core/contexts/LogoContext';

interface LogoProps {
  className?: string;
  withTagline?: boolean; 
}

export const Logo = ({ className = "h-10 w-auto", withTagline = false }: LogoProps) => {
  const { logoMode, customLogoData, logoScale } = useLogo();

  if (logoMode === 'custom' && customLogoData) {
    return (
      <div className={`flex items-center justify-center select-none overflow-visible ${className}`}>
        <img 
          src={customLogoData} 
          alt="Brand Logo" 
          className="w-full h-full object-contain transition-transform duration-300"
          style={{ transform: `scale(${logoScale})` }}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center select-none text-[#0c2444] ${className}`}>
      <svg 
        viewBox={withTagline ? "0 0 350 120" : "0 0 240 80"}
        xmlns="http://www.w3.org/2000/svg" 
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Main Text: Ctrl z */}
        <text 
            x="50%" 
            y={withTagline ? "75" : "60"} 
            textAnchor="middle" 
            dominantBaseline="middle"
            fontFamily="'Montserrat', sans-serif" 
            fontWeight="900" 
            fontSize="85" 
            fill="currentColor"
            letterSpacing="-3"
        >
          Ctrl z
        </text>

        {/* Tagline */}
        {withTagline && (
            <text 
                x="50%" 
                y="110" 
                textAnchor="middle" 
                fontFamily="'Montserrat', sans-serif" 
                fontWeight="500" 
                fontSize="9" 
                fill="currentColor" 
                letterSpacing="0.8"
                className="uppercase"
            >
            We Restore Your Devices To Their Optimal Condition
            </text>
        )}
      </svg>
    </div>
  );
};

export default Logo;
