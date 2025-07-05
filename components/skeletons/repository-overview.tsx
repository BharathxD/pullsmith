"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const RepositoryHeaderSkeleton = () => (
  <>
    <div className="flex items-center gap-3">
      <Skeleton className="h-8 w-64 bg-neutral-200/70 dark:bg-neutral-800/50" />
      <Skeleton className="h-6 w-24 bg-neutral-200/70 dark:bg-neutral-800/50" />
    </div>
    <Skeleton className="h-6 w-96 bg-neutral-100/80 dark:bg-neutral-800/30" />
  </>
);

export const RepositoryStatsSkeleton = () => (
  <div className="flex items-center gap-3">
    <div className="flex items-center gap-1.5">
      <Skeleton className="h-2 w-2 rounded-full bg-neutral-200/70 dark:bg-neutral-800/50" />
      <Skeleton className="h-4 w-16 bg-neutral-100/80 dark:bg-neutral-800/30" />
    </div>
    <div className="flex items-center gap-1.5">
      <Skeleton className="h-3 w-3 bg-neutral-200/70 dark:bg-neutral-800/50" />
      <Skeleton className="h-4 w-8 bg-neutral-100/80 dark:bg-neutral-800/30" />
    </div>
    <div className="flex items-center gap-1.5">
      <Skeleton className="h-3 w-3 bg-neutral-200/70 dark:bg-neutral-800/50" />
      <Skeleton className="h-4 w-8 bg-neutral-100/80 dark:bg-neutral-800/30" />
    </div>
    <div className="flex items-center gap-1.5">
      <Skeleton className="h-3 w-3 bg-neutral-200/70 dark:bg-neutral-800/50" />
      <Skeleton className="h-4 w-8 bg-neutral-100/80 dark:bg-neutral-800/30" />
    </div>
    <div className="flex items-center gap-1.5">
      <Skeleton className="h-3 w-3 bg-neutral-200/70 dark:bg-neutral-800/50" />
      <Skeleton className="h-4 w-12 bg-neutral-100/80 dark:bg-neutral-800/30" />
    </div>
  </div>
);

export const LastCommitSkeleton = () => (
  <div
    className={cn(
      "border border-neutral-200/70 bg-white/95 rounded-lg dark:border-neutral-800 dark:bg-neutral-900/50",
      "block py-2 px-3"
    )}
  >
    <div className="flex items-center gap-1.5">
      <Skeleton className="size-4 flex-shrink-0 bg-neutral-200/70 dark:bg-neutral-800/50" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <Skeleton className="h-4 w-3/4 bg-neutral-100/80 dark:bg-neutral-800/30" />
        <Skeleton className="h-4 w-1/2 bg-neutral-100/80 dark:bg-neutral-800/30" />
      </div>
      <Skeleton className="h-5 w-16 bg-neutral-100/80 dark:bg-neutral-800/30" />
    </div>
  </div>
);
