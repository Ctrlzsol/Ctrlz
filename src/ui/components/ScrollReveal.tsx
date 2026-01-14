
import React from 'react';
import { motion as m } from 'framer-motion';

const motion = m as any;

interface ScrollRevealProps {
  children: React.ReactNode;
  width?: "fit-content" | "100%";
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
  stagger?: boolean;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({ 
  children, 
  width = "100%", 
  delay = 0, 
  duration = 0.5,
  direction = 'up',
  className = "",
  stagger = false
}) => {
  
  const getVariants = () => {
    const distance = 50;
    
    const hiddenState: any = { opacity: 0 };
    if (direction === 'up') hiddenState.y = distance;
    if (direction === 'down') hiddenState.y = -distance;
    if (direction === 'left') hiddenState.x = distance;
    if (direction === 'right') hiddenState.x = -distance;
    if (direction === 'none') hiddenState.scale = 0.95;

    const visibleState: any = { 
      opacity: 1, 
      y: 0, 
      x: 0, 
      scale: 1,
      transition: {
        duration: duration,
        delay: delay,
        ease: [0.25, 0.25, 0, 1],
      }
    };

    return {
      hidden: hiddenState,
      visible: visibleState
    };
  };

  return (
    <div style={{ width, overflow: 'hidden' }} className={className}>
      <motion.div
        variants={getVariants()}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        {children}
      </motion.div>
    </div>
  );
};
