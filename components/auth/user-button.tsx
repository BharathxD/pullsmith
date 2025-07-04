"use client";

import { signOut, useSession } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { Loader, LogOut, User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const UserButton = () => {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const user = session?.user;

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      const response = await signOut();
      if (response.error) toast.error("Failed to sign out");
      router.push("/auth");
    } catch (_error) {
      toast.error("Failed to sign out");
      setIsLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg p-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Skeleton className="size-8 rounded-full" />
          <div className="min-w-0 flex-1">
            <Skeleton className="mb-1 h-[1rem] w-24 rounded-sm" />
            <Skeleton className="h-[1rem] w-32 rounded-sm" />
          </div>
        </div>
        <Skeleton className="size-6 rounded-md" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg p-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name ?? "User avatar"}
            width={32}
            height={32}
            className="rounded-full border border-border/30 dark:border-border/20"
          />
        ) : (
          <div className="flex size-8 items-center justify-center rounded-full border border-border bg-muted dark:border-border/60 dark:bg-muted/60">
            <User className="size-4 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          {user.name && (
            <p className="truncate font-medium text-foreground text-sm">
              {user.name}
            </p>
          )}
          {user.email && (
            <p className="truncate text-muted-foreground text-xs">
              {user.email}
            </p>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleSignOut}
        disabled={isLoading}
        className="h-8 w-8 text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:hover:bg-accent/60"
        aria-label="Log out"
      >
        {isLoading ? (
          <Loader className="size-4 animate-spin" />
        ) : (
          <LogOut className="size-4" />
        )}
      </Button>
    </div>
  );
};
