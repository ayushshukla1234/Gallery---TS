import { recordPurchaseAction } from "@/actions/payment-actions";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");
  const assetId = searchParams.get("assetId");
  const payerId = searchParams.get("PayerID");

  if (!token || !payerId || !assetId) {
    return NextResponse.redirect(
      new URL(`/gallery?error=missing-params`, request.url)
    );
  }

  try {
    // Get session and check user login
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Capture all payment for given order token
    const response = await fetch(
      `${process.env.PAYPAL_API_URL}/v2/checkout/orders/${token}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(
            `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
          ).toString("base64")}`,
        },
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("PayPal capture failed:", response.status, errorBody);
      return NextResponse.redirect(
        new URL(`/gallery/${assetId}?error=payment_failed`, request.url)
      );
    }

    const data = await response.json();
    console.log("PayPal capture response:", data);

    if (data.status === "COMPLETED") {
      // Record the purchase in DB
      const saveToDB = await recordPurchaseAction(
        assetId,
        token,
        session.user.id,
        5.0 
      );

      if (!saveToDB.success) {
        return NextResponse.redirect(
          new URL(`/gallery/${assetId}?error=recording_failed`, request.url)
        );
      }

      // Success redirect
      return NextResponse.redirect(
        new URL(`/gallery/${assetId}?success=true`, request.url)
      );
    } else {
      // Payment not complete
      return NextResponse.redirect(
        new URL(`/gallery/${assetId}?error=payment_failed`, request.url)
      );
    }
  } catch (error) {
    console.error("Error in PayPal capture:", error);
    return NextResponse.redirect(
      new URL(`/gallery/${assetId}?error=server_error`, request.url)
    );
  }
}
