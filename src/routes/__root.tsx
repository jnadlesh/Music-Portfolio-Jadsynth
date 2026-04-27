import { Outlet, createRootRoute } from "@tanstack/react-router";
import { Navbar } from "~/components/Navbar";
import { CatalogOverlay } from "~/components/CatalogOverlay";
import { AtmosphericBackground } from "~/components/AtmosphericBackground";
import { PlayerProvider } from "~/lib/player-context";
import { useWakeLock } from "~/lib/use-wake-lock";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  useWakeLock();
  return (
    <PlayerProvider>
      <AtmosphericBackground />
      <Navbar />
      <Outlet />
      <CatalogOverlay />
    </PlayerProvider>
  );
}
