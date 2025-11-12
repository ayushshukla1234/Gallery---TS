import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getCategoriesAction, getPublicAssetsAction } from "@/actions/dashboard-actions";
import Image from "next/image";

interface GalleryPageProps {
  searchParams: Promise<{ category?: string }>; // Mark as Promise due to Next.js 16+
}

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session && session?.user?.role === "admin") {
    redirect("/");
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[65vh]">
          <Loader2 className="h-8 w-8 animate-spin text-black" />
        </div>
      }
    >
      {/* Await searchParams before passing */}
      <GalleryContent searchParams={await searchParams} />
    </Suspense>
  );
}

async function GalleryContent({ searchParams }: { searchParams: { category?: string } }) {
  const categoryId = searchParams.category ? Number.parseInt(searchParams.category) : undefined;

  const categories = await getCategoriesAction();
  const assets = await getPublicAssetsAction(categoryId);

  return (
    <div className="min-h-screen container px-4 bg-white">
      <div className="sticky top-0 z-30 bg-white border-b py-3 px-4">
        <div className="container flex overflow-x-auto gap-2">
          <Button
            variant={!categoryId ? "default" : "outline"}
            size={"sm"}
            className={!categoryId ? "bg-black text-white" : ""}
            asChild
          >
            <Link href={"/gallery"}>All</Link>
          </Button>
          {categories.map((c) => (
            <Button
              key={c.id}
              variant={categoryId === c.id ? "default" : "outline"}
              size="sm"
              className={categoryId === c.id ? "bg-black text-white" : ""}
              asChild
            >
              <Link href={`/gallery?category=${c.id}`}>{c.name}</Link>
            </Button>
          ))}
        </div>
      </div>
      <div className="container py-12">
        {assets.length === 0 ? (
          <p className="text-2xl text-center font-bold">No assets uploaded. Please check in sometime</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {assets.map(({ asset, categoryName, userName }) => (
              <Link href={`/gallery/${asset.id}`} key={asset.id} className="block">
                <div className="group relative overflow-hidden rounded-lg aspect-square">
                  <Image
                    src={asset.fileUrl}
                    alt={asset.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-medium text-lg">{asset?.title}</h3>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-white/80 text-sm">{userName}</span>
                        {categoryName && (
                          <span className="bg-white/25 text-white text-xs px-2 py-1 rounded-full">{categoryName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
