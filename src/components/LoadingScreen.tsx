"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export default function LoadingScreen({ onComplete }: { onComplete?: () => void }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"loading" | "fading">("loading");
  
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 15 + 5;
        if (next >= 100) {
          clearInterval(interval);
          setPhase("fading");
          setTimeout(() => onComplete?.(), 600);
          return 100;
        }
        return Math.min(next, 99);
      });
    }, 200);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase === "loading" && (
        <motion.div
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
            overflow: "hidden",
          }}
        >
          {/* Animated background orbs */}
          <div style={{
            position: "absolute",
            width: "60vw",
            height: "60vw",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
            top: "-20%",
            right: "-10%",
            animation: "loadingOrbPulse 3s ease-in-out infinite",
          }} />
          <div style={{
            position: "absolute",
            width: "40vw",
            height: "40vw",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(248,113,113,0.1) 0%, transparent 70%)",
            bottom: "-10%",
            left: "-10%",
            animation: "loadingOrbPulse 4s ease-in-out infinite reverse",
          }} />

          {/* Logo */}
          <motion.img
            src="/accident-protection.png"
            alt=""
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: 72, height: 72, objectFit: "contain", marginBottom: 24, position: "relative" }}
          />

          {/* Title */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 800,
              color: "#fff",
              fontFamily: '"Hubot Sans","Nunito","Quicksand",system-ui,sans-serif',
              letterSpacing: "-0.02em",
              position: "relative",
            }}
          >
            Road Safety{" "}
            <span style={{ color: "#60A5FA" }}>Dar</span>
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            style={{
              margin: "8px 0 32px",
              fontSize: 14,
              color: "#94A3B8",
              position: "relative",
            }}
          >
            Loading safety intelligence…
          </motion.p>

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{ width: 200, position: "relative" }}
          >
            <div style={{
              width: "100%",
              height: 3,
              borderRadius: 999,
              background: "rgba(255,255,255,0.1)",
              overflow: "hidden",
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{
                  height: "100%",
                  borderRadius: 999,
                  background: "linear-gradient(90deg, #3B82F6, #60A5FA)",
                }}
              />
            </div>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                position: "absolute",
                right: -36,
                top: -2,
                fontSize: 12,
                fontWeight: 700,
                color: "#94A3B8",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {Math.round(progress)}%
            </motion.span>
          </motion.div>

          <style>{`
            @keyframes loadingOrbPulse {
              0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.6; }
              50% { transform: scale(1.1) translate(30px, -20px); opacity: 1; }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}