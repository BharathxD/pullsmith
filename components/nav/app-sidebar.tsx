"use client";

import { UserButton } from "@/components/auth/user-button";
import { InstallationSelector } from "@/components/github/installation-selector";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateShort, getLanguageColor } from "@/lib/github/utils";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import type { AppRouter } from "@/server/api/root";
import type { inferRouterOutputs } from "@trpc/server";
import {
  GitBranch,
  GitFork,
  Globe,
  Lock,
  SidebarClose,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { ThemeButton } from "../theme-button";
import { Button } from "../ui/button";

type Repositories =
  inferRouterOutputs<AppRouter>["github"]["getAllRepositories"];

const AppSidebarLoadingSkeleton = () => (
  <>
    <div className="px-2.5 py-3 sticky top-0 z-20 bg-white/90 dark:bg-neutral-900 backdrop-blur-sm">
      <div className="flex items-center justify-between w-full p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full bg-neutral-200 dark:bg-neutral-800" />
          <Skeleton className="h-4 w-20 bg-neutral-200 dark:bg-neutral-800" />
          <Skeleton className="h-4 w-6 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
        </div>
        <Skeleton className="h-4 w-4 bg-neutral-200 dark:bg-neutral-800" />
      </div>
    </div>
    <SidebarGroup className="p-0 px-3 pb-2 overflow-y-hidden">
      <SidebarGroupLabel className="text-xs text-neutral-700 dark:text-neutral-400 font-medium px-0 pl-1 h-fit">
        Repositories
      </SidebarGroupLabel>
      <SidebarGroupContent className="space-y-1">
        {Array.from({ length: 20 }, () => (
          <SidebarMenuItem key={crypto.randomUUID()}>
            <div className="flex flex-col items-start gap-1 h-auto rounded-md bg-neutral-50 dark:bg-neutral-900 p-2 pl-0.5">
              <div className="flex items-center gap-2 w-full">
                <Skeleton className="h-3 w-3 bg-neutral-200 dark:bg-neutral-800" />
                <Skeleton className="h-4 w-24 bg-neutral-200 dark:bg-neutral-800" />
                <Skeleton className="h-3 w-3 bg-neutral-200 dark:bg-neutral-800" />
              </div>
              <div className="flex items-center gap-2 w-full">
                <div className="flex items-center gap-1">
                  <Skeleton className="h-2 w-2 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                  <Skeleton className="h-3 w-16 bg-neutral-200 dark:bg-neutral-800" />
                </div>
                <div className="flex items-center gap-1">
                  <Skeleton className="h-3 w-3 bg-neutral-200 dark:bg-neutral-800" />
                  <Skeleton className="h-3 w-4 bg-neutral-200 dark:bg-neutral-800" />
                </div>
                <div className="flex items-center gap-1">
                  <Skeleton className="h-3 w-3 bg-neutral-200 dark:bg-neutral-800" />
                  <Skeleton className="h-3 w-4 bg-neutral-200 dark:bg-neutral-800" />
                </div>
              </div>
              <div className="w-full">
                <Skeleton className="h-3 w-20 bg-neutral-200 dark:bg-neutral-800" />
              </div>
            </div>
          </SidebarMenuItem>
        ))}
      </SidebarGroupContent>
    </SidebarGroup>
  </>
);

const AppSidebarErrorState = () => (
  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800">
    Failed to load repositories
  </div>
);

const AppSidebarEmptyState = () => (
  <div className="text-center max-w-sm">
    <GitBranch className="h-12 w-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
      No repositories found
    </h3>
    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
      To get started, install the PullSmith GitHub app on your repositories to
      enable AI-powered pull request reviews.
    </p>
    <a
      href="https://github.com/apps/pullsmith"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
    >
      <GitBranch className="h-4 w-4" />
      Install PullSmith App
    </a>
  </div>
);

interface AppSidebarDataViewProps {
  repositories: Repositories;
  onRepositoryClick: (fullName: string) => void;
}

const AppSidebarDataView: React.FC<AppSidebarDataViewProps> = ({
  repositories,
  onRepositoryClick,
}) => {
  const [selectedInstallationId, setSelectedInstallationId] = useState<
    number | null
  >(null);

  const filteredRepositories = useMemo(() => {
    if (selectedInstallationId === null) return repositories;
    return repositories.filter(
      (repo) => repo.installation_id === selectedInstallationId
    );
  }, [repositories, selectedInstallationId]);

  return (
    <>
      <InstallationSelector
        selectedInstallationId={selectedInstallationId}
        onInstallationSelect={setSelectedInstallationId}
        repositoryCount={filteredRepositories.length}
      />
      <SidebarGroup className="p-0 px-2 pb-2">
        <SidebarGroupLabel className="text-xs text-neutral-700 dark:text-neutral-400 font-medium px-0 pl-2 h-fit">
          Repositories
        </SidebarGroupLabel>
        <SidebarGroupContent>
          {filteredRepositories.map((repo) => (
            <SidebarMenuItem key={repo.id}>
              <SidebarMenuButton
                onClick={() => onRepositoryClick(repo.full_name)}
                className="flex flex-col items-start gap-1 h-auto pr-2 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors group"
              >
                <div className="flex items-center gap-2 w-full">
                  <GitBranch className="h-3 w-3 text-neutral-400 dark:text-neutral-600 flex-shrink-0" />
                  <span className="text-sm font-medium truncate text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-700 dark:group-hover:text-neutral-300">
                    {repo.name}
                  </span>
                  {repo.private ? (
                    <Lock className="h-3 w-3 text-neutral-400 dark:text-neutral-600 flex-shrink-0" />
                  ) : (
                    <Globe className="h-3 w-3 text-neutral-400 dark:text-neutral-600 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 w-full text-xs text-neutral-500 dark:text-neutral-400">
                  {repo.language && (
                    <div className="flex items-center gap-1">
                      <div
                        className={`w-2 h-2 rounded-full ${getLanguageColor(
                          repo.language
                        )}`}
                      />
                      <span className="truncate">{repo.language}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-neutral-400 dark:text-neutral-600" />
                    <span>{repo.stargazers_count}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <GitFork className="h-3 w-3 text-neutral-400 dark:text-neutral-600" />
                    <span>{repo.forks_count}</span>
                  </div>
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 w-full">
                  Updated {formatDateShort(repo.updated_at)}
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
};

export const AppSidebar = () => {
  const router = useRouter();
  const { toggleSidebar, open } = useSidebar();
  const {
    data: repositories,
    isLoading,
    error,
  } = trpc.github.getAllRepositories.useQuery();

  const handleRepositoryClick = (fullName: string) =>
    router.push(`/repositories/${fullName.toLowerCase()}`);

  const subtitle = useMemo(() => {
    if (isLoading) return "Loading repositories...";
    if (error) return null;
    return `${repositories?.length || 0} repositories available`;
  }, [isLoading, error, repositories]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: we don't want to re-render this on every change
  const renderContent = useCallback(() => {
    if (isLoading) {
      return {
        className: "gap-0",
        content: <AppSidebarLoadingSkeleton />,
      };
    }
    if (error) {
      return {
        className: "p-4",
        content: <AppSidebarErrorState />,
      };
    }
    if (!repositories || repositories.length === 0) {
      return {
        className:
          "p-4 flex flex-col items-center justify-center min-h-[400px] dark:bg-black",
        content: <AppSidebarEmptyState />,
      };
    }
    return {
      className: "gap-0",
      content: (
        <AppSidebarDataView
          repositories={repositories}
          onRepositoryClick={handleRepositoryClick}
        />
      ),
    };
  }, [isLoading, error, repositories]);

  const { className, content } = renderContent();

  return (
    <Sidebar variant="sidebar">
      <SidebarHeader className="p-3 border-b dark:border-neutral-800 relative pl-12">
        <Link
          href="/"
          className="font-semibold text-xl text-neutral-900 hover:text-neutral-700 dark:text-neutral-100 dark:hover:text-neutral-300"
        >
          PullSmith
        </Link>
        {subtitle && (
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            {subtitle}
          </div>
        )}
        <div
          className={cn(
            "flex flex-col bg-neutral-50 dark:bg-neutral-900 p-1 top-1.5 rounded-xl fixed",
            open ? "left-1.5" : "left-1.5"
          )}
        >
          <Button
            variant="outline"
            size="icon"
            className="size-7 border-b-[0.5px] shadow-none rounded-sm rounded-b-none"
            onClick={toggleSidebar}
          >
            <SidebarClose strokeWidth={1.75} />
          </Button>
          <ThemeButton />
        </div>
      </SidebarHeader>

      <SidebarContent className={className}>{content}</SidebarContent>

      <SidebarFooter className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
        <UserButton />
      </SidebarFooter>
    </Sidebar>
  );
};
