'use server'

import { auth } from "@/lib/auth";
import { z } from 'zod';
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { asset, category, user } from "@/lib/db/schema"; // user added
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

const AssetSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  categoryId: z.number().positive('Please select a category'),
  fileUrl: z.string().url('Invalid file url'),
  thumbnailUrl: z.string().url('Invalid file url').optional()
});

export async function getCategoriesAction() {
  try {
    return await db.select().from(category);
  } catch (e) {
    console.log(e);
    return [];
  }
}

export async function uploadAssetAction(formdata: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("You must be logged in to upload asset");
  }

  try {
    const validateFields = AssetSchema.parse({
      title: formdata.get("title"),
      description: formdata.get("description"),
      categoryId: Number(formdata.get("categoryId")),
      fileUrl: formdata.get("fileUrl"),
      thumbnailUrl: formdata.get("thumbnailUrl") || formdata.get("fileUrl"),
    });

    await db.insert(asset).values({
      title: validateFields.title,
      description: validateFields.description,
      fileUrl: validateFields.fileUrl,
      thumbnailUrl: validateFields.thumbnailUrl as string,
      isApproved: "pending",
      userId: session.user.id,
      categoryId: validateFields.categoryId,
    });

    revalidatePath("/dashboard/assets");
    return { success: true };
  } catch (e) {
    console.log(e);
    return { success: false, error: "Failed to upload asset" };
  }
}

export async function getUserAssetsAction(userId: string) {
  try {
    return await db
      .select()
      .from(asset)
      .where(eq(asset.userId, userId))
      .orderBy(asset.createdAt);
  } catch (error) {
    console.log(error);
    return [];
  }
}

export async function getPublicAssetsAction(categoryId?: number) {
  try {
    let conditions = eq(asset.isApproved, 'approved');
    if (categoryId) {
      conditions = and(conditions, eq(asset.categoryId, categoryId));
    }

    const query = await db
      .select({
        asset: asset,
        categoryName: category.name,
        userName: user.name,
      })
      .from(asset)
      .leftJoin(category, eq(asset.categoryId, category.id))
      .leftJoin(user, eq(asset.userId, user.id))
      .where(conditions); // apply conditions here

    return query;
  } catch (e) {
    console.log(e);
    return [];
  }
}

export async function getAssetByIdAction(assetId: string) {
  try {
    const [result] = await db
      .select({
        asset: asset,
        categoryName: category.name,
        userName: user.name,
        userImage: user.image,
        userId: user.id,
      })
      .from(asset)
      .leftJoin(category, eq(asset.categoryId, category.id))
      .leftJoin(user, eq(asset.userId, user.id))
      .where(eq(asset.id, assetId)); // fixed clause

    return result;
  } catch (e) {
    console.log(e);
    return null;
  }
}
