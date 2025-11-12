import { approveAssetAction, getPendingAssestsAction, rejectAssetAction } from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";  // lucide-react ka Image icon nahi, next/image use karen
import { User } from "lucide-react";

export default async function AssetApprovalPage() {
  const pendingAssets = await getPendingAssestsAction();

  return (
   <div className=" container py-10">
        <div className="px-4 ">
      {pendingAssets.length === 0 ? (
        <Card className="bg-white">
          <CardContent className="py-16 flex flex-col items-center justify-center">
            <p className="text-center text-slate-500 text-lg">All assets have been reviewed</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pendingAssets.map(({ asset, userName }) => (
            <div
              key={asset.id}
              className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow transition-shadow"
            >
              <div className="h-48 bg-slate-100 relative">
                <Image
                  src={asset.fileUrl}
                  alt={asset.title}
                  fill
                  className="object-cover"
                  sizes="100vw"
                  style={{ objectFit: "cover" }}
                />
                <div
                  className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-semibold text-white"
                  style={{
                    backgroundColor:
                      asset.isApproved === "approved"
                        ? "#14B8A6"
                        : asset.isApproved === "rejected"
                        ? "#EF4444"
                        : "#FBBF24",
                  }}
                >
                  {asset.isApproved === "approved"
                    ? "Approved"
                    : asset.isApproved === "rejected"
                    ? "Rejected"
                    : "Pending"}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-medium truncate">{asset.title}</h3>
                {asset.description && <p className="text-xs text-slate-500">{asset.description}</p>}
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs text-slate-400">
                    {formatDistanceToNow(new Date(asset.createdAt), { addSuffix: true })}
                  </span>
                  <div className="flex items-center text-xs text-slate-400">
                    <User className="mr-2 w-4 h-4" />
                    {userName}
                  </div>
                </div>
              </div>
              <div className="p-4 flex justify-between items-center">
                <form
                action={async()=> {
                    'use server'
                    await approveAssetAction(asset.id)
                }}
                >
                    <Button className="bg-teal-500 hover:bg-teal-600">Approve</Button>
                </form>
                <form
                   action={async()=> {
                    'use server'
                    await rejectAssetAction(asset.id)
                }}
                >
                    <Button className="bg-red-500 hover:bg-red-600">Reject</Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
   </div>
  );
}
