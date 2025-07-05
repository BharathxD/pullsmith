import { AppSidebar } from "@/components/nav/app-sidebar";

const DashboardLayout = ({ children }: Readonly<React.PropsWithChildren>) => (
  <>
    <AppSidebar />
    <main className="flex-1">{children}</main>
  </>
);

export default DashboardLayout;
