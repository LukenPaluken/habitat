export function PageHeader({
  title,
  kicker,
  actions,
  children,
}: {
  title: string;
  kicker?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {kicker && <p className="kicker mb-2">{kicker}</p>}
        <h1 className="text-[2rem] leading-[1.1] sm:text-4xl">{title}</h1>
        {children && <p className="mt-2 text-stone">{children}</p>}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </header>
  );
}
