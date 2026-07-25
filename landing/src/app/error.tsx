"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#F8FAFC", fontFamily: "system-ui, sans-serif", padding: 24, textAlign: "center",
    }}>
      <div>
        <div style={{ fontSize: 72, fontWeight: 800, color: "#E2E8F0", marginBottom: 8 }}>500</div>
        <h1 style={{ margin: "0 0 8px", fontSize: 24, color: "#0F172A" }}>Something went wrong</h1>
        <p style={{ color: "#64748B", marginBottom: 24 }}>Please try again.</p>
        <button onClick={reset} style={{
          background: "#3B82F6", color: "#fff", padding: "12px 32px", borderRadius: 999,
          border: "none", fontWeight: 600, cursor: "pointer", fontSize: 16,
        }}>
          Try Again
        </button>
      </div>
    </div>
  );
}