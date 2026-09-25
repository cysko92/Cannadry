import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { safeNext } from "@/lib/age-gate";
import { getViewer, homeFor } from "@/lib/viewer";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const viewer = await getViewer();
  if (viewer) redirect(homeFor(viewer));
  const params = await searchParams;
  const next = safeNext(typeof params.next === "string" ? params.next : undefined);

  return (
    <div className="container-page flex justify-center py-20">
      <div className="w-full max-w-md">
        <h1 className="text-4xl">Sign in</h1>
        <p className="mt-3 text-ink-muted">For approved CannaDry trade accounts.</p>
        {params.error === "link" && (
          <p role="alert" className="mt-6 rounded-sm border border-danger/40 bg-danger-tint px-4 py-3 text-sm text-danger">
            That link is invalid or has expired. Sign in, or request a new password reset link.
          </p>
        )}
        <div className="mt-8">
          <LoginForm next={next} />
        </div>
        <p className="mt-10 border-t border-stone pt-6 text-sm text-ink-muted">
          No account yet?{" "}
          <Link href="/request-access" className="text-forest underline underline-offset-2">
            Request access
          </Link>
        </p>
      </div>
    </div>
  );
}
