"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { publishPostAction } from "@/app/community/actions";

type UploadedImage = {
  path: string;
  url: string;
};

export default function CommunityPostComposer() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function removeUploadedImage(path: string) {
    await fetch("/api/upload/image", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    }).catch(() => undefined);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const file = form.get("image");
    let uploaded: UploadedImage | null = null;

    try {
      if (file instanceof File && file.size > 0) {
        const uploadBody = new FormData();
        uploadBody.set("file", file);
        const response = await fetch("/api/upload/image", {
          method: "POST",
          body: uploadBody,
        });
        const result = (await response.json()) as UploadedImage & {
          error?: string;
        };
        if (!response.ok || !result.path) {
          throw new Error(result.error ?? "The image could not be uploaded");
        }
        uploaded = result;
      }

      await publishPostAction({
        title: form.get("title"),
        category: form.get("category"),
        content: form.get("content"),
        media: uploaded ? [{ path: uploaded.path, type: "image" }] : [],
      });
      router.push("/community");
      router.refresh();
    } catch (caught) {
      if (uploaded) {
        await removeUploadedImage(uploaded.path);
      }
      setError(
        caught instanceof Error
          ? caught.message
          : "The post could not be published",
      );
      setSubmitting(false);
    }
  }

  return (
    <form
      className="mt-8 space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      onSubmit={submit}
    >
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}
      <label className="block text-sm font-semibold text-slate-800">
        Title
        <input
          className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2"
          maxLength={150}
          minLength={5}
          name="title"
          required
        />
      </label>
      <label className="block text-sm font-semibold text-slate-800">
        Category
        <select
          className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2"
          name="category"
          required
        >
          <option value="update">Update</option>
          <option value="story">Impact story</option>
          <option value="announcement">Announcement</option>
        </select>
      </label>
      <label className="block text-sm font-semibold text-slate-800">
        Content
        <textarea
          className="mt-2 min-h-56 w-full rounded-lg border border-slate-300 px-4 py-2"
          maxLength={10_000}
          minLength={20}
          name="content"
          required
        />
      </label>
      <label className="block text-sm font-semibold text-slate-800">
        Image (optional)
        <input
          accept="image/jpeg,image/png,image/webp"
          className="mt-2 block w-full text-sm text-slate-700"
          name="image"
          type="file"
        />
        <span className="mt-1 block text-xs font-normal text-slate-500">
          JPEG, PNG, or WebP up to 5 MB. The file is validated before storage.
        </span>
      </label>
      <div className="flex flex-wrap gap-3">
        <button className="btn btn-primary" disabled={submitting} type="submit">
          {submitting ? "Publishing…" : "Publish post"}
        </button>
        <Link className="btn btn-secondary" href="/community">
          Cancel
        </Link>
      </div>
    </form>
  );
}
