import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { Suspense } from "react";
import { Loader2, ShoppingCart, Download, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { hasUserPurchasedAssetAction, createPaypalOrderAction } from "@/actions/payment-actions";
import { getAssetByIdAction } from "@/actions/dashboard-actions";

interface GalleryDetailsPageProps {
  params: { id: string } | Promise<{ id: string }>;
  searchParams: { success?: string; canceled?: string; error?: string } | Promise<any>;
}

export default function GalleryDetailsPage({ params, searchParams }: GalleryDetailsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[65vh]">
          <Loader2 className="h-8 w-8 animate-spin text-black" />
        </div>
      }
    >
      <GalleryContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function GalleryContent({
  params,
  searchParams,
}: GalleryDetailsPageProps) {
  // Await params and searchParams because they might be promises
  const { id } = await params;
  const sp = await searchParams;
  const success = sp?.success;

  const session = await auth.api.getSession({ headers: await headers() });

  if (session?.user?.role === "admin") {
    redirect("/");
  }

  const result = await getAssetByIdAction(id);
  if (!result) notFound();

  const { asset, categoryName, userName, userId } = result;
  const isAuthor = session?.user?.id === userId;
  const hasPurchasedAsset = session?.user?.id ? await hasUserPurchasedAssetAction(id) : false;

  async function handelPurchase(formData: FormData) {
    "use server";
    const result = await createPaypalOrderAction(id);

    if (result.alreadyPurchased) {
      redirect(`/gallery/${id}?success=true`);
    }
    if (result.approvalLink) {
      redirect(result.approvalLink);
    }
    redirect(`/gallery/${id}?error=true`);
  }

  return (
    <div className="min-h-screen container px-4 bg-white">
      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-lg border border-gray-200 mb-6">
          <Info className="w-5 h-5 text-green-500" />
          <p>Purchase Successful! You can now download this asset</p>
        </div>
      )}

      <div className="container py-12">
        <div className="grid gap-12 md:grid-cols-3">
          <div className="md:col-span-2 space-y-8">
            <div className="rounded-lg overflow-hidden bg-gray-100 border">
              <Image
                src={asset.fileUrl}
                alt={asset.title}
                width={1200}
                height={800}
                className="w-full h-auto object-contain"
                priority
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">{asset.title}</h1>
                {categoryName && (
                  <Badge className="mt-2 bg-gray-200 text-gray-700 hover:bg-gray-300">
                    {categoryName}
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-gray-500">Creator</p>
              </div>
            </div>
            {asset.description && (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Description</h2>
                <p className="text-gray-600">{asset.description}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="sticky top-24">
              <Card className="overflow-hidden border-0 shadow-lg rounded-xl">
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white">
                  <h3 className="text-xl font-bold mb-2">Premium Asset</h3>
                  <div>
                    <span className="text-3xl font-bold">$5.00</span>
                    <span className="ml-2 text-gray-300">One Time Purchase</span>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {session?.user ? (
                      isAuthor ? (
                        <div className="bg-blue-50 text-blue-700 p-5 rounded-lg flex items-start gap-3">
                          <Info className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                          <p className="text-sm">This is your own asset. You can't purchase your own asset.</p>
                        </div>
                      ) : hasPurchasedAsset ? (
                       <Button asChild className="w-full bg-green-600 hover:bg-green-700 text-white h-12">
                       <a href={asset.fileUrl} target="_blank" rel="noopener noreferrer">
                       <Download className="mr-2 w-6 h-6" />
                      Download Asset
                          </a>
                         </Button>
                      ) : (
                        <form action={handelPurchase}>
                          <Button type="submit" className="w-full bg-black hover:bg-gray-800 text-white h-12">
                            <ShoppingCart className="mr-2 w-6 h-6" />
                            Purchase Asset
                          </Button>
                        </form>
                      )
                    ) : (
                      <Button asChild className="w-full bg-black hover:bg-gray-800 text-white h-12">
                        <Link href={"/login"}>Sign In to Purchase</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
