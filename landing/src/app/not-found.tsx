import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#F8FAFC", fontFamily: "system-ui, sans-serif", padding: 24,
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 72, fontWeight: 800, color: "#E2E8F0", marginBottom: 8 }}>404</div>
        <h1 style={{ margin: "0 0 8px", fontSize: 24, color: "#0F172A" }}>Page not found</h1>
        <p style={{ color: "#64748B", marginBottom: 24 }}>The page you are looking for does not exist.</p>
        <Link href="/" style={{
          background: "#3B82F6", color: "#fff", padding: "12px 32px", borderRadius: 999,
          textDecoration: "none", fontWeight: 600, display: "inline-block",
        }}>
          Go Home
        </Link>
      </div>
    </div>
  );
}