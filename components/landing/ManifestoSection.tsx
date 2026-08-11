/**
 * Editorial manifesto section — deliberately no glass cards or icons here,
 * it should read like a magazine essay, not another feature block. Keep the
 * byline generic/pseudonymous; nothing here claims a verified real identity.
 */
export function ManifestoSection() {
  return (
    <section
      aria-labelledby="manifiesto-heading"
      className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-16 sm:px-6 sm:py-24"
    >
      <h2
        id="manifiesto-heading"
        className="text-sm font-semibold uppercase tracking-[0.2em] text-accent"
      >
        El creador y la misión
      </h2>
      <div className="flex flex-col gap-6 text-lg leading-relaxed text-foreground/80 sm:text-xl">
        <p>
          Detrás de IQ.Pulse hay una sola persona, obsesionada con una
          pregunta simple: ¿qué tan bien entendemos realmente nuestra propia
          mente? No hay equipo de marketing ni ronda de inversión — hay
          tiempo libre, curiosidad y la convicción de que medir el potencial
          cognitivo debería ser accesible para cualquiera, no un privilegio.
        </p>
        <p>
          La psicometría seria suele vivir detrás de paywalls, papers
          académicos o consultoras corporativas. IQ.Pulse busca lo
          contrario: acercar herramientas de medición cognitiva rigurosas a
          quien quiera usarlas, sin letra chica ni promesas vacías.
        </p>
        <p>
          Esto es un trabajo en construcción, no un producto terminado. Cada
          prueba, cada métrica y cada línea de código se revisa en público,
          con la meta de aportar —aunque sea un poco— a que medir la mente
          deje de ser un misterio reservado para pocos.
        </p>
      </div>
    </section>
  );
}
