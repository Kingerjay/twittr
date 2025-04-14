import { useQuery } from "@tanstack/react-query";
import { Post } from "./PostList";
import { supabase } from "../supabase-client";

import { LikeButton } from "./LikeButton";
import { CommentSection } from "./CommentSection";
import { ArrowLeft, Filter, MessageCircle, MoreHorizontal } from "lucide-react";
import { Link } from "react-router";
import { BookmarkButton } from "./BookmarkButton";

interface Props {
  postId: number;
}

// Fetch post by ID
const fetchPostById = async (id: number): Promise<Post> => {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data as Post;
};

// Fetch comment count
const fetchCommentCount = async (postId: number): Promise<number> => {
  const { count, error } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);

  if (error) throw new Error(error.message);
  return count ?? 0;
};

export const PostDetail = ({ postId }: Props) => {
  const {
    data: post,
    error,
    isLoading: postLoading,
  } = useQuery<Post, Error>({
    queryKey: ["post", postId],
    queryFn: () => fetchPostById(postId),
  });

  const {
    data: commentCount,
    isLoading: commentLoading,
  } = useQuery<number, Error>({
    queryKey: ["commentCount", postId],
    queryFn: () => fetchCommentCount(postId),
    refetchInterval: 1000,
  });

  if (postLoading) return <div>Loading Post...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!post) return <div>Post not found</div>;

  return (
    <div className="w-full h-screen text-[#E7E9EA] flex flex-col overflow-y-auto scrollbar-hide">
      <div className="px-2 sm:px-4 flex justify-between items-center sticky top-0 bg-black/80 backdrop-blur-md z-10 mb-2 sm:mb-4">
        {/* Left side */}
        <div className="flex gap-4 sm:gap-8 items-center">
          <button title="back" className="p-1 sm:p-2 rounded-full hover:bg-zinc-900">
            <Link to="/">
              <ArrowLeft size={18} className="sm:w-[20px] sm:h-[20px]" />
            </Link>
          </button>
          <p className="font-bold text-lg sm:text-xl text-[#E7E9EA]">Post</p>
        </div>

        {/* Right side */}
        <div className="flex py-2 gap-2 sm:gap-4 items-center">
          <button className="flex items-center justify-center rounded-4xl bg-black py-0.5 px-2 sm:px-4 border border-[rgb(84,90,106)] font-semibold text-base sm:text-lg">
            Reply
          </button>
          <Filter size={18} className="sm:w-[20px] sm:h-[20px]" />
        </div>
      </div>

      <div className="px-2 sm:px-4">
        {/* Header: Avatar and Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {post?.avatar_url ? (
              <img
                src={post.avatar_url}
                alt="User Avatar"
                className="w-[35px] h-[35px] sm:w-[45px] sm:h-[45px] rounded-full object-cover"
              />
            ) : (
              <div className="w-[35px] h-[35px] sm:w-[45px] sm:h-[45px] rounded-full bg-gradient-to-tl from-[#8A2BE2] to-[#491F70] text-xl sm:text-2xl flex items-center justify-center font-bold capitalize">
                {post?.username?.slice(0, 1)}
              </div>
            )}
            <div className="flex flex-col flex-1">
              <div className="leading-[20px] sm:leading-[22px] font-semibold text-sm sm:text-base">
                {post.full_name}
                <p className="text-gray-400 text-xs sm:text-sm">@{post.username}</p>
              </div>
            </div>
          </div>

          {/* More Button */}
          <button className="hover:bg-gray-800 rounded-full p-1 sm:p-2 transition">
            <MoreHorizontal size={18} className="sm:w-[20px] sm:h-[20px] text-gray-500" />
          </button>
        </div>

        {/*Content container */}
        <div className="mt-1 sm:mt-2 flex-1">
          <div className="my-2 sm:my-4 text-sm sm:text-[17px] break-words">{post.content}</div>

          {post.image_url && (
            <div className="relative pt-[56.25%] w-full">
              <img
                src={post.image_url}
                alt={post.title}
                className="absolute top-0 left-0 w-full h-full rounded-[10px] object-cover"
              />
            </div>
          )}
        </div>

        {/* Timestamp */}
        <p className="text-gray-500 text-xs sm:text-[15px] mt-2 sm:mt-4">
          Last edited:{" "}
          {new Date(post.created_at).toLocaleString("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Actions container */}
      <div className="mt-2 sm:mt-4 px-2 sm:px-4 py-1 sm:py-1.5 mx-2 sm:mx-4 border-y border-[rgb(84,90,106)] flex items-center justify-between sm:justify-start sm:gap-16 md:gap-25">
        <div className="flex items-center text-[rgb(84,90,106)] transition-all duration-200 cursor-pointer hover:text-green-600 group">
          <div className="group-hover:bg-green-500/20 group-hover:text-green-600 rounded-full p-1 sm:p-2">
            <MessageCircle size={18} className="sm:w-[21px] sm:h-[21px]" />
          </div>
          <span className="ml-0.5 text-sm sm:text-[16px]">
            {commentLoading ? "..." : commentCount}
          </span>
        </div>

        <LikeButton postId={postId} />
        <BookmarkButton postId={postId} />
      </div>

      <div className="py-1 sm:py-2 pl-4 sm:pl-19 text-xs sm:text-sm">
        replying to @{post.username}
      </div>

      <div className="">
        <CommentSection postId={postId} />
      </div>
    </div>
  );
};
