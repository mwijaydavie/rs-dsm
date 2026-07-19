"use client";

import { motion } from "motion/react";
import { ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  duration?: number;
  distance?: number;
  once?: boolean;
}

export default function ScrollReveal({
  children,
  className,
  style,
  delay = 0,
  direction = "up",
  duration = 0.7,
  distance = 40,
  once = true,
}: ScrollRevealProps) {
  const directionMap = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
  };

  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, ...directionMap[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin: "-60px" }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}