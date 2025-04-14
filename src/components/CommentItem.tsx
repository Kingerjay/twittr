import { useState } from "react";
import { Comment } from "./CommentSection";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Heart, Repeat2, MoreHorizontal, Image } from "lucide-react";

interface Props {
  comment: Comment & {
    children?: Comment[];
  };
  postId: number;
}

const createReply = async (
  replyContent: string,
  postId: number,
  parent_comment_id: number,
  userId?: string,
  author?: string,
) => {
  if (!userId || !author) {
    throw new Error("You must be logged in to reply.");
  }

  // Fetch profile info
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("username, full_name, avatar_url")
    .eq("id", userId)
    .single();

  if (profileError) throw new Error(profileError.message);

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    content: replyContent,
    parent_comment_id: parent_comment_id,
    user_id: userId,
    author: profile.username,
    author_fullname: profile.full_name,
    author_avatar: profile.avatar_url,
  });
  if (error) throw new Error(error.message);
};

export const CommentItem = ({ comment, postId }: Props) => {
  const [showReply, setShowReply] = useState<boolean>(false);
  const [replyText, setReplyText] = useState<string>("");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const username = user?.user_metadata?.username;
  
  const { mutate, isPending, isError } = useMutation({
    mutationFn: (replyContent: string) =>
      createReply(
        replyContent,
        postId,
        comment.id,
        user?.id,
        user?.user_metadata?.username,
       
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      setReplyText("");
      setShowReply(false);
    },
  });

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText) return;
    mutate(replyText);
  };

  // Format date to Twitter style
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    }).format(date);
  };

  return (
    <div className=" px-4 py-3">
      <div className="flex space-x-3">
        {/* User Avatar */}
        <div className="flex-shrink-0">
          {/* User Avatar */}
        <div className="flex-shrink-0">
          {comment.author_avatar ? (
            <img
              src={comment.author_avatar}
              alt="User Avatar"
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 text-white rounded-full bg-gradient-to-tl from-[#8A2BE2] to-[#491F70] flex justify-center items-center capitalize">
              {comment.author.slice(0, 1)}
            </div>
          )}
        </div>
        </div>

        <div className="flex-1 min-w-0">
          {/* Comment Header */}
          <div className="flex items-center text-sm">
            <span className="font-bold text-white">{comment.author_fullname}</span>
            <span className="text-gray-500 ml-1">@{comment.author.toLowerCase().replace(/\s/g, '')}</span>
            <span className="text-gray-500 mx-1">·</span>
            <span className="text-gray-500">{formatDate(comment.created_at)}</span>
            <div className="ml-auto">
              <button className="text-gray-500 hover:text-gray-400">
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>

          {/* Comment Content */}
          <p className="text-white mt-1">{comment.content}</p>

          {/* Comment Actions */}
          <div className="flex justify-between mt-2 max-w-md text-gray-500">
            <button 
              onClick={() => setShowReply(prev => !prev)} 
              className="flex items-center hover:text-blue-400 transition-colors"
            >
              <MessageCircle size={18} />
              <span className="ml-1 text-xs">{comment.children?.length || 0}</span>
            </button>
            <button className="flex items-center hover:text-green-400 transition-colors">
              <Repeat2 size={18} />
              <span className="ml-1 text-xs"></span>
            </button>
            <button className="flex items-center hover:text-pink-400 transition-colors">
              <Heart size={18} />
              <span className="ml-1 text-xs"></span>
            </button>
          </div>

          {/* Reply Form */}
          {showReply && user && (
            <div className="mt-3 border-t border-gray-700 pt-3">
              <form onSubmit={handleReplySubmit} className="flex">
                <div className="mr-2 flex-shrink-0">
                  <div className="mr-2 flex-shrink-0">
                  {comment.author_avatar ? (
                    <img
                      src={comment.author_avatar}
                      alt="User Avatar"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 text-white rounded-full bg-gradient-to-tl from-[#8A2BE2] to-[#491F70] flex justify-center items-center capitalize">
                      {comment.author.slice(0, 1)}
                    </div>
                  )}
                </div>
                </div>
                <div className="flex-1 space-y-2">
                  <textarea
                    value={replyText}
                    placeholder="Tweet your reply"
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full bg-transparent text-white border-none focus:ring-0 resize-none placeholder:text-gray-500 text-sm"
                    rows={2}
                  />
                  <div className="flex justify-between items-center">
                    <div>
                      <label htmlFor="reply-image" className="cursor-pointer text-blue-500 hover:text-blue-400">
                        <Image size={18} strokeWidth={1.5} />
                      </label>
                      <input id="reply-image" type="file" accept="image/*" className="hidden" />
                    </div>
                    <button
                      type="submit"
                      disabled={!replyText || isPending}
                      className="px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-medium disabled:opacity-50"
                    >
                      {isPending ? "Posting..." : "Reply"}
                    </button>
                  </div>
                  {isError && <p className="text-red-500 text-sm">Error posting reply</p>}
                </div>
              </form>
            </div>
          )}

          {/* Nested Comments */}
          {comment.children && comment.children.length > 0 && (
            <div className="mt-3 pl-2 ">
              {comment.children.map((reply, index) => (
                <CommentItem key={index} comment={reply} postId={postId} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};