import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getAllUserPurchasedAction, getUserInvoicesAction } from "@/actions/payment-actions";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import Image from "next/image";

export default async function UserPurchasesPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session === null) return null;
  if (!session.user) redirect("/login");
  if (session?.user?.role === "admin") redirect("/");

  const purchaseResult = await getAllUserPurchasedAction();
  const invoicesResult = await getUserInvoicesAction();

  // Defensive fallback to empty arrays
  const purchases = Array.isArray(purchaseResult) ? purchaseResult : [];
  const invoices = invoicesResult?.success && Array.isArray(invoicesResult.invoices)
    ? invoicesResult.invoices
    : [];

  // Map purchaseId to invoiceId for quick lookup
  const purchaseToInvoiceMap = new Map();
  invoices.forEach((inv) => purchaseToInvoiceMap.set(inv.purchaseId, inv.id));

  return (
    <div className="container py-12">
      <h1 className="text-2xl font-bold mb-6">My purchases</h1>
      {purchases.length === 0 ? (
        <p>You haven't purchased any asset yet</p>
      ) : (
        purchases.map(({ purchase, asset }) => (
          <div
            key={purchase.id}
            className="flex items-center gap-4 p-4 bg-white rounded-lg border hover:shadow-sm"
          >
            <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
              <Image
                src={asset.fileUrl}
                alt={asset.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-grow min-w-0">
              <h3 className="font-medium truncate">{asset?.title}</h3>
              <p className="text-sm text-gray-500 mt-1">
                Purchased at {new Date(purchase.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" asChild className="bg-black text-white">
                <a href={`/api/download/${asset.id}`}>
                  <Download className="mr-2 w-4 h-4 " />
                  Download
                </a>
              </Button>
              {purchaseToInvoiceMap.has(purchase.id) && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`/api/invoice/${purchaseToInvoiceMap.get(purchase.id)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Invoice
                  </a>
                </Button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
