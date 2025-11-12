'use server'

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { asset, purchase, payment, session } from "@/lib/db/schema"; // payment added
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { success } from "zod";

export async function createPaypalOrderAction(assetId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect('/login');
  }

  const [getAsset] = await db.select().from(asset).where(eq(asset.id, assetId));
  if (!getAsset) {
    throw new Error('Asset not found');
  }

  const existingPurchase = await db
    .select()
    .from(purchase)
    .where(
      and(
        eq(purchase.assetId, assetId),
        eq(purchase.userId, session.user.id)
      )
    )
    .limit(1);

  if (existingPurchase.length > 0) {
    return {
      alreadyPurchased: true,
    };
  }

try {
    const response = await fetch(`${process.env.PAYPAL_API_URL}/v2/checkout/orders`,{
        method : 'POST',
        headers : {
            'Content-Type' : 'application/json',
            Authorization : `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`)
        .toString("base64")}`
        },
        body : JSON.stringify({
            intent :'CAPTURE',
            purchase_units : [
                {
                    reference_id :assetId,
                    description : `Purchase of ${getAsset.title}`,
                    amount : {
                        currency_code : 'USD',
                        value : '5.00'
                    },
                    custom_id : `${session.user.id}|${assetId}`
                }
            ],
                application_context : {
                return_url: `${process.env.APP_URL}/api/paypal/capture?assetId=${assetId}`,
                cancel_url:`${process.env.APP_URL}/gallery/${assetId}?cancelled=true`
                }
            
        })
    })
    if (!response.ok) {
  const errorText = await response.text();
  console.error(`PayPal create order failed: status=${response.status}, body=${errorText}`);
  throw new Error("Failed to create paypal order");
}


    const data = await response.json()

    if(data.id){
        return {
            orderId : data.id,
            approvalLink : data.links.find((link:any)=> link.rel === 'approve')
            .href,
        }
    }else{
        throw new Error("Failed to create paypal order")
    }
} catch (e) {
    console.log(e);
    throw new Error('Failed to create paypal order' + e)
    
}
}


export async function hasUserPurchasedAssetAction(assetId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return false;
  }

  try {
    const existingPurchase = await db
      .select()
      .from(purchase)
      .where(
        and(
          eq(purchase.assetId, assetId),
          eq(purchase.userId, session.user.id)
        )
      )
      .limit(1);

    return existingPurchase.length > 0;
  } catch (e) {
    console.error('hasUserPurchasedAssetAction error:', e);
    return false;
  }
}

export async function getAllUserPurchasedAction() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect('/login');
  }

  try {
    const userPurchases = await db
      .select({
        purchase: purchase,
        asset: asset,  
      })
      .from(purchase)
      .innerJoin(asset, eq(purchase.assetId, asset.id))
      .where(eq(purchase.userId, session.user.id))
      .orderBy(purchase.createdAt);

    return userPurchases;
  } catch (error) {
    console.error('getAllUserPurchasedAction error:', error);
    return [];
  }
}


export async function recordPurchaseAction(
  assetId: string,
  paypalOrderId: string,
  userId: string,
  price = 5.0,
  currency = "USD"
) {
  try {
    // Check if purchase already exists
    const existingPurchase = await db
      .select()
      .from(purchase)
      .where(and(eq(purchase.assetId, assetId), eq(purchase.userId, userId)))
      .limit(1);

    if (existingPurchase.length > 0) {
      return {
        success: true,
        alreadyExists: true,
      };
    }

    const paymentUuid = uuidv4();
    const purchaseUuid = uuidv4();

    // Insert payment record
    await db.insert(payment).values({
      id: paymentUuid,
      amount: Math.round(price * 100),
      currency,
      status: "completed",
      provider: "paypal",
      providerId: paypalOrderId,
      userId,
      createdAt: new Date(),
    });

    // Insert purchase record
    await db.insert(purchase).values({
      id: purchaseUuid,
      assetId,
      userId,
      paymentId: paymentUuid,
      price: Math.round(price * 100),
      createdAt: new Date(),
    });

    // Revalidate paths
    revalidatePath(`/gallery/${assetId}`);
    revalidatePath(`/dashboard/purchases`);

    return {
      success: true,
      purchaseId: purchaseUuid,
    };
  } catch (error) {
    console.error("recordPurchaseAction error:", error);
    return {
      success: false,
      error: "Failed to save purchase and payment",
    };
  }
}

// Fetch HTML Invoice for a given purchase ID
export async function getUserInvoicesAction(id: string) {
  // Dummy/fetch actual purchase data
  // Replace these variables with fetched DB data as needed
  const asset = {
    title: "hill",
    fileUrl: "https://res.cloudinary.com/dzxsevgxr/image/upload/v1762590377/next-gallery-app-manager/pgiyfreh8ilxbtwwsog2.jpg"
  };
  const userName = "Ayuxx (Kanha)";
  const userImage = "https://lh3.googleusercontent.com/a/ACg8ocIfI22R2wtW3268XgPTDIck2SMJev4wI-Ffe-Ff5YGoi8Zzg2vg=s96-c";
  const purchaseDate = "2025-11-08T08:26:17.625Z";
  const categoryName = "DOG";
  const price = 5.0;
  const invoiceId = id;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice #${invoiceId}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body {
      background: #f6f6f6;
      padding: 30px 0;
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #222;
    }
    .invoice-container {
      max-width: 540px;
      margin: 40px auto;
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 8px 28px rgba(60,60,60,0.10);
      padding: 36px 32px 28px 32px;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 18px;
      margin-bottom: 24px;
    }
    .avatar {
      width: 54px;
      height: 54px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #e0e7ef;
    }
    .asset-image {
      display: block;
      width: 100%;
      max-width: 260px;
      height: auto;
      margin: 20px auto 22px auto;
      border-radius: 10px;
      box-shadow: 0 3px 12px rgba(40,40,40,0.07);
      border: 1px solid #ececec;
    }
    .invoice-title {
      font-size: 1.5rem;
      font-weight: bold;
      margin: 8px 0 0 0;
      color: #1976d2;
    }
    .invoice-label {
      display: inline-block;
      padding: 4px 12px;
      font-size: 13px;
      background: #f3f9ff;
      color: #1565c0;
      border-radius: 100px;
      margin-bottom: 8px;
      text-transform: uppercase;
      font-weight: 500;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 18px;
      margin-bottom: 14px;
    }
    th, td {
      padding: 10px;
      background: #f9f9f9;
    }
    th {
      text-align: left;
      font-size: 13px;
      color: #9399a7;
      background: #f4f8fd;
    }
    .total-row td {
      background: #e1f5fe;
      font-weight: bold;
      color: #1565c0;
    }
    .footer {
      text-align: right;
      font-size: 13px;
      color: #b0b9c8;
      margin-top: 16px;
      border-top: 1px solid #f0f0f0;
      padding-top: 16px;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <img src="${userImage}" alt="User" class="avatar"/>
      <div>
        <div style="font-weight: 600; font-size: 1.08rem">${userName}</div>
        <div style="font-size: 12px; color: #757575">Customer</div>
      </div>
      <div style="margin-left: auto; text-align: right;">
        <div class="invoice-label">INVOICE</div>
        <span style="font-size:13px;color: #b0b9c8;">#${invoiceId}</span>
      </div>
    </div>
    <img class="asset-image" src="${asset.fileUrl}" alt="Asset" />
    <div class="invoice-title">${asset.title}</div>
    <div style="margin-bottom:14px;color:#8c8c8c;">Category: <b>${categoryName}</b></div>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Digital Asset Purchase</td>
          <td style="text-align:right;">$${price.toFixed(2)}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="total-row">
          <td>Total</td>
          <td style="text-align:right;">$${price.toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>
    <div style="font-size:13px; color:#8d8d8d; margin-top: 8px;">
      Purchased on: <span>${new Date(purchaseDate).toLocaleString()}</span>
    </div>
    <div class="footer">
      Generated by Next Gallery App
    </div>
  </div>
</body>
</html>
`;

  return { success: true, html };
}


