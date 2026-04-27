import { createFileRoute } from "@tanstack/react-router";
import { Vinyl } from "~/components/Vinyl";
import { TrackControls } from "~/components/TrackControls";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <main className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 pb-12 pt-20">
      <Vinyl />
      <TrackControls />
    </main>
  );
}
