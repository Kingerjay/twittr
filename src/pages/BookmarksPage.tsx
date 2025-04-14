import { useQuery } from "@tanstack/react-query";
import { bookmarkService } from "../components/BookmarkButton";
import { PostItem } from "../components/PostItem";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Post } from "../components/PostList"; // Ensure this is the correct path to your Post type

// Define a bookmark type with related post
interface Bookmark {
  id: number;
  post_id: number;
  user_id: string;
  posts: Post;
}

export const BookmarksPage: React.FC = () => {
  const { user } = useAuth();

  const { data: bookmarks, isLoading, error } = useQuery<Bookmark[], Error>({
    queryKey: ["user_bookmarks", user?.id],
    queryFn: () => bookmarkService.getUserBookmarks(user?.id!),
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        Loading bookmarks...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black text-white min-h-screen p-4">
        Error loading bookmarks
      </div>
    );
  }

  if (!bookmarks || bookmarks.length === 0) {
    return (
      <div className="bg-black text-white min-h-screen p-4">
        No bookmarks yet
      </div>
    );
  }

  return (
    <div className="w-full h-screen text-white overflow-y-auto scrollbar-hide">
      <div className="p-4 flex justify-between items-center sticky top-0 bg-black/80 backdrop-blur-md z-100 mb-4">
        <div className="flex gap-8 items-center">
          <button title="back" className="p-2 rounded-full hover:bg-zinc-900">
            <Link to="/">
              <ArrowLeft size={20} />
            </Link>
          </button>
          <p className="font-bold text-xl text-[#E7E9EA]">Bookmarks</p>
        </div>
      </div>

      <div className="space-y-4">
        {bookmarks.map((bookmark) => (
          <PostItem key={bookmark.id} post={bookmark.posts} />
        ))}
      </div>
    </div>
  );
};
