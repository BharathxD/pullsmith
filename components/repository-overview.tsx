"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimeAgo, getLanguageColor } from "@/lib/github/utils";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Bug,
  Eye,
  FileText,
  GitCommit,
  GitFork,
  Globe,
  Lock,
  Plus,
  Star,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSidebar } from "./ui/sidebar";
import Link from "next/link";
import {
  LastCommitSkeleton,
  RepositoryHeaderSkeleton,
  RepositoryStatsSkeleton,
} from "./skeletons/repository-overview";

interface RepositoryOverviewProps {
  owner: string;
  repo: string;
}

interface ExamplePrompt {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface RepoStat {
  icon: React.ReactNode;
  value: string | number;
  label?: string;
  key: string;
}

interface RepositoryDetails {
  name: string;
  description?: string | null;
  private: boolean;
  language?: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  size: number;
  recent_commits?: CommitData[];
}

interface CommitData {
  url: string;
  message: string;
  sha: string;
  author?: {
    name?: string;
    date?: string;
  };
}

const EXAMPLE_PROMPTS: ExamplePrompt[] = [
  {
    icon: <Bug className="h-3.5 w-3.5" />,
    title: "Fix a bug",
    description:
      "Identify and fix the authentication issue in the login component",
  },
  {
    icon: <Plus className="h-3.5 w-3.5" />,
    title: "Add a feature",
    description:
      "Add a search functionality to the user dashboard with filters",
  },
  {
    icon: <Zap className="h-3.5 w-3.5" />,
    title: "Optimize performance",
    description: "Reduce bundle size and improve loading times",
  },
];

const TEXTAREA_CONFIG = {
  minHeight: "42px",
  maxHeight: "184px",
  placeholder:
    "Describe what you'd like me to build, fix, or improve in this repository. I'll analyze the code and create a plan to complete your request. You can also use the examples below to get started.",
};

interface RepositoryHeaderProps {
  repoDetails?: RepositoryDetails;
  isLoading: boolean;
}

const RepositoryHeader = ({
  repoDetails,
  isLoading,
}: RepositoryHeaderProps) => {
  if (isLoading) {
    return <RepositoryHeaderSkeleton />;
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-medium text-neutral-900 tracking-tight">
          {repoDetails?.name}
        </h1>
        <Badge
          variant="outline"
          className="border-neutral-200/80 text-neutral-600 bg-white/90 text-xs font-medium px-2 py-0.5 h-6 shadow-2xs"
        >
          {repoDetails?.private ? (
            <>
              <Lock className="h-3 w-3 mr-1 text-neutral-500" /> Private
            </>
          ) : (
            <>
              <Globe className="h-3 w-3 mr-1 text-neutral-500" /> Public
            </>
          )}
        </Badge>
      </div>
      {repoDetails?.description && (
        <p className="text-sm leading-relaxed max-w-4xl text-neutral-600/90">
          {repoDetails.description}
        </p>
      )}
    </>
  );
};

interface RepositoryStatsProps {
  repoDetails: RepositoryDetails;
}

const RepositoryStats = ({ repoDetails }: RepositoryStatsProps) => {
  const stats: RepoStat[] = [
    {
      key: "language",
      icon: repoDetails?.language && (
        <div
          className={cn(
            "w-2 h-2 rounded-full",
            getLanguageColor(repoDetails.language)
          )}
        />
      ),
      value: repoDetails?.language || "",
      label: "text-neutral-700 font-medium",
    },
    {
      key: "stars",
      icon: <Star className="h-3 w-3 text-neutral-400/80" />,
      value: repoDetails?.stargazers_count || 0,
    },
    {
      key: "forks",
      icon: <GitFork className="h-3 w-3 text-neutral-400/80" />,
      value: repoDetails?.forks_count || 0,
    },
    {
      key: "watchers",
      icon: <Eye className="h-3 w-3 text-neutral-400/80" />,
      value: repoDetails?.watchers_count || 0,
    },
    {
      key: "size",
      icon: <FileText className="h-3 w-3 text-neutral-400/80" />,
      value: repoDetails?.size
        ? `${Math.round(repoDetails.size / 1024)} MB`
        : "0 MB",
    },
  ];

  return (
    <div className="flex items-center gap-4 text-xs text-neutral-600">
      {stats.map((stat) => (
        <div key={stat.key} className="flex items-center gap-1.5">
          {stat.icon}
          <span className={cn("font-medium text-neutral-600", stat.label)}>
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
};

interface LastCommitProps {
  commit: CommitData;
}

const LastCommit = ({ commit }: LastCommitProps) => (
  <Link
    href={commit.url}
    target="_blank"
    rel="noreferrer"
    className={cn(
      "border border-neutral-200/70 bg-white/95 backdrop-blur-sm rounded-lg transition-all duration-200",
      "block py-2 px-3 hover:border-neutral-300/80 hover:bg-white"
    )}
  >
    <div className="flex items-center gap-2.5">
      <GitCommit className="h-4 w-4 text-neutral-400/90 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-neutral-900 font-medium truncate">
          {commit.message.split("\n")[0]}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-neutral-500/90 mt-0.5">
          <span className="font-medium text-neutral-600">
            {commit.author?.name}
          </span>
          <span className="text-neutral-400/90">
            committed {formatTimeAgo(commit.author?.date)}
          </span>
        </div>
      </div>
      <code className="text-neutral-500/90 bg-neutral-100/80 px-1.5 py-0.5 rounded font-mono text-xs shadow-inner">
        {commit.sha.substring(0, 7)}
      </code>
    </div>
  </Link>
);

interface TaskInputProps {
  taskInput: string;
  setTaskInput: (value: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onSubmit: () => void;
}

const TaskInput = ({
  taskInput,
  setTaskInput,
  textareaRef,
  onSubmit,
}: TaskInputProps) => (
  <form
    className={cn(
      "border border-neutral-200/70 bg-white/95 backdrop-blur-sm rounded-lg transition-all duration-200",
      "relative w-full rounded-xl shadow-xs focus-within:border-neutral-300/90 focus-within:shadow-sm"
    )}
  >
    <textarea
      ref={textareaRef}
      placeholder={TEXTAREA_CONFIG.placeholder}
      value={taskInput}
      onChange={(e) => setTaskInput(e.target.value)}
      style={{
        minHeight: TEXTAREA_CONFIG.minHeight,
        maxHeight: TEXTAREA_CONFIG.maxHeight,
      }}
      className="w-full flex-1 text-sm resize-none overflow-auto p-2 pb-1.5 text-neutral-900 outline-none ring-0 transition-colors duration-200 placeholder:text-neutral-400/80 disabled:opacity-50 sm:p-3 bg-transparent"
    />
    <div className="flex justify-end p-2">
      <Button
        type="submit"
        size="icon"
        className="rounded-md bg-neutral-900 text-white transition-all duration-200 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 shadow-xs"
        onClick={onSubmit}
        disabled={!taskInput.trim()}
      >
        <ArrowRight className="size-4" />
      </Button>
    </div>
  </form>
);

interface ExamplePromptsProps {
  onPromptSelect: (description: string) => void;
}

const ExamplePrompts = ({ onPromptSelect }: ExamplePromptsProps) => (
  <div className="space-y-4 text-left">
    <h3 className="text-sm font-medium text-neutral-800">
      Need inspiration? Try these examples:
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {EXAMPLE_PROMPTS.map((prompt) => (
        <button
          key={prompt.title}
          type="button"
          className={cn(
            "border border-neutral-200/70 bg-white/95 backdrop-blur-sm rounded-lg transition-all duration-200",
            "hover:border-neutral-300/80 hover:bg-white hover:shadow-xs cursor-pointer group p-4 text-left w-full"
          )}
          onClick={() => onPromptSelect(prompt.description)}
          aria-label={`Use example prompt: ${prompt.title}`}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-neutral-100/80 rounded-md transition-colors duration-200 group-hover:bg-neutral-200/90">
              {prompt.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-neutral-900 mb-1 text-sm">
                {prompt.title}
              </h4>
              <p className="text-xs leading-relaxed text-neutral-600/90">
                {prompt.description}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  </div>
);

export const RepositoryOverview = ({
  owner,
  repo,
}: RepositoryOverviewProps) => {
  const [taskInput, setTaskInput] = useState("");
  const { open: sidebarOpen } = useSidebar();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: repositoryData, isLoading: isLoadingRepo } =
    trpc.github.getRepositoryDetails.useQuery({ owner, repo });

  const handleTaskSubmit = () => {
    // TODO: Implement task processing
    console.log("Starting work on:", taskInput);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [taskInput]);

  const mostRecentCommit = repositoryData?.recent_commits?.[0];

  return (
    <div
      className={cn(
        "flex h-dvh min-w-0 flex-col bg-neutral-50/50 fixed inset-0 transition-[left] duration-200 ease-linear",
        sidebarOpen ? "left-[var(--sidebar-width)]" : "left-0"
      )}
    >
      <div className="flex-1 flex flex-col justify-center max-w-4xl mx-auto px-4 py-8 w-full overflow-y-auto space-y-4">
        {/* Repository metadata */}
        <section className="space-y-4">
          <RepositoryHeader
            repoDetails={repositoryData}
            isLoading={isLoadingRepo}
          />

          {isLoadingRepo ? (
            <>
              <RepositoryStatsSkeleton />
              <LastCommitSkeleton />
            </>
          ) : (
            repositoryData && (
              <>
                <RepositoryStats repoDetails={repositoryData} />
                {mostRecentCommit && <LastCommit commit={mostRecentCommit} />}
              </>
            )
          )}
        </section>

        {/* Task input */}
        <TaskInput
          taskInput={taskInput}
          setTaskInput={setTaskInput}
          textareaRef={textareaRef}
          onSubmit={handleTaskSubmit}
        />

        {/* Example prompts */}
        <ExamplePrompts onPromptSelect={setTaskInput} />
      </div>
    </div>
  );
};
