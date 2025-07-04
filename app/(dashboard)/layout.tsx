import { AppSidebar } from "@/components/nav/app-sidebar";

const DashboardLayout = ({ children }: Readonly<React.PropsWithChildren>) => {
  return (
    <div className="flex">
      <AppSidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
};

export default DashboardLayout;
