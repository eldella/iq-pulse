import { LegalList, LegalPageShell, LegalSection } from "@/components/legal/LegalPageShell";

export function PrivacyPolicyPage() {
  return (
    <LegalPageShell title="Política de privacidad" updatedOn="11 de agosto de 2026">
      <LegalSection heading="Resumen">
        <p>
          IQ.Pulse es un sitio estático, sin backend ni cuentas de usuario.
          No recolectamos, almacenamos ni compartimos datos personales tuyos
          en ningún servidor propio.
        </p>
      </LegalSection>

      <LegalSection heading="Qué datos se guardan en tu navegador">
        <p>
          Tu preferencia de tema (claro u oscuro) se guarda localmente en tu
          navegador (localStorage), únicamente para recordar tu elección en
          tu próxima visita. Ese dato nunca sale de tu dispositivo ni lo
          recibimos nosotros.
        </p>
        <p>
          El botón &ldquo;Iniciar sesión&rdquo; es, por ahora, una demo visual: no pide
          contraseña ni datos reales, solo guarda un indicador (sí/no) en tu
          navegador para mostrar cómo se vería la interfaz logueada. No hay
          cuentas ni base de datos detrás todavía.
        </p>
      </LegalSection>

      <LegalSection heading="Analítica y cookies de terceros">
        <p>
          IQ.Pulse no usa cookies de seguimiento ni herramientas de analítica
          (Google Analytics u otras). No hay rastreo de tu actividad en el
          sitio.
        </p>
      </LegalSection>

      <LegalSection heading="Enlaces a plataformas de donación">
        <p>
          Los botones de donación te llevan a sitios de terceros (Buy Me a
          Coffee, Ko-fi). Si elegís donar, cualquier dato que ingreses ahí
          (email, medio de pago) queda sujeto a la política de privacidad de
          esa plataforma, no a la de IQ.Pulse. Te recomendamos revisarla
          antes de donar.
        </p>
      </LegalSection>

      <LegalSection heading="Contenido ilustrativo">
        <p>
          El ranking, las métricas y el muro de mecenas que ves en{" "}
          <span className="text-foreground">/estadisticas</span> son datos de
          demostración fijos, no información real de usuarios. No hay
          formulario que envíe datos tuyos para generarlos.
        </p>
      </LegalSection>

      <LegalSection heading="Tus derechos">
        <p>
          Como no recolectamos datos personales en ningún servidor propio, no
          hay una base de datos sobre vos para acceder, corregir o eliminar.
          Si tenés dudas puntuales, igual podés escribirnos.
        </p>
        <LegalList
          items={[
            "Podés borrar la preferencia de tema guardada limpiando el almacenamiento local de tu navegador para este sitio.",
            "Podés dejar de usar el sitio en cualquier momento sin ningún rastro asociado a vos en nuestros sistemas.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="Cambios en esta política">
        <p>
          Si en el futuro se agrega alguna funcionalidad que recolecte datos
          (por ejemplo, un backend real de evaluación con cuentas), esta
          política se actualizará antes de que eso ocurra.
        </p>
      </LegalSection>

      <LegalSection heading="Contacto">
        <p>
          Para consultas sobre privacidad, escribinos a{" "}
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
