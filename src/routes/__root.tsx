import { createRootRoute, Link, Outlet } from '@tanstack/react-router';

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
});

// The app shell: anything rendered here (nav, footer, providers) appears on every page.
// <Outlet /> is where the matched page renders.
function RootLayout() {
  return <Outlet />;
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-slate-100">
      <p className="text-lg">This page does not exist.</p>
      <Link to="/" className="text-sm underline underline-offset-4">
        Go to the home page
      </Link>
    </div>
  );
}
