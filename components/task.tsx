"use client";

import { formatDateShort } from "@/lib/github/utils";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";
import {
  Box,
  AlertCircle,
  CheckCircle2,
  Loader,
  X,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  FileText,
  Clock,
  Database,
  Target,
  Code,
  GitPullRequest,
  AlertTriangle,
  Info,
  Circle,
} from "lucide-react";
import { useSidebar } from "./ui/sidebar";
import { Button } from "./ui/button";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";

interface TaskProps {
  id: string;
}

interface LogEntry {
  event: string;
  data?: unknown;
  timestamp: string;
}

interface TaskStatus {
  taskId: string;
  status?: "running" | "completed" | "failed" | "cancelled" | "pending";
  currentStep?: string;
  task?: string;
  repository?: {
    id: string;
    url: string;
    name: string;
    baseBranch: string | null;
    currentMerkleRoot: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
  };
  prUrl?: string;
  branchName?: string;
  commitHash?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  completedAt?: Date | string;
}

interface ParsedLogEntry {
  id: string;
  timestamp: string;
  type: "step" | "data" | "error" | "metadata";
  step?: string;
  status: "pending" | "running" | "completed" | "failed";
  title: string;
  description?: string;
  data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  expandable?: boolean;
}

interface StepProgress {
  step: string;
  title: string;
  description: string;
  status: "pending" | "running" | "completed" | "failed";
  timestamp?: string;
  duration?: string;
  data?: Record<string, unknown>;
}

const WORKFLOW_STEPS = [
  {
    key: "indexing",
    title: "Index Codebase",
    description: "Analyzing repository structure",
  },
  {
    key: "sandbox",
    title: "Setup Sandbox",
    description: "Creating development environment",
  },
  {
    key: "planning",
    title: "Plan Changes",
    description: "Generating implementation plan",
  },
  { key: "editing", title: "Edit Files", description: "Implementing changes" },
  { key: "pr", title: "Create PR", description: "Creating pull request" },
];

const parseLogEntry = (log: LogEntry, index: number): ParsedLogEntry => {
  const data = log.data as Record<string, unknown>;

  // Handle metadata events
  if (log.event.includes("metadata")) {
    return {
      id: `${log.timestamp}-${index}`,
      timestamp: log.timestamp,
      type: "metadata",
      status: "completed",
      title: "Task Started",
      description: `Run ID: ${data?.run_id || "Unknown"}`,
      metadata: data,
      expandable: true,
    };
  }

  // Handle step transitions
  if (data?.currentStep) {
    const currentStep = data.currentStep as string;
    let step = "unknown";
    let title = "Processing";
    let status: ParsedLogEntry["status"] = "running";

    if (currentStep.includes("indexing")) {
      step = "indexing";
      title = currentStep.includes("complete")
        ? "Codebase Indexed"
        : "Indexing Failed";
      status = currentStep.includes("complete") ? "completed" : "failed";
    } else if (currentStep.includes("sandbox")) {
      step = "sandbox";
      title = currentStep.includes("ready")
        ? "Sandbox Ready"
        : "Sandbox Failed";
      status = currentStep.includes("ready") ? "completed" : "failed";
    } else if (currentStep.includes("planning")) {
      step = "planning";
      title = currentStep.includes("complete")
        ? "Planning Complete"
        : "Planning Failed";
      status = currentStep.includes("complete") ? "completed" : "failed";
    } else if (currentStep.includes("editing")) {
      step = "editing";
      title = currentStep.includes("complete")
        ? "Files Edited"
        : "Editing Failed";
      status = currentStep.includes("complete") ? "completed" : "failed";
    } else if (currentStep.includes("pr")) {
      step = "pr";
      title = currentStep.includes("created")
        ? "Pull Request Created"
        : "PR Creation Failed";
      status = currentStep.includes("created") ? "completed" : "failed";
    }

    return {
      id: `${log.timestamp}-${index}`,
      timestamp: log.timestamp,
      type: "step",
      step,
      status,
      title,
      description: getStepDescription(step, data),
      data,
      expandable: Object.keys(data).length > 2,
    };
  }

  // Default parsing for other events
  return {
    id: `${log.timestamp}-${index}`,
    timestamp: log.timestamp,
    type: "data",
    status: "completed",
    title: log.event,
    data,
    expandable: data && Object.keys(data).length > 0,
  };
};

