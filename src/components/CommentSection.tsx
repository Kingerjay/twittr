import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { CommentItem } from "./CommentItem";
import { Image } from "lucide-react";

interface Props {
    postId: number;
}

interface NewComment {
    content: string;
    parent_comment_id: number | null;
}

export interface Comment {
    id: number;
    post_id: number;
    parent_comment_id: number | null;
    content: string;
    user_id: string;
    created_at: string;
    author: string;
    author_fullname?: string;
    author_avatar?: string;
}

const createComment = async (
    newComment: NewComment, 
    postId: number, 
    userId?: string, 
    author?: string
    ) => {
        if (!userId || !author) {
            throw new Error("You must be logged in to comment.");
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
            content: newComment.content,
            parent_comment_id: newComment.parent_comment_id || null,
            user_id: userId,
            author: profile.username,
            author_fullname: profile.full_name,
            author_avatar: profile.avatar_url,
        });

        if (error) throw new Error(error.message);
};

const fetchComments = async (postId: number): Promise<Comment[]> => {
    const {data, error} = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", postId) 
        .order("created_at", {ascending: true});
    
    if (error) throw new Error(error.message);
    return data as Comment[]; 
}

export const CommentSection = ({postId}: Props) => {
    const [newCommentText, setNewCommentText] = useState<string>("");
    const {user} = useAuth();
    const queryClient = useQueryClient();

    const username = user?.user_metadata.username;
    
    // Fetching logged-in user profile data (avatar_url)
    const { data: profile } = useQuery({
        queryKey: ["profile", user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select("avatar_url")
                .eq("id", user?.id)
                .single();
            if (error) throw new Error(error.message);
            return data;
        },
        enabled: !!user?.id,
    });

    const {
        data: comments, 
        isLoading,  
        error,
    } = useQuery<Comment[], Error>({
        queryKey: ["comments", postId],
        queryFn: () => fetchComments(postId),  
        refetchInterval: 5000,
    });

    const {mutate, isPending, isError} = useMutation({
        mutationFn: (newComment: NewComment) => 
            createComment(
                newComment,
                postId,
                user?.id, 
                user?.user_metadata?.username,
            ),

        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["comments", postId]});
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newCommentText) return;
        mutate({ content: newCommentText, parent_comment_id: null});
        setNewCommentText("");
    };

    // Building Comment Tree
    const buildCommentTree = (flatComments: Comment[]): (Comment & {children?: Comment[]})[] => {
        const map = new Map<number, Comment & { children?: Comment[] }>();
        const roots: (Comment & { children?: Comment[] })[] = [];

        flatComments.forEach((comment) => {
            map.set(comment.id, { ...comment, children: [] });
        });

        flatComments.forEach((comment) => {
           if (comment.parent_comment_id) {
                const parent = map.get(comment.parent_comment_id)
                if (parent) {
                    parent.children!.push(map.get(comment.id)!);
                }
           } else {
                roots.push(map.get(comment.id)!);
           }
        });

        return roots;
    } 

    if (isLoading) {
        return <div>Loading comments...</div>
    }

    if (error) {
        return <div>Error: {error.message} </div>
    }

    // Comment Tree 
    const commentTree = comments ? buildCommentTree(comments) : [];

    return (
        <div className="">

            {/* Create Comment Section */}
            {user ? (
                <div className="border-b border-[rgb(84,90,106)]">
                <form onSubmit={handleSubmit} className="max-w-[96%] mx-auto flex gap-4">

                    <div className="flex-shrink-0">
                        {profile?.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt="User Avatar"
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-10 h-10 text-white rounded-full bg-gradient-to-tl from-[#8A2BE2] to-[#491F70] flex justify-center items-center capitalize">
                                {username?.slice(0, 1)}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2 w-[90%]">
                        <div>  
                            <textarea 
                                value={newCommentText}
                                name="" 
                                id=""
                                rows={2}
                                className="w-full text-white text-[16px] bg-transparent p-2 rounded outline-0 placeholder:text-[16px] placeholder:font-thin resize-none"
                                placeholder="Write a reply"
                                onChange={(e) => setNewCommentText(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <label htmlFor="image" className="text-white block mb-2 font-medium">
                                    <Image className="text-blue-500 hover:text-blue-600" strokeWidth={1.5} />
                                </label>
                                <input
                                    type="file"
                                    id="image"
                                    accept="image/*"
                                    className="w-full text-gray-200 hidden"
                                />
                            </div>

                            <button 
                                type="submit"
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded-[100px] cursor-pointer h-1/2 disabled:opacity-50"
                                disabled={!newCommentText}
                            >
                                {isPending ? "Replying" : "Reply"}
                            </button>
                            {isError && <p>Error posting a comment</p>}
                        </div>
                    </div>
                </form>
                </div>

            ) : (
                <p>You must be logged in to post a comment</p>
            )}

            {/* Comment Display Section */}
            <div className="">
                {commentTree.map((comment, key) => (
                    <div className="border-b border-gray-700" key={key}>
                        <CommentItem comment={comment} postId={postId} />
                    </div>
                ))}
            </div>
        </div>
    );
}
