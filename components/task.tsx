"use client";

import { formatDateShort } from "@/lib/github/utils";
import { cn } from "@/lib/utils";
import { Box } from "lucide-react";
import { useSidebar } from "./ui/sidebar";

interface TaskProps {
  id: string;
}

export const Task = ({ id }: TaskProps) => {
  const { open: sidebarOpen } = useSidebar();

  return (
    <div
      className={cn(
        "flex h-dvh min-w-0 flex-col bg-neutral-50/50 fixed inset-0 transition-[left] duration-200 ease-linear dark:bg-neutral-950/50",
        sidebarOpen ? "left-[var(--sidebar-width)]" : "left-0"
      )}
    >
      <div className="flex h-[82.5px] items-center gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800">
        <div className="p-2 bg-neutral-100 rounded-md dark:bg-neutral-900 border">
          <Box
            className="size-8 text-neutral-600 dark:text-neutral-400"
            strokeWidth={1}
          />
        </div>
        <div className="flex flex-col items-start justify-center">
          <h1 className="text-xl">Task / {id}</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {formatDateShort(new Date().toISOString())}
          </p>
        </div>
      </div>
      <div className="size-full grid grid-cols-2">
        <div className="border-r border-neutral-200 dark:border-neutral-800">
          {/* Display logs */}
        </div>
        <div className="border-neutral-200 dark:border-neutral-800">
          {/* Display code editor */}
        </div>
      </div>
    </div>
  );
};
