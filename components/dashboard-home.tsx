"use client";

import { trpc } from "@/lib/trpc/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GitBranch,
  Star,
  GitFork,
  Calendar,
  Building2,
  User,
} from "lucide-react";

export const DashboardHome = () => {
  const { data: repositories, isLoading } =
    trpc.github.getAllRepositories.useQuery();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getLanguageColor = (language: string | null) => {
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

  const accounts = repositories?.reduce((acc, repo) => {
    const accountLogin = repo.account.login;
    if (!acc[accountLogin]) {
      acc[accountLogin] = {
        account: repo.account,
        count: 0,
        languages: new Set<string>(),
        totalStars: 0,
      };
    }
    acc[accountLogin].count++;
    if (repo.language) {
      acc[accountLogin].languages.add(repo.language);
    }
    acc[accountLogin].totalStars += repo.stargazers_count;
    return acc;
  }, {} as Record<string, { account: { id?: number; login: string; avatar_url?: string; type: string }; count: number; languages: Set<string>; totalStars: number }>);

  const recentRepositories = repositories?.slice(0, 6) || [];

  return (
    <main className="min-h-screen w-full p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Section */}
        <div className="space-y-3 px-1">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Welcome to Pullsmith
          </h1>
          <p className="text-neutral-600 text-lg">
            Your AI-powered coding assistant. Select a repository from the
            sidebar to get started.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-neutral-200 bg-white shadow-xs hover:shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-neutral-700">
                Total Repositories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-neutral-900">
                {isLoading ? (
                  <Skeleton className="h-8 w-16 bg-neutral-200" />
                ) : (
                  repositories?.length || 0
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Across all accounts
              </p>
            </CardContent>
          </Card>

          <Card className="border-neutral-200 bg-white shadow-xs hover:shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-neutral-700">
                Connected Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-neutral-900">
                {isLoading ? (
                  <Skeleton className="h-8 w-16 bg-neutral-200" />
                ) : (
                  Object.keys(accounts || {}).length
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                GitHub installations
              </p>
            </CardContent>
          </Card>

          <Card className="border-neutral-200 bg-white shadow-xs hover:shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-neutral-700">
                Total Stars
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-neutral-900">
                {isLoading ? (
                  <Skeleton className="h-8 w-16 bg-neutral-200" />
                ) : (
                  Object.values(accounts || {}).reduce(
                    (sum, account) => sum + account.totalStars,
                    0
                  )
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Community engagement
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Repositories */}
        <div className="space-y-5">
          <div className="px-1">
            <h2 className="text-xl font-semibold text-neutral-900">
              Recent Repositories
            </h2>
            <p className="text-sm text-neutral-600 mt-1">
              Your most recently updated repositories
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading
              ? [
                  "repo-1",
                  "repo-2",
                  "repo-3",
                  "repo-4",
                  "repo-5",
                  "repo-6",
                ].map((id) => (
                  <Card
                    key={`skeleton-${id}`}
                    className="border-neutral-200 bg-white"
                  >
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4 bg-neutral-200" />
                      <Skeleton className="h-4 w-full bg-neutral-100" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-1/2 bg-neutral-100" />
                        <Skeleton className="h-4 w-2/3 bg-neutral-100" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              : recentRepositories.map((repo) => (
                  <Card
                    key={repo.id}
                    className="border-neutral-200 bg-white hover:shadow-sm hover:border-neutral-300 transition-all duration-200 group"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg truncate text-neutral-900 group-hover:text-neutral-700">
                          {repo.name}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className="text-xs border-neutral-200 text-neutral-600 bg-neutral-50"
                        >
                          {repo.account.type === "User" ? (
                            <User className="h-3 w-3 mr-1" />
                          ) : (
                            <Building2 className="h-3 w-3 mr-1" />
                          )}
                          {repo.account.login}
                        </Badge>
                      </div>
                      {repo.description && (
                        <CardDescription className="text-sm line-clamp-2 text-neutral-600">
                          {repo.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-neutral-500">
                        <div className="flex items-center space-x-3">
                          {repo.language && (
                            <div className="flex items-center space-x-1">
                              <div
                                className={`w-3 h-3 rounded-full ${getLanguageColor(
                                  repo.language
                                )}`}
                              />
                              <span className="text-neutral-600">
                                {repo.language}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-neutral-400" />
                            <span>{repo.stargazers_count}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <GitFork className="h-3 w-3 text-neutral-400" />
                            <span>{repo.forks_count}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-neutral-400" />
                          <span>{formatDate(repo.updated_at)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
          </div>
        </div>

        {/* Connected Accounts */}
        <div className="space-y-5">
          <div className="px-1">
            <h2 className="text-xl font-semibold text-neutral-900">
              Connected Accounts
            </h2>
            <p className="text-sm text-neutral-600 mt-1">
              GitHub accounts with installed app access
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading
              ? ["account-1", "account-2"].map((id) => (
                  <Card
                    key={`skeleton-${id}`}
                    className="border-neutral-200 bg-white"
                  >
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <Skeleton className="h-10 w-10 rounded-full bg-neutral-200" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24 bg-neutral-200" />
                          <Skeleton className="h-3 w-16 bg-neutral-100" />
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              : Object.values(accounts || {}).map((accountData) => (
                  <Card
                    key={accountData.account.login}
                    className="border-neutral-200 bg-white hover:shadow-sm hover:border-neutral-300 transition-all duration-200"
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center border border-neutral-200">
                            {accountData.account.type === "User" ? (
                              <User className="h-5 w-5 text-neutral-600" />
                            ) : (
                              <Building2 className="h-5 w-5 text-neutral-600" />
                            )}
                          </div>
                          <div>
                            <CardTitle className="text-base text-neutral-900">
                              {accountData.account.login}
                            </CardTitle>
                            <CardDescription className="text-neutral-600">
                              {accountData.account.type}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="border-neutral-200 text-neutral-600 bg-neutral-50"
                        >
                          {accountData.count}{" "}
                          {accountData.count === 1 ? "repo" : "repos"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-neutral-500">
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-neutral-400" />
                          <span>{accountData.totalStars} stars</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <GitBranch className="h-3 w-3 text-neutral-400" />
                          <span>{accountData.languages.size} languages</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
          </div>
        </div>
      </div>
    </main>
  );
};
