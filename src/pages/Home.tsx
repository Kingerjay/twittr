import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { HomeCreatePost } from "../components/HomeCreatePost";
import { PostList } from "../components/PostList";
import { supabase } from "../supabase-client";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import Sidebar from "./Sidebar";


const queryClient = new QueryClient();

export const Home = () => {
  const [showSideBar, setShowSideBar] = useState(false);
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url, username")
        .eq("id", user?.id)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id,
  });

  return (
    <QueryClientProvider client={queryClient}>
      <div className="relative flex flex-col h-screen">
        {/* Top tab */}
        <div className="w-full bg-black border-b border-[rgb(84,90,106)] sticky top-0 z-50">
          {/* Mobile top bar */}
          <div className="sm:hidden flex h-[50px] p-4 justify-between items-center">

            {/* Avatar toggle */}
            <div onClick={() => setShowSideBar(prev => !prev)} className="cursor-pointer">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="User Avatar"
                  className="w-[40px] h-[40px] rounded-full object-cover"
                />
              ) : (
                <div className="w-[40px] h-[40px] rounded-full bg-gradient-to-tl from-[#8A2BE2] to-[#491F70] text-2xl flex justify-center items-center text-white font-bold capitalize">
                  {profile?.username?.charAt(0)}
                </div>
              )}
            </div>

            {/* Twitter Icon */}
            <div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" fill="white" />
              </svg>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex">
            <div className="w-1/2 text-gray-500 font-[600] text-lg hover:bg-zinc-950 hover:font-bold hover:text-white flex justify-center items-center py-4">
              For you
            </div>
            <div className="w-1/2 text-gray-500 font-[600] text-lg hover:bg-zinc-950 hover:font-bold hover:text-white flex justify-center items-center py-4">
              Following
            </div>
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="overflow-y-auto scrollbar-hide flex-1">
          <div className="py-2 border-b border-[rgb(84,90,106)]">
            <HomeCreatePost />
          </div>
          <PostList />
        </div>

        {/* Sidebar overlay for mobile */}
        {showSideBar && (
          <div className="fixed top-0 left-0 w-[80%] sm:w-[300px] h-full bg-black border-r border-[rgb(84,90,106)] z-[60] p-4">
            <div className="flex justify-end mb-4">
              
            </div>
            <Sidebar />
          </div>
        )}

        {/* Overlay backdrop */}
        {showSideBar && (
          <div
            onClick={() => setShowSideBar(false)}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          ></div>
        )}
      </div>
    </QueryClientProvider>
  );
};
