import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase-client";
import { Bookmark } from "lucide-react";
import { Post } from "./PostList";

// Types
export interface BookmarkType {
  id: number;
  post_id: number;
  user_id: string;
  created_at: string;
  posts: Post;
}

// Supabase Bookmark Service
export const bookmarkService = {
  async addBookmark(userId: string, postId: number): Promise<BookmarkType> {
    const { data, error } = await supabase
      .from("bookmarks")
      .insert({ user_id: userId, post_id: postId })
      .select("*, posts(*)")
      .single();

    if (error) throw new Error(error.message);
    return data as BookmarkType;
  },

  async removeBookmark(userId: string, postId: number): Promise<null> {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .match({ user_id: userId, post_id: postId });

    if (error) throw new Error(error.message);
    return null;
  },

  async getUserBookmarks(userId: string): Promise<BookmarkType[]> {
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*, posts(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data as BookmarkType[];
  },

  async isBookmarked(userId: string, postId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return !!data;
  },
};

// BookmarkButton Component
export const BookmarkButton: React.FC<{ postId: number }> = ({ postId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: isBookmarked,
    isLoading,
  } = useQuery<boolean>({
    queryKey: ["bookmarked", user?.id, postId],
    queryFn: () => bookmarkService.isBookmarked(user?.id!, postId),
    enabled: !!user,
  });

  const bookmarkMutation = useMutation<BookmarkType | null, Error, void>({
    mutationFn: () =>
      isBookmarked
        ? bookmarkService.removeBookmark(user?.id!, postId)
        : bookmarkService.addBookmark(user?.id!, postId),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["bookmarked", user?.id, postId],
      });
    },
  });

  if (isLoading) return null;

  return (
    <button
      onClick={() => bookmarkMutation.mutate()}
      className={`
        hover:bg-blue-500/20 rounded-full p-2 transition 
        ${isBookmarked ? "text-blue-500" : "text-gray-500"}
      `}
    >
      <Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} />
    </button>
  );
};
