import type { Metadata } from "next";
import Link from "next/link";
import { Button, buttonClass } from "@/components/button";
import { Ridgeline } from "@/components/ridgeline";
import { safeNext } from "@/lib/age-gate";
import { site } from "@/lib/site";
import { confirmAge } from "./actions";

export const metadata: Metadata = { title: "Age confirmation", robots: { index: false } };

export default async function AgeCheckPage({ searchParams }: PageProps<"/age-check">) {
  const params = await searchParams;
  const next = safeNext(typeof params.next === "string" ? params.next : undefined);
  const declined = params.declined === "1";

  return (
    <main id="main" className="flex flex-1 flex-col">
      <div className="container-page flex flex-1 flex-col items-center justify-center py-20 text-center">
        <p className="font-serif text-4xl">
          Canna<span className="italic">Dry</span>
        </p>

        {declined ? (
          <div className="mt-10 max-w-md" role="status">
            <h1 className="text-3xl">This site is not available to you.</h1>
            <p className="mt-4 text-ink-muted">
              You must be {site.minimumAge} or older to visit CannaDry.
            </p>
          </div>
        ) : (
          <div className="mt-10 max-w-lg">
            <h1 className="text-3xl md:text-4xl">Are you {site.minimumAge} or older?</h1>
            <p className="mt-4 leading-relaxed text-ink-muted">
              CannaDry is a wholesale platform for Health Canada licence holders. You must be{" "}
              {site.minimumAge} or older to enter.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <form action={confirmAge}>
                <input type="hidden" name="next" value={next} />
                <Button type="submit">Yes, I am {site.minimumAge} or older</Button>
              </form>
              <Link
                href={`/age-check?declined=1`}
                className={buttonClass("secondary")}
              >
                No
              </Link>
            </div>
          </div>
        )}
      </div>
      <Ridgeline />
      <div className="bg-forest py-4 text-center text-xs text-fog/75">
        For licensed businesses in Canada only.
      </div>
    </main>
  );
}
