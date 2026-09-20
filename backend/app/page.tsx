export default function Home() {
  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: 640,
        margin: "0 auto",
        padding: "48px 24px",
        lineHeight: 1.6,
      }}
    >
      <h1>Habla Bien</h1>
      <p>
        Backend del entrenador de comunicación. La aplicación móvil envía el audio
        de la exposición y recibe transcripción, métricas y retroalimentación.
      </p>
      <h2>Endpoints</h2>
      <ul>
        <li>
          <code>POST /api/analyze</code> — multipart <code>audio</code>, opcional{" "}
          <code>topicId</code>.
        </li>
        <li>
          <code>GET /api/topics</code> — temas disponibles (o{" "}
          <code>?random=true</code>).
        </li>
        <li>
          <code>GET /api/health</code> — estado del servicio.
        </li>
      </ul>
    </main>
  );
}