const getStepDescription = (
  step: string,
  data: Record<string, unknown>
): string => {
  switch (step) {
    case "indexing": {
      const changedFiles = (data.changedFiles as string[]) || [];
      return changedFiles.length > 0
        ? `${changedFiles.length} files`
        : "No changes";
    }
    case "sandbox":
      return data.sandboxId ? "Environment ready" : "Configured";
    case "planning": {
      const plan = (data.plan as unknown[]) || [];
      return `${plan.length} actions`;
    }
    case "editing": {
      const editedFiles = (data.editedFiles as unknown[]) || [];
      return `${editedFiles.length} files`;
    }
    case "pr":
      return data.prUrl ? "PR created" : "Ready";
    default:
      return "";
  }
};

const getStepIcon = (status: string, size: "sm" | "md" = "md") => {
  const sizeClass = size === "sm" ? "size-3" : "size-4";

  if (status === "completed")
    return (
      <CheckCircle2 className={cn(sizeClass, "text-black dark:text-white")} />
    );
  if (status === "failed" || status === "cancelled")
    return (
      <AlertCircle className={cn(sizeClass, "text-black dark:text-white")} />
    );
  return (
    <Loader
      className={cn(sizeClass, "text-black dark:text-white animate-spin")}
    />
  );
};

const getStepIconForType = (
  type: string,
  status: string,
  size: "sm" | "md" = "md",
  isActive?: boolean
) => {
  const sizeClass = size === "sm" ? "size-3" : "size-4";

  if (status === "failed")
    return (
      <AlertTriangle className={cn(sizeClass, "text-black dark:text-white", isActive && "text-white dark:text-black")} />
    );
  if (status === "completed")
    return (
      <CheckCircle2 className={cn(sizeClass, "text-black dark:text-white", isActive && "text-white dark:text-black")} />
    );
  if (status === "running")
    return (
      <Loader
        className={cn(sizeClass, "text-black dark:text-white animate-spin", isActive && "text-white dark:text-black")}
      />
    );

  const iconClass = cn(sizeClass, "text-neutral-600 dark:text-neutral-400", isActive && "text-white dark:text-black");

  switch (type) {
    case "indexing":
      return <Database className={iconClass} />;
    case "sandbox":
      return <Box className={iconClass} />;
    case "planning":
      return <Target className={iconClass} />;
    case "editing":
      return <Code className={iconClass} />;
    case "pr":
      return <GitPullRequest className={iconClass} />;
    default:
      return <Info className={iconClass} />;
  }
};

const getStepText = (currentStep: string) => {
  const stepMap: Record<string, string> = {
    initializing: "Initializing...",
    indexing_started: "Indexing...",
    indexing_complete: "Indexed",
    indexing_failed: "Index failed",
    sandbox_ready: "Sandbox ready",
    sandbox_failed: "Sandbox failed",
    planning_complete: "Planned",
    planning_failed: "Planning failed",
    editing_complete: "Edited",
    editing_failed: "Editing failed",
    pr_created: "PR created",
    pr_failed: "PR failed",
  };
  return stepMap[currentStep] || currentStep;
};

const getStatusFromStep = (currentStep: string): TaskStatus["status"] => {
  if (currentStep?.includes("failed")) return "failed";
  if (currentStep === "pr_created") return "completed";
  return "running";
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.success("Copied");
};

