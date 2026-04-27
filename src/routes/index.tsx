import { createFileRoute } from "@tanstack/react-router";
import { Vinyl } from "~/components/Vinyl";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <main className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 pt-20">
      <Vinyl />
      <p className="pointer-events-none mt-12 max-w-md text-center text-xs uppercase tracking-[0.3em] text-bone/40">
        Scroll or drag the record to change speed
      </p>
    </main>
  );
}
