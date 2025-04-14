import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BookmarkButton } from './BookmarkButton';
import { LikeButton } from './LikeButton';
import { supabase } from '../supabase-client';
import { useQuery } from '@tanstack/react-query';


export interface Post {
  id: number;
  content: string;
  image_url?: string;
  created_at: string;
  user_id: string;
  title?: string;
  avatar_url?: string;
  user_metadata?: {
    full_name?: string;
    username?: string;
  };
}

interface PostCardProps {
  post: Post;
  showBookmarkButton?: boolean;
  onPostClick?: () => void;
}

const fetchCommentCount = async (postId: number): Promise<number> => {
  const { count, error } = await supabase
    .from("comments")
    .select("*", { count: 'exact' })
    .eq("post_id", postId);

  if (error) throw new Error(error.message);
  return count || 0;
};

export const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  showBookmarkButton = false,
  onPostClick 
}) => {
  const { user } = useAuth();

  // Use user metadata from the post or fallback to current user
  const fullName = post.user_metadata?.full_name || user?.user_metadata?.full_name || "Guest";
  const username = post.user_metadata?.username || user?.user_metadata?.username || "guest_user";

  const { 
    data: commentCount, 
    isLoading: commentLoading 
  } = useQuery({
    queryKey: ["commentCount", post.id],
    queryFn: () => fetchCommentCount(post.id),
    refetchInterval: 1000, // Optional: refresh every 5 seconds
  });

  return (
    <div className="w-full pt-2 hover:bg-zinc-950 text-white flex flex-col px-5 overflow-hidden transition-colors duration-300 border-b border-[rgb(84,90,106)]">
      <Link to={`/post/${post.id}`} className="block relative z-10">
        <div className="w-full">
          {/* Header: Avatar and Title */}
          <div className="flex space-x-2">
            {post.avatar_url ? (
              <img
                src={post.avatar_url}
                alt="User Avatar"
                className="w-[35px] h-[35px] rounded-full object-cover"
              />
            ) : (
              <div className="w-[45px] h-[45px] rounded-full bg-gradient-to-tl from-[#8A2BE2] to-[#491F70] text-2xl flex justify-center items-center font-bold capitalize">
                {username.slice(0,1)}
              </div>
            )}
            <div className="flex flex-col flex-1">
              <div className="leading-[22px] font-semibold">
                {fullName} <span className="text-gray-400 px-2">@{username}</span>
              </div>
              {/* Image Banner */}
              <div className="text-[17px] flex-1">
                <div className="mb-4">
                  {post.content}
                </div>
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="w-full rounded-[5px] object-cover max-h-full mx-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </Link>
      
      {/* Actions div with separate hover states */}
      <div className="px-12 py-1 flex items-center gap-20">
        <div className="flex items-center text-[rgb(84,90,106)] transition-all duration-200 cursor-pointer hover:text-green-600">
          <div className="hover:bg-green-500/20 hover:text-green-600 rounded-full p-2">
            <MessageCircle size={21} />
          </div>
          <span className="ml-1 text-[16px]">
            {commentLoading ? "..." : commentCount || 0}
          </span>
        </div>
        <LikeButton postId={post.id} />

        {showBookmarkButton && <BookmarkButton postId={post.id} />}
        
      </div>
    </div>
  );
};