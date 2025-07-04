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
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import { GitBranch, GitFork, Globe, Lock, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const formatDate = (dateString: string | null): string => {
  if (!dateString) return "Unknown";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const getLanguageColor = (language: string | null): string => {
  const colors: Record<string, string> = {
    JavaScript: "bg-yellow-500",
    TypeScript: "bg-blue-500",
    Python: "bg-green-500",
    Java: "bg-red-500",
    Go: "bg-cyan-500",
    Rust: "bg-orange-500",
    "C++": "bg-purple-500",
    "C#": "bg-blue-600",
    PHP: "bg-indigo-500",
    Ruby: "bg-red-600",
    Swift: "bg-orange-600",
    Kotlin: "bg-purple-600",
  };
  return colors[language || ""] || "bg-neutral-500";
};

export const AppSidebar = () => {
  const router = useRouter();
  const [selectedInstallationId, setSelectedInstallationId] = useState<
    number | null
  >(null);

  const {
    data: repositories,
    isLoading,
    error,
  } = trpc.github.getAllRepositories.useQuery();

  const filteredRepositories = useMemo(() => {
    if (!repositories) return [];
    if (selectedInstallationId === null) return repositories;
    return repositories.filter(
      (repo) => repo.installation_id === selectedInstallationId
    );
  }, [repositories, selectedInstallationId]);

  const handleRepositoryClick = (fullName: string) =>
    router.push(`/repo/${fullName.toLowerCase()}`);

  if (isLoading) {
    return (
      <Sidebar variant="sidebar">
        <SidebarHeader className="p-3 border-b">
          <div className="font-semibold text-xl text-neutral-900">
            PullSmith
          </div>
          <div className="text-xs text-neutral-500">
            Loading repositories...
          </div>
        </SidebarHeader>
        <SidebarContent className="bg-white gap-0">
          {/* Account Selector Skeleton */}
          <div className="px-2.5 py-3 sticky top-0 z-20 bg-white/90 backdrop-blur-sm">
            <div className="flex items-center justify-between w-full p-3 bg-white border border-neutral-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full bg-neutral-200" />
                <Skeleton className="h-4 w-20 bg-neutral-200" />
                <Skeleton className="h-4 w-6 bg-neutral-200 rounded-full" />
              </div>
              <Skeleton className="h-4 w-4 bg-neutral-200" />
            </div>
          </div>

          {/* Repository List Skeleton */}
          <SidebarGroup className="p-0 px-3 pb-2 overflow-y-hidden">
            <SidebarGroupLabel className="text-xs text-neutral-700 font-medium px-0 pl-1 h-fit">
              Repositories
            </SidebarGroupLabel>
            <SidebarGroupContent className="space-y-1">
              {Array.from({ length: 20 }, (_, index) => ({
                id: `skeleton-repo-${index}`,
                index,
              })).map((item) => (
                <SidebarMenuItem key={item.id}>
                  <div className="flex flex-col items-start gap-1 h-auto rounded-md bg-neutral-50 p-2">
                    {/* Repository name row */}
                    <div className="flex items-center gap-2 w-full">
                      <Skeleton className="h-3 w-3 bg-neutral-200" />
                      <Skeleton className="h-4 w-24 bg-neutral-200" />
                      <Skeleton className="h-3 w-3 bg-neutral-200" />
                    </div>

                    {/* Language, stars, forks row */}
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex items-center gap-1">
                        <Skeleton className="h-2 w-2 rounded-full bg-neutral-200" />
                        <Skeleton className="h-3 w-16 bg-neutral-200" />
                      </div>
                      <div className="flex items-center gap-1">
                        <Skeleton className="h-3 w-3 bg-neutral-200" />
                        <Skeleton className="h-3 w-4 bg-neutral-200" />
                      </div>
                      <div className="flex items-center gap-1">
                        <Skeleton className="h-3 w-3 bg-neutral-200" />
                        <Skeleton className="h-3 w-4 bg-neutral-200" />
                      </div>
                    </div>

                    {/* Updated date row */}
                    <div className="w-full">
                      <Skeleton className="h-3 w-20 bg-neutral-200" />
                    </div>
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-neutral-200 bg-neutral-50">
          <UserButton />
        </SidebarFooter>
      </Sidebar>
    );
  }

  if (error) {
    return (
      <Sidebar variant="sidebar">
        <SidebarHeader className="p-3 border-b">
          <div className="font-semibold text-xl text-neutral-900">
            PullSmith
          </div>
        </SidebarHeader>
        <SidebarContent className="p-4">
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
            Failed to load repositories
          </div>
        </SidebarContent>
        <SidebarFooter className="border-t border-neutral-200 bg-neutral-50">
          <UserButton />
        </SidebarFooter>
      </Sidebar>
    );
  }

  if (!repositories || repositories.length === 0) {
    return (
      <Sidebar variant="sidebar">
        <SidebarHeader className="p-3 border-b">
          <div className="font-semibold text-xl text-neutral-900">PullSmith</div>
          <div className="text-xs text-neutral-500">
            0 repositories available
          </div>
        </SidebarHeader>
        <SidebarContent className="p-4 flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-center max-w-sm">
            <GitBranch className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              No repositories found
            </h3>
            <p className="text-sm text-neutral-600 mb-6">
              To get started, install the PullSmith GitHub app on your repositories to enable AI-powered pull request reviews.
            </p>
            <a
              href="https://github.com/apps/pullsmith"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <GitBranch className="h-4 w-4" />
              Install PullSmith App
            </a>
          </div>
        </SidebarContent>
        <SidebarFooter className="border-t border-neutral-200 bg-neutral-50">
          <UserButton />
        </SidebarFooter>
      </Sidebar>
    );
  }

  return (
    <Sidebar variant="sidebar">
      <SidebarHeader className="p-3 border-b">
        <div className="font-semibold text-xl text-neutral-900">PullSmith</div>
        <div className="text-xs text-neutral-500">
          {repositories?.length || 0} repositories available
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-white gap-0">
        {/* Installation Selector */}
        <InstallationSelector
          selectedInstallationId={selectedInstallationId}
          onInstallationSelect={setSelectedInstallationId}
          repositoryCount={filteredRepositories.length}
        />

        {/* Repository List */}
        <SidebarGroup className="p-0 px-2 pb-2">
          <SidebarGroupLabel className="text-xs text-neutral-700 font-medium px-0 pl-2 h-fit">
            Repositories
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {filteredRepositories.map((repo) => (
              <SidebarMenuItem key={repo.id}>
                <SidebarMenuButton
                  onClick={() => handleRepositoryClick(repo.full_name)}
                  className="flex flex-col items-start gap-1 h-auto pr-2 py-2 hover:bg-neutral-100 rounded-md transition-colors group"
                >
                  <div className="flex items-center gap-2 w-full">
                    <GitBranch className="h-3 w-3 text-neutral-400 flex-shrink-0" />
                    <span className="text-sm font-medium truncate text-neutral-900 group-hover:text-neutral-700">
                      {repo.name}
                    </span>
                    {repo.private ? (
                      <Lock className="h-3 w-3 text-neutral-400 flex-shrink-0" />
                    ) : (
                      <Globe className="h-3 w-3 text-neutral-400 flex-shrink-0" />
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full text-xs text-neutral-500">
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
                      <Star className="h-3 w-3 text-neutral-400" />
                      <span>{repo.stargazers_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <GitFork className="h-3 w-3 text-neutral-400" />
                      <span>{repo.forks_count}</span>
                    </div>
                  </div>

                  <div className="text-xs text-neutral-500 w-full">
                    Updated {formatDate(repo.updated_at)}
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-neutral-200 bg-neutral-50">
        <UserButton />
      </SidebarFooter>
    </Sidebar>
  );
};
