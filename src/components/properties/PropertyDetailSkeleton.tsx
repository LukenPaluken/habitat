/** The shape of the detail page while it loads. */
export function PropertyDetailSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Cargando propiedad"
      className="grid animate-pulse gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]"
    >
      <div className="space-y-3">
        <div className="aspect-[4/3] rounded-xl bg-slate-200 sm:aspect-[16/10]" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-16 w-24 shrink-0 rounded-lg bg-slate-200"
            />
          ))}
        </div>
      </div>
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <div className="h-5 w-24 rounded bg-slate-200" />
        <div className="h-8 w-5/6 rounded bg-slate-200" />
        <div className="h-4 w-2/3 rounded bg-slate-200" />
        <div className="h-9 w-1/2 rounded bg-slate-200" />
        <div className="h-11 rounded-lg bg-slate-200" />
      </div>
    </div>
  );
}
