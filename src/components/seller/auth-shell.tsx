import { HouseDrawing } from "./house-drawing";
import { Wordmark } from "./seller-nav";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[5fr_6fr]">
      <aside className="hidden flex-col justify-between bg-ink p-12 text-paper lg:flex">
        <Wordmark />
        <HouseDrawing className="mx-auto w-full max-w-md text-paper/85" />
        <div>
          <p className="max-w-sm font-serif text-[1.75rem] leading-snug">
            Tus propiedades, consultas y visitas en un solo lugar.
          </p>
          <p className="kicker mt-4 !text-paper/55">Panel para inmobiliarias</p>
        </div>
      </aside>

      <main className="flex items-center px-5 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <Wordmark className="mb-10 lg:hidden" />
          {children}
        </div>
      </main>
    </div>
  );
}
