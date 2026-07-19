export default function TermsPage() {
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px", fontFamily: "system-ui, sans-serif", lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Terms of Service</h1>
      <p style={{ color: "#64748B", fontSize: 14, marginBottom: 24 }}>Last updated: July 2026</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 24 }}>1. Acceptance</h2>
      <p style={{ color: "#475569", fontSize: 14 }}>
        By using Road Safety Dar es Salaam, you agree to these terms. If you do not agree, do not use the service.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 24 }}>2. User Reports</h2>
      <p style={{ color: "#475569", fontSize: 14 }}>
        Users may submit accident reports. You represent that all information you provide is accurate to the best of your knowledge. 
        False reports may result in account suspension.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 24 }}>3. Data Use</h2>
      <p style={{ color: "#475569", fontSize: 14 }}>
        Submitted data is used to improve road safety intelligence. Anonymous aggregate data may be shared with traffic authorities.
        Personal contact information is kept confidential.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 24 }}>4. Limitation of Liability</h2>
      <p style={{ color: "#475569", fontSize: 14 }}>
        This platform provides crowd-sourced information and should not be solely relied upon for critical decisions. 
        We are not liable for inaccuracies in user-submitted reports.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 24 }}>5. Contact</h2>
      <p style={{ color: "#475569", fontSize: 14 }}>
        For inquiries: <a href="mailto:roadsafetydar@gmail.com" style={{ color: "#3B82F6" }}>roadsafetydar@gmail.com</a>
      </p>
    </div>
  );
}