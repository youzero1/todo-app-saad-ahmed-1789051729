import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
      <p className="text-sm">Your tasks, loading…</p>
    </div>
  );
}
