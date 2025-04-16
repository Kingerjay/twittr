import { Link } from "react-router-dom";
// import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useQuery} from "@tanstack/react-query";
import { supabase } from "../supabase-client";
// import { useLocation } from "react-router-dom";
import { 
  Home, 
  Search, 
  Bell, 
  Mail, 
  ListOrdered, 
  Bookmark, 
  Users, 
  BadgeCheck, 
  User, 
  MoreHorizontal 
} from "lucide-react";
import { useState } from "react";
import { HomeCreatePost } from "../components/HomeCreatePost";

export interface Profile {
  avatar_url: string | null;
  username: string;
  full_name: string;
}


const Sidebar = () => {
  const { user, signOut } = useAuth(); // Get the authenticated user
  const [showCreatePost, setShowCreatePost] = useState(false);

  const fullName = user?.user_metadata.full_name
  const userName = user?.user_metadata.username

  const menuItems = [
    { icon: <Home size={24} />, label: <Link to={"/"}>Home</Link> },
    // { icon: <Search size={24} />, label: <Link to={"/Create"}>Create Post</Link> },
    { icon: <Bell size={24} />, label: "Notifications" },
    { icon: <Mail size={24} />, label: "Messages" },
    { icon: <ListOrdered size={24} />, label: "Lists" },
    { icon: <Bookmark size={24} />, label: <Link to={"/bookmark"}>Bookmarks</Link> },
    { icon: <Users size={24} />, label: "Communities" },
    { icon: <User size={24} />, label: <Link to={"/profile"}>Profiles</Link> },
  ];

  // Fetching Logged user Profiles
  const { data: profile } = useQuery<Profile>({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url, username, full_name")
        .eq("id", user?.id)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id,
  });

 


  return (
    <div className="flex flex-col h-screen bg-black text-[rgba(247,249,249,1)] p-2">
      
      {/* X Logo */}
      <div className="p-3 mb-2">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" fill="white" />
        </svg>
      </div>

      {/* Menu Items */}
      <nav className="flex-grow">
        <ul>
          {menuItems.map((item, index) => (
            <li key={index}
                className="flex items-center gap-4 p-3 rounded-full hover:font-bold transition-colors text-xl font-normal cursor-pointer"
              >
                {item.icon}
                <span>{item.label}</span>
              
            </li>
          ))}
          <li>
            {/* More (Sign Out) Button */}
            <button 
                onClick={signOut} 
                className="flex items-center gap-4 p-3 rounded-full text-xl font-normal text-left"
                >
                <BadgeCheck size={24} />
                <span className="hover:font-bold hover:text-red-500">Sign Out</span>
            </button>
      </li>
        </ul>
      </nav>

      

      {/* Post Button */}
      <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-full mb-3 transition-colors"
      onClick={()=> setShowCreatePost(prev => !prev)}
      >
        Post
      </button>

      {/* User Profile Section */}
      
        <Link to="/profile">
        <div className="flex items-center gap-2 p-3 hover:bg-zinc-800 rounded-full cursor-pointer mb-2">
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
          <div className="flex-grow min-w-0">
            <div className="flex items-center">
                <p className="font-bold text-sm truncate mr-1">{profile?.full_name || fullName}</p>           
              <span className="text-blue-500 flex-shrink-0">
                <BadgeCheck size={16} />
              </span>
            </div>
            <p className="text-gray-500 text-sm truncate">@{profile?.username || userName}</p>
          </div>
          <span className="text-gray-500">
            <MoreHorizontal size={16} />
          </span>
        </div>
        </Link>
      

      {/* Show Create Post */}
      {showCreatePost && (
        <div className="fixed h-screen inset-0 z-100 bg-zinc-900 opacity-95 flex justify-center items-center backdrop-blur-sm">
          <div className="bg-black p-4 rounded-2xl w-full max-w-xl mx-4">
            <HomeCreatePost />
            <button 
              onClick={() => setShowCreatePost(false)} 
              className="mt-4 text-sm text-red-500 hover:underline block mx-auto"
            >
              close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Sidebar;
