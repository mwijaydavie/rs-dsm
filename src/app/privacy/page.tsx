export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px", fontFamily: "system-ui, sans-serif", lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ color: "#64748B", fontSize: 14, marginBottom: 24 }}>Last updated: July 2026</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 24 }}>1. Information We Collect</h2>
      <p style={{ color: "#475569", fontSize: 14 }}>
        We collect information you provide when submitting accident reports: location data, description, 
        photos, and contact information (phone or email). If you sign in via Google, we collect your 
        name, email address, and profile picture.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 24 }}>2. How We Use Your Data</h2>
      <p style={{ color: "#475569", fontSize: 14 }}>
        Your data is used to compile road safety intelligence, identify accident hotspots, 
        and inform traffic authorities. Contact information is only used for verification purposes.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 24 }}>3. Data Sharing</h2>
      <p style={{ color: "#475569", fontSize: 14 }}>
        We do not sell your personal data. Anonymous, aggregate statistics may be shared with 
        government traffic agencies to improve road safety infrastructure.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 24 }}>4. Data Retention</h2>
      <p style={{ color: "#475569", fontSize: 14 }}>
        Accident reports are retained indefinitely for historical analysis. You may request deletion 
        of your personal data by contacting us.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 24 }}>5. Your Rights</h2>
      <p style={{ color: "#475569", fontSize: 14 }}>
        You may request access to, correction of, or deletion of your personal data at any time 
        by emailing <a href="mailto:roadsafetydar@gmail.com" style={{ color: "#3B82F6" }}>roadsafetydar@gmail.com</a>.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 24 }}>6. Contact</h2>
      <p style={{ color: "#475569", fontSize: 14 }}>
        Dar es Salaam Road Safety<br />
        Email: <a href="mailto:roadsafetydar@gmail.com" style={{ color: "#3B82F6" }}>roadsafetydar@gmail.com</a>
      </p>
    </div>
  );
}