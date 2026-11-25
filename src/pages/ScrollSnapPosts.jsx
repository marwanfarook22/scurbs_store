import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../api/axiosInstance";
import { useAuthStore } from "../store/useAuthStore";
import { useLanguage } from "../context/LanguageState";

export default function ScrollSnapPosts() {
  const { t } = useLanguage();
  const { isAuthenticated, user } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [postUrl, setPostUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isActive = true;

    axiosInstance
      .get("/instagram-posts")
      .then((response) => {
        if (isActive) setPosts(response.data.data || []);
      })
      .catch((error) => {
        if (isActive) {
          setLoadError(
            error.response?.data?.message ||
              t("Unable to load Instagram posts."),
          );
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [t]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!["admin", "moderator"].includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setIsSaving(true);
      const response = await axiosInstance.post("/instagram-posts", {
        url: postUrl.trim(),
      });
      setPosts((currentPosts) => [response.data.data, ...currentPosts]);
      setPostUrl("");
      toast.success(t("Instagram post added."));
    } catch (error) {
      toast.error(
        error.response?.data?.message || t("Unable to add Instagram post."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (post) => {
    if (!window.confirm(t("Delete this Instagram post?"))) return;
    try {
      await axiosInstance.delete(`/instagram-posts/${post._id}`);
      setPosts((currentPosts) =>
        currentPosts.filter((currentPost) => currentPost._id !== post._id),
      );
      toast.success(t("Instagram post deleted."));
    } catch (error) {
      toast.error(
        error.response?.data?.message || t("Unable to delete Instagram post."),
      );
    }
  };

  return (
    <div className="mx-auto max-w-7xl py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#C5A368]">
            {t("Dashboard")}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[#1A1A1A]">
            {t("Scroll snap links")}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {t(
              "Paste a public Instagram post or reel link to show it on the home page.",
            )}
          </p>
        </div>
        <Link
          to="/dashboard"
          className="border border-[#D9D1C7] px-4 py-2 text-sm font-semibold text-[#03382E] hover:bg-[#F5EBE6]"
        >
          {t("Back to dashboard")}
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(260px,0.7fr)_1.3fr]">
        <section className="rounded-sm border border-[#EFE6DD] bg-white p-5 shadow-sm">
          <h2 className="mb-5 text-xl font-bold text-[#03382E]">
            {t("Add Instagram post")}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-1.5 text-sm font-semibold text-gray-700">
              <span>{t("Instagram post URL")}</span>
              <input
                type="url"
                required
                className="w-full rounded-sm border border-[#D9D1C7] bg-white px-3 py-2 text-[#1A1A1A] focus:border-[#03382E] focus:outline-none"
                placeholder="https://www.instagram.com/p/..."
                value={postUrl}
                onChange={(event) => setPostUrl(event.target.value)}
              />
            </label>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-[#03382E] px-4 py-2.5 font-semibold text-white disabled:opacity-50"
            >
              {isSaving ? t("Saving...") : t("Add Instagram post")}
            </button>
          </form>
        </section>

        <section className="rounded-sm border border-[#EFE6DD] bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-[#03382E]">
            {t("Instagram posts")} ({posts.length})
          </h2>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <span className="h-8 w-8 animate-spin rounded-full border-4 border-[#03382E] border-t-transparent" />
            </div>
          ) : loadError ? (
            <p role="alert" className="text-sm text-red-700">
              {loadError}
            </p>
          ) : (
            <div className="divide-y divide-[#EFE6DD]">
              {posts.map((post) => (
                <div
                  key={post._id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-sm font-medium text-[#03382E] hover:underline"
                  >
                    {post.url}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(post)}
                    className="shrink-0 text-sm font-semibold text-red-700 hover:underline"
                  >
                    {t("Delete")}
                  </button>
                </div>
              ))}
              {posts.length === 0 && (
                <p className="py-3 text-sm text-gray-500">
                  {t("There are no Instagram posts yet.")}
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
