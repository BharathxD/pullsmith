"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import { Building2, Check, ChevronDown, User } from "lucide-react";
import { useState } from "react";

interface InstallationSelectorProps {
  selectedInstallationId: number | null;
  onInstallationSelect: (installationId: number | null) => void;
  repositoryCount?: number;
}

export const InstallationSelector = ({
  selectedInstallationId,
  onInstallationSelect,
  repositoryCount = 0,
}: InstallationSelectorProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const {
    data: installations,
    isLoading,
    error,
  } = trpc.github.getInstallations.useQuery(undefined, {
    enabled: dropdownOpen, // Only fetch when dropdown is opened
  });

  const selectedInstallation = installations?.find(
    (installation) => installation.id === selectedInstallationId
  );

  const handleInstallationSelect = (installationId: number | null) => {
    onInstallationSelect(installationId);
    setDropdownOpen(false);
  };

  return (
    <div className="px-2.5 py-3 sticky top-0 z-20 backdrop-blur-sm">
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center justify-between w-full p-3 bg-white dark:bg-neutral-950/20 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900/20 transition-colors"
          >
            {selectedInstallation ? (
              <div className="flex items-center gap-2">
                <Avatar className="size-5">
                  <AvatarImage
                    src={selectedInstallation.account.avatar_url}
                    alt={selectedInstallation.account.login}
                  />
                  <AvatarFallback className="bg-red-200 text-neutral-600">
                    {selectedInstallation.account.type === "User" ? (
                      <User className="size-3" />
                    ) : (
                      <Building2 className="size-3" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {selectedInstallation.account.login}
                </span>
                <Badge
                  variant="outline"
                  className="h-4 text-xs px-1.5 border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-950"
                >
                  {repositoryCount}
                </Badge>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="relative flex size-5 shrink-0 overflow-hidden rounded-full">
                  <div className="flex size-full items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-900 border dark:border-neutral-800 text-neutral-600 dark:text-neutral-400">
                    <Building2 className="size-3" />
                  </div>
                </div>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  All repositories
                </span>
                <Badge
                  variant="outline"
                  className="h-4 text-xs px-1.5 border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-950"
                >
                  {repositoryCount}
                </Badge>
              </div>
            )}
            <ChevronDown className="size-4 text-neutral-400 dark:text-neutral-600" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-full min-w-[var(--radix-dropdown-menu-trigger-width)] shadow-xs"
        >
          {isLoading ? (
            <div className="">
              {Array.from({ length: 3 }, () => (
                <div
                  key={crypto.randomUUID()}
                  className="flex items-center justify-between p-3 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-5 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                    <Skeleton className="h-4 w-20 rounded bg-neutral-200 dark:bg-neutral-800" />
                    <Skeleton className="h-4 w-6 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                  </div>
                  <Skeleton className="size-4 rounded bg-neutral-200 dark:bg-neutral-800" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-2 text-sm text-red-600 dark:text-red-400">
              Failed to load installations
            </div>
          ) : (
            <>
              {/* All repositories option */}
              <DropdownMenuItem
                onClick={() => handleInstallationSelect(null)}
                className="flex items-center justify-between p-1 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="size-8 rounded">
                    <AvatarFallback className="bg-neutral-200 dark:bg-neutral-800 rounded shadow-inner text-neutral-600 dark:text-neutral-400">
                      <Building2 className="size-3.5" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    All repositories
                  </span>
                  <Badge
                    variant="outline"
                    className="h-4 text-xs px-1.5 border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-900"
                  >
                    {repositoryCount}
                  </Badge>
                </div>
                {selectedInstallationId === null && (
                  <Check className="size-4 text-neutral-600 dark:text-neutral-400" />
                )}
              </DropdownMenuItem>

              {/* Individual installations */}
              {installations?.map((installation) => (
                <DropdownMenuItem
                  key={installation.id}
                  onClick={() => handleInstallationSelect(installation.id)}
                  className="flex items-center justify-between p-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8 rounded">
                      <AvatarImage
                        src={installation.account.avatar_url}
                        alt={installation.account.login}
                      />
                      <AvatarFallback className="bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                        {installation.account.type === "User" ? (
                          <User className="size-3" />
                        ) : (
                          <Building2 className="size-3" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {installation.account.login}
                    </span>
                  </div>
                  {selectedInstallationId === installation.id && (
                    <Check className="size-4 text-neutral-600 dark:text-neutral-400" />
                  )}
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
