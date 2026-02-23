export default function Page() {
  const whatsappUrl =
    "https://wa.me/18302451333?text=Hi%20ProjetaPro%2C%20I%27d%20like%20to%20schedule%20an%20electrical%20panel%20inspection.%20My%20address%20is%3A%20";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0b0b0b",
        color: "white",
        padding: 24,
        fontFamily: "system-ui",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 18,
          padding: 28,
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(8px)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 28 }}>
          ProjetaPro Inspection
        </h1>

        <p style={{ marginTop: 10, opacity: 0.85 }}>
          Schedule your electrical panel inspection in seconds.
        </p>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "block",
            marginTop: 22,
            textAlign: "center",
            padding: "16px 18px",
            borderRadius: 14,
            fontWeight: 700,
            background: "#25D366",
            color: "#0b0b0b",
            textDecoration: "none",
            fontSize: 18,
          }}
        >
          WhatsApp • Schedule Inspection
        </a>

        <p
          style={{
            marginTop: 14,
            fontSize: 14,
            opacity: 0.8,
            textAlign: "center",
          }}
        >
          Or call/text: <strong>(830) 245-1333</strong>
        </p>
      </div>
    </main>
  );
}
