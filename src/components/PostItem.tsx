import { Link } from "react-router-dom";
import { Post } from "./PostList";
import { LikeButton } from "./LikeButton";
import { MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { BookmarkButton } from "./BookmarkButton";

interface Props {
  post: any;
}

const fetchCommentCount = async (postId: number): Promise<number> => {
  const { count, error } = await supabase
    .from("comments")
    .select("*", { count: 'exact' })
    .eq("post_id", postId);

  if (error) throw new Error(error.message);
  return count || 0;
};

export const PostItem = ({ post }: Props) => {
  const { 
    data: commentCount, 
    isLoading: commentLoading 
  } = useQuery({
    queryKey: ["commentCount", post.id],
    queryFn: () => fetchCommentCount(post.id),
    refetchInterval: 1000, // Optional: refresh every 5 seconds
  });

  return (
    <div className="w-full pt-2 hover:bg-zinc-950 text-white flex flex-col px-2 sm:px-3 md:px-5 overflow-hidden transition-colors duration-300 border-b border-[rgb(84,90,106)]">
      <Link to={`/post/${post.id}`} className="block relative z-10">
        <div className="w-full">
          {/* Header: Avatar and Title */}
          <div className="flex space-x-2">
            <Link to={`/user/${post.username}`}>
              {post.avatar_url ? (
                <img
                  src={post.avatar_url}
                  alt="User Avatar"
                  className="w-[35px] h-[35px] sm:w-[40px] sm:h-[40px] md:w-[45px] md:h-[45px] rounded-full object-cover"
                />
              ) : (
                <div className="w-[35px] h-[35px] sm:w-[40px] sm:h-[40px] md:w-[45px] md:h-[45px] rounded-full bg-gradient-to-tl from-[#8A2BE2] to-[#491F70] text-xl sm:text-2xl flex justify-center items-center font-bold capitalize">
                  {post.username ? post.username.slice(0, 1) : "?"}
                </div>
              )}
            </Link>

            <div className="flex flex-col flex-1 min-w-0">
              <Link to={`/user/${post.username}`}>
                <div className="leading-[22px] font-semibold text-sm sm:text-base flex flex-wrap items-center">
                  <span className="truncate max-w-[120px] sm:max-w-none">{post.full_name}</span>
                  <span className="text-gray-400 px-1 sm:px-2 text-xs sm:text-sm truncate"> @{post.username}</span>
                </div>
              </Link>
              {/* Content and Image Banner */}
              <div className="text-sm sm:text-base md:text-[17px] flex-1">
                <div className="mb-2 sm:mb-4 break-words">
                  {post.content}
                </div>
                {post.image_url && (
                  <div className="relative pt-[56.25%] w-full"> {/* 16:9 aspect ratio container */}
                    <img
                      src={post.image_url}
                      alt={post.title || "Post image"}
                      className="absolute top-0 left-0 w-full h-full rounded-[5px] object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
      
      {/* Actions div with separate hover states */}
      <div className="px-6 sm:px-8 md:px-12 py-1 flex items-center justify-between sm:justify-start gap-10 sm:gap-15 md:gap-25">
        <div className="flex items-center text-[rgb(84,90,106)] transition-all duration-200 cursor-pointer hover:text-green-600">
          <div className="hover:bg-green-500/20 hover:text-green-600 rounded-full p-1 sm:p-2">
            <MessageCircle size={18} className="sm:w-[21px] sm:h-[21px]" />
          </div>
          <span className="ml-1 text-sm sm:text-[16px]">
            {commentLoading ? "..." : commentCount || 0}
          </span>
        </div>
        <LikeButton postId={post.id} />
        <BookmarkButton postId={post.id} />
      </div>
    </div>
  );
};