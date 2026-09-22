"use client";

import { useState } from "react";
import Image from "next/image";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export default function AvatarUpload({
  userId,
  currentUrl,
  onUploaded,
}: {
  userId: string;
  currentUrl?: string;
  onUploaded?: (url: string) => void;
}) {
  const [preview, setPreview] = useState(currentUrl || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      input.value = "";
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image is too large (max 5 MB).");
      input.value = "";
      return;
    }

    setLoading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        setError(uploadData.error || "Upload failed.");
        return;
      }

      const saveRes = await fetch(`/api/employees/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: uploadData.url }),
      });
      if (!saveRes.ok) {
        const saveData = await saveRes.json().catch(() => null);
        setError(saveData?.error || "Uploaded, but failed to save to profile.");
        return;
      }

      setPreview(uploadData.url);
      onUploaded?.(uploadData.url);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      // Reset so choosing the same file again still fires onChange.
      input.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-full overflow-hidden bg-ink/10 flex items-center justify-center">
        {preview ? (
          <Image src={preview} alt="Avatar" width={64} height={64} className="object-cover" />
        ) : (
          <span className="text-ink/40 text-xs">No photo</span>
        )}
      </div>
      <div>
        <label className="btn-secondary text-sm cursor-pointer inline-block">
          {loading ? "Uploading…" : "Change photo"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={loading}
            onChange={handleChange}
          />
        </label>
        {error && <p className="text-clay text-xs mt-1">{error}</p>}
      </div>
    </div>
  );
}
