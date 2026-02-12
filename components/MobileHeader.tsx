export default function MobileHeader({ title }: { title: string }) {
  return (
    <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 px-4 py-3 shadow-sm">
      <h1 className="text-lg font-semibold">{title}</h1>
    </div>
  );
}
