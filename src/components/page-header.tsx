export function PageHeader({
  eyebrow,
  title,
  body,
  action,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="text-xs font-bold uppercase text-teal-700">{eyebrow}</p> : null}
        <h1 className="mt-1 text-2xl font-bold text-zinc-950 sm:text-3xl">{title}</h1>
        {body ? <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">{body}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
