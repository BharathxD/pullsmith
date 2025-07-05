import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TRPCProvider } from "./trpc-provider";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { SidebarProvider } from "../ui/sidebar";
import ThemeProvider from "./theme-provider";

const Providers = ({ children }: React.PropsWithChildren) => (
  <ThemeProvider>
    <TRPCProvider>
      <TooltipProvider delayDuration={0}>
        <SidebarProvider>
          <NuqsAdapter>{children}</NuqsAdapter>
          <Toaster />
        </SidebarProvider>
      </TooltipProvider>
    </TRPCProvider>
  </ThemeProvider>
);

export default Providers;
