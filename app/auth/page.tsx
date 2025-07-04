import { OAuthButton } from "@/components/auth/oauth-button";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";

const AuthPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session?.session) return redirect("/");
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="flex max-w-md flex-col gap-4">
        <div className="space-y-2">
          <h1 className="flex items-center font-semibold text-3xl">
            Welcome to{" "}
            <span className="relative ml-2">
              <span className="absolute inset-y-1/2 h-0.5 w-full bg-black dark:bg-white" />
              <Image
                src="/assets/t3chat.svg"
                alt="T3.Chat"
                width={76}
                height={20}
              />
            </span>{" "}
            <span className="ml-2">
              <Image
                src="/assets/one-chat-logo.svg"
                alt="OneChat"
                width={126}
                height={25}
                className="transition-all duration-200 dark:invert"
              />
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Access multiple premium AI models including GPT-4.1, Claude, and
            more. Experience the best AI models in a clean, simple chat
            interface.
          </p>
        </div>
        <OAuthButton />
      </div>
    </div>
  );
};

export default AuthPage;
