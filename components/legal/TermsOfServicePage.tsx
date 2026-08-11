import { LegalList, LegalPageShell, LegalSection } from "@/components/legal/LegalPageShell";

export function TermsOfServicePage() {
  return (
    <LegalPageShell title="Términos de servicio" updatedOn="11 de agosto de 2026">
      <LegalSection heading="Qué es IQ.Pulse">
        <p>
          IQ.Pulse es un proyecto independiente, personal y sin fines de
          lucro. El contenido del sitio —incluyendo las métricas, el ranking
          y el muro de mecenas— es ilustrativo: no existe todavía un backend
          de evaluación cognitiva real detrás de estos números, y se
          presentan como demostración de producto.
        </p>
        <p>
          No es una herramienta de diagnóstico clínico ni psicológico. Nada
          de lo publicado acá reemplaza la evaluación de un profesional. Usá
          el sitio con fines recreativos e informativos únicamente.
        </p>
      </LegalSection>

      <LegalSection heading="Uso del sitio">
        <p>
          Podés navegar y usar IQ.Pulse libremente. No se requiere crear una
          cuenta ni registrarte para acceder a ninguna sección.
        </p>
        <p>Al usar el sitio, te comprometés a no:</p>
        <LegalList
          items={[
            "Intentar interferir con el funcionamiento técnico del sitio.",
            "Usar el contenido con fines que infrinjan leyes aplicables.",
            "Presentar el contenido ilustrativo como si fueran resultados médicos o clínicos reales.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="Donaciones">
        <p>
          El sitio ofrece enlaces opcionales para colaborar económicamente a
          través de plataformas de terceros (por ejemplo, Buy Me a Coffee o
          Ko-fi). Esas donaciones son voluntarias, no obligatorias, y no
          otorgan acceso a ninguna función adicional: IQ.Pulse es y seguirá
          siendo de acceso libre.
        </p>
        <p>
          El procesamiento del pago ocurre enteramente en la plataforma de
          terceros elegida, bajo sus propios términos. IQ.Pulse no gestiona
          ni almacena datos de pago.
        </p>
      </LegalSection>

      <LegalSection heading="Propiedad y contenido">
        <p>
          El diseño, textos y código de IQ.Pulse pertenecen a su creador.
          Podés compartir enlaces al sitio libremente; para cualquier otro
          uso del contenido, contactanos primero.
        </p>
      </LegalSection>

      <LegalSection heading="Cambios en estos términos">
        <p>
          Estos términos pueden actualizarse a medida que el proyecto
          evolucione (por ejemplo, si en el futuro se agrega un backend real
          de evaluación). Los cambios relevantes se reflejarán en la fecha de
          esta página.
        </p>
      </LegalSection>

      <LegalSection heading="Contacto">
        <p>
          Para consultas sobre estos términos, escribinos a{" "}
          <a
            href="mailto:mati.dbh@gmail.com"
            className="text-accent underline-offset-4 hover:underline"
          >
            mati.dbh@gmail.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
