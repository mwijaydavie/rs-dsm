"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import LoadingScreen from "./LoadingScreen";

export default function LoadingScreenWrapper() {
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  const [show, setShow] = useState(true);
  const [key, setKey] = useState(0);

  useEffect(() => {
    // Show loading screen on every route change
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      setKey((k) => k + 1);
      setShow(true);
      const timer = setTimeout(() => setShow(false), 1500);
      return () => clearTimeout(timer);
    } else {
      // First mount: show then hide after animation
      const timer = setTimeout(() => setShow(false), 1800);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  if (!show) return null;

  return <LoadingScreen key={key} onComplete={() => setShow(false)} />;
}
