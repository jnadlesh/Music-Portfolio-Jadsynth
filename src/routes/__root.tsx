import { Outlet, createRootRoute } from "@tanstack/react-router";
import { Navbar } from "~/components/Navbar";
import { CatalogOverlay } from "~/components/CatalogOverlay";
import { AtmosphericBackground } from "~/components/AtmosphericBackground";
import { PlayerProvider } from "~/lib/player-context";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <PlayerProvider>
      <AtmosphericBackground />
      <Navbar />
      <Outlet />
      <CatalogOverlay />
    </PlayerProvider>
  );
}
