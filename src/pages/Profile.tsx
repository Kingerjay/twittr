import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase-client';
import { useAuth } from '../context/AuthContext';
import { CalendarDays, Link as LinkIcon, MapPin, ArrowLeft } from 'lucide-react';
import { PostItem } from '../components/PostItem';
import { UpdateProfileModal } from '../components/UpdateProfileModal';

// Type for Profile
interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  created_at: string;
  cover_image_url?: string;
}

// Type for Post
interface Post {
  id: string;
  title?: string;
  content?: string;
  created_at: string;
  image_url?: string;
  user_id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
}

// Valid tab names
type Tab = 'posts' | 'replies' | 'media' | 'likes';

// Fetch user profile
const fetchUserProfile = async ({
  username,
  userId
}: { username?: string; userId?: string }): Promise<Profile> => {
  if (username) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !data) throw new Error("Profile not found by username");
    return data;
  }

  if (userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) throw new Error("Profile not found by user ID");
    return data;
  }

  throw new Error("No username or userId provided");
};

// Profile Component
export const Profile: React.FC = () => {
  const { username } = useParams<{ username?: string }>();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('posts');
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const userProfileKey = username
    ? ['user_profile', 'username', username]
    : ['user_profile', 'id', currentUser?.id || ''];

  const onUpdate = async () => {
    await queryClient.invalidateQueries({ queryKey: userProfileKey });
  };

  if (!currentUser) {
    return <div className="text-white">Loading user data...</div>;
  }

  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError
  } = useQuery<Profile>({
    queryKey: userProfileKey,
    queryFn: () => fetchUserProfile({
      username: username,
      userId: username ? undefined : currentUser?.id
    }),
    enabled: !!(username || currentUser?.id),
    retry: 1
  });

  const {
    data: posts,
    isLoading: postsLoading
  } = useQuery<Post[]>({
    queryKey: ['user_posts', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Posts fetch error:", error);
        return [];
      }
      return data;
    },
    enabled: !!profile?.id
  });

  if (profileError) {
    return (
      <div className="bg-black h-screen text-white flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
        <p className="text-gray-500 mb-4">
          We couldn't find a profile with the username "{username}"
        </p>
        <details className="text-gray-400 max-w-md">
          <summary>Debug Information</summary>
          <pre>{JSON.stringify(profileError, null, 2)}</pre>
        </details>
      </div>
    );
  }

  if (profileLoading || !profile) {
    return <div className="bg-black h-screen text-white flex items-center justify-center">Loading profile...</div>;
  }

  return (
    <div className="bg-black h-screen text-white overflow-y-auto scrollbar-hide">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black flex items-center p-4 border-b border-gray-800">
        <Link to={'/'}>
          <button title='back' className="mr-4 hover:bg-gray-800 rounded-full p-2 cursor-pointer">
            <ArrowLeft size={24} />
          </button>
        </Link>
        <div>
          <h2 className="text-xl font-bold">{profile.full_name}</h2>
          <p className="text-gray-500 text-sm">{posts?.length || 0} posts</p>
        </div>
      </div>

      {/* Cover Image */}
      <div className="relative">
        {profile.cover_image_url ? (
          <img
            src={profile.cover_image_url}
            alt="Cover"
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gray-800" />
        )}

        {/* Avatar */}
        <div className="absolute -bottom-12 left-4 border-4 border-black rounded-full">
          <img
            src={profile.avatar_url || '/default-avatar.png'}
            alt="Avatar"
            className="w-24 h-24 rounded-full object-cover"
          />
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-4 mt-16">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">{profile.full_name}</h1>
            <p className="text-gray-500">@{profile.username}</p>
          </div>

          {profile.id === currentUser?.id && (
            <button
              className="border px-4 py-1 rounded-full text-sm font-semibold hover:bg-gray-800"
              onClick={() => setShowModal(true)}
            >
              Edit Profile
            </button>
          )}
        </div>

        {profile.bio && <p className="mt-2 text-white">{profile.bio}</p>}

        <div className="flex flex-wrap gap-4 text-gray-400 text-sm mt-3">
          {profile.location && (
            <span className="flex items-center gap-1">
              <MapPin size={16} />
              {profile.location}
            </span>
          )}
          {profile.website && (
            <span className="flex items-center gap-1">
              <LinkIcon size={16} />
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                {profile.website.replace(/^https?:\/\//, '')}
              </a>
            </span>
          )}
          <span className="flex items-center gap-1">
            <CalendarDays size={16} />
            Joined {new Date(profile.created_at).toLocaleString('default', { month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-around mt-6 border-b border-gray-800">
        {['posts', 'replies', 'media', 'likes'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as Tab)}
            className={`py-3 font-semibold capitalize ${
              activeTab === tab
                ? 'border-b-2 border-blue-500 text-white'
                : 'text-gray-500 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {postsLoading ? (
          <div className="p-4 text-gray-400">Loading posts...</div>
        ) : posts && posts.length > 0 ? (
          posts.map((post) => (
            <PostItem key={post.id} post={post} />
          ))
        ) : (
          <div className="p-4 text-gray-500">No posts yet.</div>
        )}
      </div>

      {/* Edit Modal */}
      {showModal && (
        <UpdateProfileModal
          currentProfile={profile}
          onClose={() => setShowModal(false)}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
};
