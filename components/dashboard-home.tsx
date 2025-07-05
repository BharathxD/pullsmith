"use client";

import { trpc } from "@/lib/trpc/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, getLanguageColor } from "@/lib/github/utils";
import {
  GitBranch,
  Star,
  GitFork,
  Calendar,
  Building2,
  User,
  Library,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Repository {
  id: number;
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string | null;
  account: Account;
}

interface Account {
  id?: number;
  login: string;
  avatar_url?: string;
  type: string;
}

interface AccountData {
  account: Account;
  count: number;
  languages: Set<string>;
  totalStars: number;
}

const StatCardSkeleton = () => (
  <section className="rounded-lg shadow-2xs border border-neutral-200/70 bg-white/95 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-950/90">
    <div className="p-4 pb-3 flex justify-between items-start">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-4 w-4" />
    </div>
    <div className="p-4 pt-0">
      <Skeleton className="h-9 w-16" />
      <Skeleton className="h-4 w-20 mt-1" />
    </div>
  </section>
);

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
}

const StatCard = ({ title, value, description, icon }: StatCardProps) => (
  <section
    className={cn(
      "rounded-lg shadow-2xs border border-neutral-200/70 bg-white/95 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/50",
      "transition-all duration-200 hover:border-neutral-300/80 hover:shadow-xs dark:hover:border-neutral-700"
    )}
  >
    <div className="p-4 pb-3 flex justify-between items-start">
      <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-400">
        {title}
      </h3>
      {icon}
    </div>
    <div className="p-4 pt-0">
      <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
        {value}
      </div>
      <p className="text-xs text-neutral-500/90 mt-1 dark:text-neutral-500">
        {description}
      </p>
    </div>
  </section>
);

const RepositoryCardSkeleton = () => (
  <section className="rounded-lg shadow-2xs border border-neutral-200/70 bg-white/95 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-950/90 flex flex-col justify-between">
    <div className="p-4 pb-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="space-y-1 mt-1.5 h-[40px]">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-1/2" />
      </div>
    </div>
    <div className="p-4 pt-0 mt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  </section>
);

interface RepositoryCardProps {
  repo: Repository;
}

