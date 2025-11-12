"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Plus, Upload } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { uploadAssetAction } from "@/actions/dashboard-actions";

type Category = {
  id: number;
  name: string;
  createdAt: Date;
};

type FormState = {
  title: string;
  description: string;
  categoryId: string;
  file: File | null;
};

interface UploadDialogProps {
  categories: Category[];
}

type CloudinarySignature = {
  signature: string;
  timestamp: number;
  apiKey: string;
};

export default function UploadAsset({ categories }: UploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgressStatus, setUploadProgressStatus] = useState(0);
  const [formState, setFormState] = useState<FormState>({
    title: "",
    description: "",
    categoryId: "",
    file: null,
  });

  // Handle form inputs
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value: string) => {
    setFormState((prev) => ({ ...prev, categoryId: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormState((prev) => ({ ...prev, file: e.target.files![0] }));
    }
  };

  // ✅ Get Cloudinary signature from your Next.js API route
  async function getCloudinarySignature(): Promise<CloudinarySignature> {
    const timestamp = Math.round(new Date().getTime() / 1000);

    const response = await fetch("/api/cloudinary/signature", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ timestamp }),
    });

    if (!response.ok) {
      throw new Error("Failed to create cloudinary signature");
    }

    return response.json();
  }

  // ✅ Handle submit with Cloudinary upload + DB insert
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setUploadProgressStatus(0);

    try {
      if (!formState.file) {
        throw new Error("No file selected");
      }

      const { signature, apiKey, timestamp } = await getCloudinarySignature();

      const cloudinaryData = new FormData();
      cloudinaryData.append("file", formState.file);
      cloudinaryData.append("api_key", apiKey);
      cloudinaryData.append("timestamp", timestamp.toString());
      cloudinaryData.append("signature", signature);
      cloudinaryData.append("folder", "next-gallery-app-manager");

      // ✅ Upload file to Cloudinary manually with progress tracking
      const xhr = new XMLHttpRequest();
      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`
      );

      const cloudinaryPromise = new Promise<any>((resolve, reject) => {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgressStatus(progress);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            resolve(response); // ✅ FIXED (was resolve(resolve))
          } else {
            reject(new Error("Upload to Cloudinary failed"));
          }
        };

        xhr.onerror = () => reject(new Error("Upload to Cloudinary failed"));
      });

      xhr.send(cloudinaryData);

      const cloudResponse = await cloudinaryPromise;
      console.log("✅ Cloudinary Response:", cloudResponse);

      // ✅ Prepare data for uploadAssetAction
      const formData = new FormData();
      formData.append("title", formState.title);
      formData.append("description", formState.description);
      formData.append("categoryId", formState.categoryId);
      formData.append("fileUrl", cloudResponse.secure_url);
      formData.append("thumbnailUrl", cloudResponse.secure_url);

      // ✅ Send data to server action
      const result = await uploadAssetAction(formData);

      if (result.success) {
        setOpen(false);
        setFormState({
          title: "",
          description: "",
          categoryId: "",
          file: null,
        });
      } else {
        throw new Error(result?.error);
      }
    } catch (error) {
      console.error("Upload Error:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-teal-500 hover:bg-teal-600 text-white">
          <Plus className="mr-2 w-4 h-4" />
          Upload Asset
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload New Asset</DialogTitle>
          <DialogDescription>Upload a new asset to your dashboard.</DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              value={formState.title}
              id="title"
              name="title"
              placeholder="Enter title"
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Write a short description"
              value={formState.description}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              onValueChange={handleCategoryChange}
              value={formState.categoryId}
            >
              <SelectTrigger id="category" aria-label="Select a category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">File</Label>
            <Input
              id="file"
              type="file"
              accept="image/*"
              name="file"
              onChange={handleFileChange}
              required
            />
          </div>

          {uploading && uploadProgressStatus > 0 && (
            <div className="mb-5 w-full bg-stone-100 rounded-full h-2">
              <div
                className="bg-teal-500 h-2 rounded-full transition-all"
                style={{ width: `${uploadProgressStatus}%` }}
              />
              <p className="text-xs text-slate-500 mt-2 text-right">
                {uploadProgressStatus}% uploaded
              </p>
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button type="submit" disabled={uploading}>
              <Upload className="mr-2 h-5 w-5" />
              {uploading ? "Uploading..." : "Upload Asset"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
