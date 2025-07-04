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
          <h1 className="text-2xl font-bold">Hey man, welcome to pullsmith</h1>
        </div>
        <OAuthButton />
      </div>
    </div>
  );
};

export default AuthPage;
