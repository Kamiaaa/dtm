"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/app/components/SessionProvider";
import AvatarUpload from "@/app/components/forms/AvatarUpload";

export default function SettingsPage() {
  const session = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarLoaded, setAvatarLoaded] = useState(false);

  // The session token doesn't carry the avatar, so load the saved one.
  useEffect(() => {
    fetch(`/api/employees/${session.userId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setAvatarUrl(data?.employee?.avatarUrl ?? ""))
      .catch(() => {})
      .finally(() => setAvatarLoaded(true));
  }, [session.userId]);

  function handleCancel() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation don't match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not change password.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-3xl mb-1">Settings</h1>
      <p className="text-ink/60 mb-8">Manage your profile photo and password.</p>

      <div className="card p-6 mb-8">
        <p className="text-sm font-medium mb-3">Profile photo</p>
        {avatarLoaded ? (
          <AvatarUpload userId={session.userId} currentUrl={avatarUrl} />
        ) : (
          <div className="w-16 h-16 rounded-full bg-ink/10 animate-pulse" />
        )}
      </div>

      <div className="card p-6">
        <p className="text-sm font-medium mb-4">Change password</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1" htmlFor="currentPassword">
              Current password
            </label>
            <input
              id="currentPassword"
              type="password"
              required
              className="input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="newPassword">
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              required
              minLength={6}
              className="input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="confirmPassword">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={6}
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-clay text-sm">{error}</p>}
          {success && <p className="text-moss-600 text-sm">Password updated.</p>}

          <div className="flex items-center gap-3">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Updating…" : "Update password"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="btn-secondary disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