const LogEntryComponent = ({
  entry,
  isExpanded,
  onToggle,
}: {
  entry: ParsedLogEntry;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const renderDataValue = (key: string, value: unknown): React.ReactNode => {
    if (typeof value === "string") {
      // Handle URLs
      if (value.startsWith("http")) {
        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-black dark:text-white hover:underline inline-flex items-center gap-1 text-xs font-mono"
          >
            {value}
            <ExternalLink className="size-2.5" />
          </a>
        );
      }
      // Handle file paths
      if (
        value.includes("/") &&
        (value.endsWith(".tsx") ||
          value.endsWith(".ts") ||
          value.endsWith(".js"))
      ) {
        return (
          <div className="flex items-center gap-2">
            <FileText className="size-3 text-neutral-500 dark:text-neutral-400" />
            <span className="font-mono text-xs text-black dark:text-white">
              {value}
            </span>
          </div>
        );
      }
      return (
        <span className="font-mono text-xs text-black dark:text-white">
          {value}
        </span>
      );
    }

    if (Array.isArray(value)) {
      return (
        <div className="space-y-1">
          {value.slice(0, 2).map((item, index) => (
            <div
              key={`${
                typeof item === "object" ? JSON.stringify(item) : String(item)
              }-${index}`}
              className="text-xs text-neutral-600 dark:text-neutral-400 font-mono"
            >
              {typeof item === "object"
                ? JSON.stringify(item, null, 2)
                : String(item)}
            </div>
          ))}
          {value.length > 2 && (
            <div className="text-xs text-neutral-500 dark:text-neutral-500">
              +{value.length - 2} more
            </div>
          )}
        </div>
      );
    }

    if (typeof value === "object" && value !== null) {
      return (
        <pre className="text-xs font-mono bg-neutral-50 dark:bg-neutral-900 p-2 rounded border overflow-auto max-h-24 text-black dark:text-white">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    return (
      <span className="text-xs font-mono text-black dark:text-white">
        {String(value)}
      </span>
    );
  };

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded bg-neutral-50 dark:bg-neutral-950/50">
      <div
        className={cn(
          "p-3 select-none",
          entry.expandable &&
            "cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-950"
        )}
        onClick={entry.expandable ? onToggle : undefined}
        onKeyDown={
          entry.expandable
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onToggle();
                }
              }
            : undefined
        }
        role={entry.expandable ? "button" : undefined}
        tabIndex={entry.expandable ? 0 : undefined}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getStepIconForType(entry.step || entry.type, entry.status, "sm")}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-black dark:text-white truncate">
                  {entry.title}
                </div>
                {entry.description && (
                  <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                    {entry.description}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-500">
                <Clock className="size-3" />
                {new Date(entry.timestamp).toLocaleTimeString("en-US", {
                  hour12: false,
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
                {entry.expandable &&
                  (isExpanded ? (
                    <ChevronDown className="size-3" />
                  ) : (
                    <ChevronRight className="size-3" />
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isExpanded && entry.expandable && (entry.data || entry.metadata) && (
        <div className="border-t border-neutral-200 dark:border-neutral-800 p-3 bg-neutral-50 dark:bg-neutral-950">
          <div className="space-y-3">
            {Object.entries(entry.data || entry.metadata || {}).map(
              ([key, value]) => (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium text-black dark:text-white uppercase tracking-wide">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </div>
                    {typeof value === "string" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(String(value))}
                        className="h-5 px-1 text-xs"
                      >
                        <Copy className="size-2.5" />
                      </Button>
                    )}
                  </div>
                  <div className="pl-2 border-l border-neutral-300 dark:border-neutral-700">
                    {renderDataValue(key, value)}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ProgressStep = ({
  step,
  status,
  isActive,
  isCompleted,
}: {
  step: (typeof WORKFLOW_STEPS)[0];
  status: StepProgress["status"];
  isActive: boolean;
  isCompleted: boolean;
}) => (
  <div
    className={cn(
      "flex items-center gap-3 p-3 border border-neutral-200 dark:border-neutral-800 rounded",
      isActive && "bg-black text-white dark:bg-white dark:text-black",
      status === "completed" &&
        !isActive &&
        "bg-neutral-50 dark:bg-neutral-950",
      status === "failed" &&
        "border-red-500 bg-red-50 dark:bg-red-950 dark:border-red-600"
    )}
  >
    <div className="flex-shrink-0">
      {status === "pending" ? (
        <Circle className="size-4 text-neutral-400 dark:text-neutral-900" />
      ) : (isActive) ? (
        <Loader className="size-4 text-white dark:text-black animate-spin" />
      ) : (
        getStepIconForType(step.key, status, "md", isActive)
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div
        className={cn(
          "text-sm font-medium",
          isActive && "text-white dark:text-black",
          !isActive && "text-black dark:text-white"
        )}
      >
        {step.title}
      </div>
      <div
        className={cn(
          "text-xs mt-0.5",
          isActive && "text-neutral-300 dark:text-neutral-700",
          !isActive && "text-neutral-600 dark:text-neutral-400"
        )}
      >
        {step.description}
      </div>
    </div>
  </div>
);

export const Task = ({ id }: TaskProps) => {
  const { open: sidebarOpen } = useSidebar();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [parsedLogs, setParsedLogs] = useState<ParsedLogEntry[]>([]);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [stepProgress, setStepProgress] = useState<
    Record<string, StepProgress["status"]>
  >({});
  const [isConnected, setIsConnected] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Parse logs whenever logs change
  useEffect(() => {
    const parsed = logs.map((log, index) => parseLogEntry(log, index));
    setParsedLogs(parsed);

    // Update step progress
    const progress: Record<string, StepProgress["status"]> = {};
    for (const entry of parsed) {
      if (entry.step && entry.type === "step") {
        progress[entry.step] = entry.status;
      }
    }
    setStepProgress(progress);
  }, [logs]);

  const stopTaskMutation = trpc.agent.stopTask.useMutation({
    onSuccess: () => {
      toast.success("Task stopped");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to stop task");
    },
  });

  trpc.agent.streamTask.useSubscription(
    { taskId: id },
    {
      onStarted: () => {
        setIsConnected(true);
      },
      onData: (data) => {
        // Add all events to logs
        const logEntry: LogEntry = {
          event: data.event,
          data: data.data,
          timestamp: new Date().toISOString(),
        };
        setLogs((prev) => [...prev, logEntry]);

        // Update task status based on event type and data
        if (data.data && typeof data.data === "object") {
          const eventData = data.data as Record<string, unknown>;

          // Handle completion events
          if (data.event === "task_completed") {
            setTaskStatus((prev) => ({
              taskId: id,
              status: "completed",
              currentStep: "pr_created",
              task: (eventData.task as string) || prev?.task,
              repository:
                (eventData.repository as TaskStatus["repository"]) ||
                prev?.repository,
              prUrl: (eventData.prUrl as string) || prev?.prUrl,
              branchName: (eventData.branchName as string) || prev?.branchName,
              commitHash: (eventData.commitHash as string) || prev?.commitHash,
              createdAt: (eventData.createdAt as Date) || prev?.createdAt,
              updatedAt: (eventData.updatedAt as Date) || prev?.updatedAt,
              completedAt: new Date(),
            }));
          }
          // Handle failure events
          else if (data.event === "task_failed") {
            setTaskStatus((prev) => ({
              taskId: id,
              status: "failed",
              currentStep:
                (eventData.currentStep as string) ||
                prev?.currentStep ||
                "failed",
              task: (eventData.task as string) || prev?.task,
              repository:
                (eventData.repository as TaskStatus["repository"]) ||
                prev?.repository,
              prUrl: (eventData.prUrl as string) || prev?.prUrl,
              branchName: (eventData.branchName as string) || prev?.branchName,
              commitHash: (eventData.commitHash as string) || prev?.commitHash,
              createdAt: (eventData.createdAt as Date) || prev?.createdAt,
              updatedAt: (eventData.updatedAt as Date) || prev?.updatedAt,
              completedAt: new Date(),
            }));
          }
          // Handle cancellation events
          else if (data.event === "task_cancelled") {
            setTaskStatus((prev) => ({
              taskId: id,
              status: "cancelled",
              currentStep:
                (eventData.currentStep as string) ||
                prev?.currentStep ||
                "cancelled",
              task: (eventData.task as string) || prev?.task,
              repository:
                (eventData.repository as TaskStatus["repository"]) ||
                prev?.repository,
              prUrl: (eventData.prUrl as string) || prev?.prUrl,
              branchName: (eventData.branchName as string) || prev?.branchName,
              commitHash: (eventData.commitHash as string) || prev?.commitHash,
              createdAt: (eventData.createdAt as Date) || prev?.createdAt,
              updatedAt: (eventData.updatedAt as Date) || prev?.updatedAt,
              completedAt: new Date(),
            }));
          }
          // Extract task status from LangGraph state updates (for running tasks)
          else if ("currentStep" in eventData || "task" in eventData) {
            setTaskStatus((prev) => ({
              taskId: id,
              status:
                getStatusFromStep(eventData.currentStep as string) ||
                prev?.status ||
                "running",
              currentStep:
                (eventData.currentStep as string) || prev?.currentStep,
              task: (eventData.task as string) || prev?.task,
              repository:
                (eventData.repository as TaskStatus["repository"]) ||
                prev?.repository,
              prUrl: (eventData.prUrl as string) || prev?.prUrl,
              branchName: (eventData.branchName as string) || prev?.branchName,
              commitHash: (eventData.commitHash as string) || prev?.commitHash,
              createdAt: (eventData.createdAt as Date) || prev?.createdAt,
              updatedAt: (eventData.updatedAt as Date) || prev?.updatedAt,
              completedAt: (eventData.completedAt as Date) || prev?.completedAt,
            }));
          }
        }
      },
      onError: (error) => {
        console.error("Stream error:", error);
        setIsConnected(false);
        toast.error("Connection lost");
      },
      onComplete: () => {
        setIsConnected(false);
      },
    }
  );

  const handleStopTask = () => {
    stopTaskMutation.mutate({ taskId: id });
  };

  const toggleLogExpansion = (logId: string) => {
    setExpandedLogs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [parsedLogs.length]);

  const currentStepIndex = WORKFLOW_STEPS.findIndex((step) =>
    taskStatus?.currentStep?.includes(step.key)
  );

  if (!isConnected && !taskStatus) {
    return (
      <div
        className={cn(
          "flex h-dvh min-w-0 flex-col fixed inset-0 transition-[left] duration-200 ease-linear bg-neutral-50 dark:bg-neutral-950/50",
          sidebarOpen ? "left-[var(--sidebar-width)]" : "left-0"
        )}
      >
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4">
            <Loader className="size-6 text-black dark:text-white animate-spin" />
            <div className="text-center">
              <div className="text-sm font-medium text-black dark:text-white">
                Connecting
              </div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                Establishing connection...
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-dvh min-w-0 flex-col bg-neutral-50 dark:bg-neutral-950/50 fixed inset-0 transition-[left] duration-200 ease-linear",
        sidebarOpen ? "left-[var(--sidebar-width)]" : "left-0"
      )}
    >
      {/* Header - 56px height (14 * 4px) */}
      <div className="flex h-14 items-center gap-4 border-b border-neutral-200 px-4 dark:border-neutral-800">
        <div className="p-2 border border-neutral-200 dark:border-neutral-800 rounded">
          <Box
            className="size-5 text-black dark:text-white"
            strokeWidth={1.5}
          />
        </div>

        <div className="flex flex-col justify-center flex-1">
          <div className="text-sm font-medium text-black dark:text-white">
            Task / {id}
          </div>
          <div className="text-xs text-neutral-600 dark:text-neutral-400">
            {taskStatus?.createdAt
              ? formatDateShort(
                  typeof taskStatus.createdAt === "string"
                    ? taskStatus.createdAt
                    : taskStatus.createdAt.toISOString()
                )
              : "Loading..."}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Current Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 border border-neutral-200 dark:border-neutral-800 rounded">
            {getStepIcon(taskStatus?.status || "running", "sm")}
            <div className="text-xs font-medium text-black dark:text-white">
              {getStepText(taskStatus?.currentStep || "initializing")}
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "size-2 rounded-full",
                isConnected
                  ? "bg-black dark:bg-white"
                  : "bg-neutral-400 dark:bg-neutral-600"
              )}
            />
            <span className="text-xs text-neutral-600 dark:text-neutral-400">
              {isConnected ? "Live" : "Offline"}
            </span>
          </div>

          {/* Stop Button */}
          {(taskStatus?.status === "running" ||
            taskStatus?.status === "pending") && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStopTask}
              disabled={stopTaskMutation.isPending}
              className="h-7 px-3 text-xs border-neutral-200 dark:border-neutral-800"
            >
              <X className="size-3 mr-1" />
              Stop
            </Button>
          )}
        </div>
      </div>

      {/* Main Content - Grid with 4px gaps */}
      <div className="flex-1 grid grid-cols-3 gap-4 p-4 overflow-hidden">
        {/* Progress Overview */}
        <div className="flex flex-col gap-3 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-black dark:text-white">
              Progress
            </div>
            <div className="text-xs text-neutral-600 dark:text-neutral-400">
              {Math.max(0, currentStepIndex + 1)}/{WORKFLOW_STEPS.length}
            </div>
          </div>

          <div className="space-y-2">
            {WORKFLOW_STEPS.map((step, index) => {
              const status = stepProgress[step.key] || "pending";
              const isActive = index === currentStepIndex;
              const isCompleted =
                index < currentStepIndex || status === "completed";

              return (
                <ProgressStep
                  key={step.key}
                  step={step}
                  status={status}
                  isActive={isActive}
                  isCompleted={isCompleted}
                />
              );
            })}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="col-span-2 flex flex-col gap-3 overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-black dark:text-white">
              Activity
            </div>
            <div className="text-xs text-neutral-600 dark:text-neutral-400">
              {parsedLogs.length} events
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {parsedLogs.length === 0 ? (
              <div className="flex items-center justify-center h-32 border border-dashed border-neutral-300 dark:border-neutral-700 rounded">
                <div className="text-center">
                  <Loader className="size-5 text-neutral-400 dark:text-neutral-600 mx-auto mb-2 animate-spin" />
                  <div className="text-xs text-neutral-600 dark:text-neutral-400">
                    Waiting for activity...
                  </div>
                </div>
              </div>
            ) : (
              parsedLogs.map((entry) => (
                <LogEntryComponent
                  key={entry.id}
                  entry={entry}
                  isExpanded={expandedLogs.has(entry.id)}
                  onToggle={() => toggleLogExpansion(entry.id)}
                />
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};
