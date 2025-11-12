import { getAssetByIdAction } from "@/actions/dashboard-actions";
import { hasUserPurchasedAssetAction } from "@/actions/payment-actions";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const hasPurchased = await hasUserPurchasedAssetAction(id);

    if (!hasPurchased) {
      return NextResponse.redirect(new URL(`/gallery/${id}`, request.url));
    }

    const result = await getAssetByIdAction(id);

    if (!result) {
      return NextResponse.redirect(new URL(`/gallery`, request.url));
    }

    // Minimal, styled invoice HTML (replace dummy with result values as needed)
    const asset = result.asset;
    const invoiceId = asset.id;
    const assetTitle = asset.title;
    const price = 5.0; // Replace with real asset.price if available
    const purchaseDate = asset.createdAt;
    const userName = result.userName || "Customer";
    const status = "Paid";

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>Invoice #${invoiceId}</title>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1.0" />
      <style>
        body { background: #f8fafc; font-family: 'Segoe UI', Arial, sans-serif; color: #222; margin:0; padding:0; }
        .invoice-container { max-width: 420px; margin: 40px auto; background: #fff; border-radius: 12px; box-shadow: 0 6px 32px rgba(80,120,180,0.08); padding: 30px 22px; }
        .invoice-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; }
        .invoice-id { color: #1976d2; font-weight: 600; }
        .status-pill { padding: 2px 14px; font-size: 13px; background: #e3f6e6; color: #248a3d; border-radius: 10px; font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin: 18px 0 10px 0;}
        th, td { padding: 10px 10px; font-size: 15px;}
        th { color: #8b94a8; background: #f3f6fb; text-align: left; }
        .total-row td { background: #e5f4ff; font-weight: 700; color: #1976d2;}
        .footer { margin-top: 22px; font-size: 12px; color: #abb4be; text-align: right; }
      </style>
    </head>
    <body>
     <div class="invoice-container">
      <div class="invoice-head">
        <span class="invoice-id">Invoice #${invoiceId.slice(0,8).toUpperCase()}</span>
        <span class="status-pill">${status}</span>
      </div>
      <div style="margin-bottom:20px;">
        <div><b>Billed To:</b> ${userName}</div>
        <div style="font-size:13px; color:#8ca6c2; margin-top:2px;">${new Date(purchaseDate).toLocaleDateString()}</div>
      </div>
      <table>
        <tr>
          <th>Item</th>
          <th style="text-align:right">Amount</th>
        </tr>
        <tr>
          <td>${assetTitle}</td>
          <td style="text-align:right">$${price.toFixed(2)}</td>
        </tr>
        <tr class="total-row">
          <td>Total</td>
          <td style="text-align:right">$${price.toFixed(2)}</td>
        </tr>
      </table>
      <div class="footer">
        Thank you for your purchase!
      </div>
     </div>
    </body>
    </html>
    `;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" }
    });

  } catch (e) {
    console.error("Error in GET route:", e);
    return NextResponse.redirect(new URL(`/gallery`, request.url));
  }
}
