import { DonationModal } from "@/components/DonationModal";

/**
 * Transparent, non-salesy explanation of how the project stays free: the
 * donation trigger is the same shared DonationModal used in the header, so
 * there's a single source of truth for the donation options/links.
 */
export function SustainmentSection() {
  return (
    <section
      id="sostenimiento"
      className="mx-auto flex w-full max-w-2xl scroll-mt-20 flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 sm:py-24"
    >
      <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Modelo de sostenimiento
      </h2>
      <div className="flex flex-col gap-4 text-base text-foreground/70 sm:text-lg">
        <p>
          IQ.Pulse es y seguirá siendo de acceso libre. No hay planes premium
          ni resultados bloqueados detrás de un pago.
        </p>
        <p>
          Mantener el proyecto online — servidores, dominio, tiempo de
          desarrollo — tiene un costo real. Por eso, quienes quieran
          colaborar pueden hacerlo mediante donaciones voluntarias. No es un
          pedido de caridad: es una forma honesta de que quienes valoran el
          proyecto ayuden a sostenerlo.
        </p>
        <p>
          Cada aporte, sin importar el tamaño, se destina directamente a
          infraestructura y desarrollo. Nada más.
        </p>
      </div>
      <DonationModal />
    </section>
  );
}
