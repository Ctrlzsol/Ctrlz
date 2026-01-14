
import React, { useMemo } from 'react';
import { motion as m } from 'framer-motion';
import { Cpu, Server, Wifi, Shield, Database, Code, Smartphone, Globe, Cloud, Lock, Zap, Activity } from 'lucide-react';

const motion = m as any;

const icons = [
  Cpu, Server, Wifi, Shield, Database, Code, Smartphone, Globe, Cloud, Lock, Zap, Activity
];

const FloatingTechBackground = () => {
  const elements = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => {
      const Icon = icons[i % icons.length];
      return {
        id: i,
        Icon,
        left: Math.random() * 100, 
        top: Math.random() * 100,
        size: 30 + Math.random() * 40,
        duration: 20 + Math.random() * 15,
        delay: Math.random() * 10,
        xDrift: (Math.random() - 0.5) * 150,
        yDrift: (Math.random() - 0.5) * 150,
        rotateDir: Math.random() > 0.5 ? 1 : -1,
      };
    });
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none h-full w-full">
      {elements.map((el) => (
        <motion.div
          key={el.id}
          className="absolute text-slate-900"
          style={{
            left: `${el.left}%`,
            top: `${el.top}%`,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            x: [0, el.xDrift, 0],
            y: [0, el.yDrift, 0],
            rotate: [0, 360 * el.rotateDir],
            opacity: [0.03, 0.08, 0.03],
            scale: [0.8, 1, 0.8],
          }}
          transition={{
            duration: el.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: -Math.random() * 20,
          }}
        >
          <el.Icon size={el.size} strokeWidth={1.5} />
        </motion.div>
      ))}
      
      <div className="absolute inset-0 bg-gradient-to-b from-[#f5f5f7] via-transparent to-[#f5f5f7] opacity-60"></div>
    </div>
  );
};

export default FloatingTechBackground;
