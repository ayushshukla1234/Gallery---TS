import { getUserInvoicesAction } from "@/actions/payment-actions";
import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Validate user session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Fetch invoice HTML for purchase id
    const result = await getUserInvoicesAction(id);

    if (!result.success || !result.html) {
      // Redirect if invoice generation failed
      return NextResponse.redirect(new URL("/dashboard/purchase", request.url));
    }

    // Return the HTML wrapped in valid NextResponse with content-type header
    return new NextResponse(result.html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (e) {
    console.error("Error in GET route:", e);
    // Redirect user to gallery if error
    return NextResponse.redirect(new URL(`/gallery`, request.url));
  }
}
