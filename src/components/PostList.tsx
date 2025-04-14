import { useQuery } from "@tanstack/react-query"
import { supabase } from "../supabase-client";
import { PostItem } from "./PostItem";


export interface Post {
    id: number;
    title: string;
    content: string;
    created_at: string;
    image_url: string;
    avatar_url?: string;
    user_id: string;
    username: string;
    full_name: string;
}

const fetchPost = async (): Promise<Post[]> => {
    const {data, error} = await supabase
    .from("posts")
    .select("id, content, image_url, user_id, username, full_name, avatar_url")
    .order("created_at", {ascending: false});

    if (error) throw new Error(error.message);

    console.log("Fetched posts:", data); 

    return data as Post[];
}


export const PostList = () => {
    const {data, error, isLoading} = useQuery<Post[], Error>({
        queryKey: ["posts"], 
        queryFn: fetchPost,
        // Add these options for better real-time experience
        refetchOnWindowFocus: true,
        staleTime: 1000 * 5, // Consider data fresh for 1 minute
        refetchInterval: 1000 , // Refetch every 30 seconds
    });

    if (isLoading) {
        return <div>Loading Post...</div>
    }

    if (error) {
        return <div>Error: {error.message} </div>
    }

    console.log(data)

 
return (
    <div className="flex flex-col">
        {data?.map((post, key) => (
            <PostItem 
            post={post} 
            key={post.id || key}
            />
        ))}
    </div>
)
}