const RepositoryCard = ({ repo }: RepositoryCardProps) => (
  <Link
    key={repo.id}
    href={`/repositories/${repo.account.login}/${repo.name}`.toLowerCase()}
    className={cn(
      "rounded-lg shadow-2xs border border-neutral-200/70 bg-white/95 backdrop-blur-sm group dark:border-neutral-800 dark:bg-neutral-900/50",
      "transition-all duration-200 hover:border-neutral-300/80 hover:shadow-xs flex flex-col justify-between dark:hover:border-neutral-700"
    )}
  >
    <div className="p-4 pb-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg truncate text-neutral-900 group-hover:text-neutral-700 font-semibold dark:text-neutral-100 dark:group-hover:text-neutral-300">
          {repo.name}
        </h3>
        <Badge
          variant="outline"
          className="border-neutral-200/80 text-neutral-600 bg-white/90 shadow-2xs text-xs dark:border-neutral-800 dark:text-neutral-400 dark:bg-neutral-900"
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
        <p className="text-sm line-clamp-2 text-neutral-600/90 mt-1.5 h-[40px] dark:text-neutral-400">
          {repo.description}
        </p>
      )}
    </div>
    <div className="p-4 pt-0 mt-2">
      <div className="flex items-center justify-between text-sm text-neutral-500/90 dark:text-neutral-500">
        <div className="flex items-center space-x-3">
          {repo.language && (
            <div className="flex items-center space-x-1">
              <div
                className={`w-3 h-3 rounded-full ${getLanguageColor(
                  repo.language
                )}`}
              />
              <span className="text-neutral-600/90 dark:text-neutral-400">
                {repo.language}
              </span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <Star className="h-3 w-3 text-neutral-400/80 dark:text-neutral-500" />
            <span>{repo.stargazers_count}</span>
          </div>
          <div className="flex items-center space-x-1">
            <GitFork className="h-3 w-3 text-neutral-400/80 dark:text-neutral-500" />
            <span>{repo.forks_count}</span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Calendar className="h-3 w-3 text-neutral-400/80 dark:text-neutral-500" />
          <span>{formatDate(repo.updated_at)}</span>
        </div>
      </div>
    </div>
  </Link>
);

const AccountCardSkeleton = () => (
  <section className="rounded-lg shadow-2xs border border-neutral-200/70 bg-white/95 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/50">
    <div className="p-4 pb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
    </div>
    <div className="p-4 pt-0">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
  </section>
);

interface AccountCardProps {
  accountData: AccountData;
}

const AccountCard = ({ accountData }: AccountCardProps) => (
  <section
    key={accountData.account.login}
    className={cn(
      "rounded-lg shadow-2xs border border-neutral-200/70 bg-white/95 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/50",
      "transition-all duration-200 hover:border-neutral-300/80 hover:shadow-xs dark:hover:border-neutral-700"
    )}
  >
    <div className="p-4 pb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center border border-neutral-200/80 dark:bg-neutral-900 dark:border-neutral-800">
            {accountData.account.type === "User" ? (
              <User className="h-5 w-5 text-neutral-600/90 dark:text-neutral-400" />
            ) : (
              <Building2 className="h-5 w-5 text-neutral-600/90 dark:text-neutral-400" />
            )}
          </div>
          <div>
            <h3 className="text-base text-neutral-900 font-semibold dark:text-neutral-100">
              {accountData.account.login}
            </h3>
            <p className="text-neutral-600/90 text-sm mt-0.5 dark:text-neutral-400">
              {accountData.account.type}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="border-neutral-200/80 text-neutral-600 bg-white/90 shadow-2xs text-sm dark:border-neutral-800 dark:text-neutral-400 dark:bg-neutral-900"
        >
          {accountData.count} {accountData.count === 1 ? "repo" : "repos"}
        </Badge>
      </div>
    </div>
    <div className="p-4 pt-0">
      <div className="flex items-center justify-between text-sm text-neutral-500/90 dark:text-neutral-500">
        <div className="flex items-center space-x-1">
          <Star className="h-3 w-3 text-neutral-400/80 dark:text-neutral-500" />
          <span>{accountData.totalStars} stars</span>
        </div>
        <div className="flex items-center space-x-1">
          <GitBranch className="h-3 w-3 text-neutral-400/80 dark:text-neutral-500" />
          <span>{accountData.languages.size} languages</span>
        </div>
      </div>
    </div>
  </section>
);

const DashboardHeader = () => (
  <div className="space-y-3 px-1">
    <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
      Welcome to Pullsmith
    </h1>
    <p className="text-neutral-600/90 text-base dark:text-neutral-400">
      Your AI-powered coding assistant. Select a repository from the sidebar to
      get started.
    </p>
  </div>
);

interface DashboardStatsProps {
  repositories: Repository[];
  accounts: Record<string, AccountData>;
  isLoading: boolean;
}

const DashboardStats = ({
  repositories,
  accounts,
  isLoading,
}: DashboardStatsProps) => {
  const totalStars = Object.values(accounts || {}).reduce(
    (sum, account) => sum + account.totalStars,
    0
  );

  const stats = [
    {
      title: "Total Repositories",
      value: repositories?.length || 0,
      description: "Across all accounts",
      icon: (
        <Library className="h-4 w-4 text-neutral-500 dark:text-neutral-500" />
      ),
    },
    {
      title: "Connected Accounts",
      value: Object.keys(accounts || {}).length,
      description: "GitHub installations",
      icon: (
        <Users className="h-4 w-4 text-neutral-500 dark:text-neutral-500" />
      ),
    },
    {
      title: "Total Stars",
      value: totalStars,
      description: "Community engagement",
      icon: <Star className="h-4 w-4 text-neutral-500 dark:text-neutral-500" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {isLoading
        ? [
            <StatCardSkeleton key="stat-skeleton-1" />,
            <StatCardSkeleton key="stat-skeleton-2" />,
            <StatCardSkeleton key="stat-skeleton-3" />,
          ]
        : stats.map((stat) => <StatCard key={stat.title} {...stat} />)}
    </div>
  );
};

interface RecentRepositoriesProps {
  repositories: Repository[];
  isLoading: boolean;
}

const RecentRepositories = ({
  repositories,
  isLoading,
}: RecentRepositoriesProps) => (
  <div className="space-y-5">
    <div className="px-1">
      <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
        Recent Repositories
      </h2>
      <p className="text-sm text-neutral-600/90 mt-1 dark:text-neutral-400">
        Your most recently updated repositories
      </p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {isLoading
        ? [
            <RepositoryCardSkeleton key="repo-skeleton-1" />,
            <RepositoryCardSkeleton key="repo-skeleton-2" />,
            <RepositoryCardSkeleton key="repo-skeleton-3" />,
            <RepositoryCardSkeleton key="repo-skeleton-4" />,
            <RepositoryCardSkeleton key="repo-skeleton-5" />,
            <RepositoryCardSkeleton key="repo-skeleton-6" />,
          ]
        : repositories.map((repo) => (
            <RepositoryCard key={repo.id} repo={repo} />
          ))}
    </div>
  </div>
);

interface ConnectedAccountsProps {
  accounts: Record<string, AccountData>;
  isLoading: boolean;
}

const ConnectedAccounts = ({ accounts, isLoading }: ConnectedAccountsProps) => (
  <div className="space-y-5">
    <div className="px-1">
      <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
        Connected Accounts
      </h2>
      <p className="text-sm text-neutral-600/90 mt-1 dark:text-neutral-400">
        GitHub accounts with installed app access
      </p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {isLoading
        ? [
            <AccountCardSkeleton key="account-skeleton-1" />,
            <AccountCardSkeleton key="account-skeleton-2" />,
          ]
        : Object.values(accounts || {}).map((accountData) => (
            <AccountCard
              key={accountData.account.login}
              accountData={accountData}
            />
          ))}
    </div>
  </div>
);

export const DashboardHome = () => {
  const { data: repositories, isLoading } =
    trpc.github.getAllRepositories.useQuery();

  const accounts = (repositories || []).reduce((acc, repo) => {
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
  }, {} as Record<string, AccountData>);

  const recentRepositories = (repositories || []).slice(0, 6);

  return (
    <main className="min-h-screen w-full p-6 bg-neutral-50 dark:bg-neutral-950/50">
      <div className="max-w-6xl mx-auto space-y-8 pt-16">
        <DashboardHeader />
        <DashboardStats
          repositories={repositories || []}
          accounts={accounts}
          isLoading={isLoading}
        />
        <RecentRepositories
          repositories={recentRepositories}
          isLoading={isLoading}
        />
        <ConnectedAccounts accounts={accounts} isLoading={isLoading} />
      </div>
    </main>
  );
};
