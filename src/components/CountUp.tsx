"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, animate } from "motion/react";

interface CountUpProps {
  end: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function CountUp({
  end,
  suffix = "",
  prefix = "",
  decimals = 0,
  duration = 2,
  className,
  style,
}: CountUpProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, end, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setCount(latest),
    });
    return () => controls.stop();
  }, [inView, end, duration]);

  const formatted = count.toFixed(decimals);

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {prefix}
      {formatted}
      {suffix}
    </motion.div>
  );
}