import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TRPCProvider } from "./trpc-provider";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { SidebarProvider } from "../ui/sidebar";

const Providers = ({ children }: React.PropsWithChildren) => (
  <TRPCProvider>
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <NuqsAdapter>{children}</NuqsAdapter>
        <Toaster />
      </SidebarProvider>
    </TooltipProvider>
  </TRPCProvider>
);

export default Providers;
