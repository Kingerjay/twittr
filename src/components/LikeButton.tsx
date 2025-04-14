import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, ThumbsDown, ThumbsUp } from "lucide-react";
import { supabase } from "../supabase-client";
import { useAuth } from "../context/AuthContext";

interface Props {
    postId: number;
}

interface Vote {
    id: number;
    post_id: number;
    user_id: string;
    vote: number;
}

const vote = async (voteValue: number, postId: number, userId: string) => {

    const {data: existingVote} = await supabase
    .from("votes")
    .select("*")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle()

    if (existingVote)  {
        if (existingVote.vote === voteValue) {
            const {error} = await supabase
            .from("votes")
            .delete()
            .eq("id", existingVote.id); 

            if (error) throw new Error(error.message)

        } else {
            
             const {error} = await supabase
            .from("votes")
            .update({vote: voteValue})
            .eq("id", existingVote.id); 

            if (error) throw new Error(error.message)
     }

    } else {
            const {error} = await supabase
            .from("votes")
            .insert({post_id: postId, user_id: userId, vote: voteValue });
            if (error) throw new Error(error.message);
        }
    };

    const fetchVotes = async (postId: number): Promise<Vote[]> => {
         const {data, error} = await supabase
            .from("votes")
            .select("*")
            .eq("post_id", postId) 

        if (error) throw new Error(error.message);
         return data as Vote[];
        }

export const LikeButton = ({postId}: Props) => {
    const {user} = useAuth();

    const queryClient = useQueryClient()

    const {data: votes, isLoading, error} = useQuery<Vote[], Error>({
        queryKey: ["votes", postId],
        queryFn: () => fetchVotes(postId),  
        refetchInterval: 5000,
    });

    const {mutate} = useMutation({
        mutationFn: (voteValue: number) => {
         if (!user) throw new Error("You must be logged in to vote")
         return vote(voteValue, postId, user.id )
     },

     onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["votes", postId ]})
     }
    });

    if (isLoading) {
        return <div>Loading votes...</div>
    }

    if (error) {
        return <div>Error: {error.message} </div>
    }

    const likes = votes?.filter((v) => v.vote === 1).length || 0;
    const dislikes = votes?.filter((v) => v.vote === -1).length || 0;
    const userVote = votes?.find((v) => v.user_id === user?.id )?.vote;

    
    return (
        <div className="flex items-center gap-8 sm:gap-25">
            <button 
            className={`flex items-center cursor-pointer  ${userVote === 1 ? "text-pink-600" : "text-[rgb(84,90,106)]"} transition-all hover:text-pink-600 group`}
            onClick={() => mutate(1)}> 

            <div className="p-2 rounded-full transition-all duration-200 
            group-hover:bg-pink-500/20 group-hover:text-pink-600">
            <Heart size={22} />
            </div>

            {likes} 
            </button>

            <button 
            className={`flex items-center cursor-pointer  ${userVote === -1 ? "text-red-600" : "text-[rgb(84,90,106)]"} transition-all hover:text-red-600 group`}   
            onClick={() => mutate(-1)}> 

            <div className="p-2 rounded-full transition-all duration-200 
            group-hover:bg-red-500/20 group-hover:text-red-600">
            <ThumbsDown size={20}/>
            </div>
            
            {dislikes} 
            </button>
        </div>
    )
}