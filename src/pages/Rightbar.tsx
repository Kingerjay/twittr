import { useState, useEffect } from 'react';
import { MoreHorizontal, Search } from 'lucide-react';
import { supabase } from "../supabase-client";
import { Link } from "react-router-dom";

// Define the expected user type
interface User {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
}

const Rightbar = () => {
  const [showMore, setShowMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url');

        if (error) {
          console.error('Error fetching suggested users:', error.message);
          return;
        }

        const shuffled = data.sort(() => 0.5 - Math.random());
        const limited = shuffled.slice(0, 5);

        setSuggestedUsers(limited);
      } catch (error) {
        console.error('Unexpected error:', error);
      }
    };

    fetchSuggestedUsers();
  }, []);

  const trendingTopics = [
    { id: 1, category: 'Trending', title: 'Stripe', posts: '5,577 posts' },
    { id: 2, category: 'Business & Finance · Trending', title: 'S&P 500', posts: '4,935 posts' },
    { id: 3, category: 'Trending', title: 'Saas', posts: '4,890 posts' },
    { id: 4, category: 'Technology · Trending', title: 'Tailwind', posts: '1,430 posts' },
    { id: 5, category: 'Trending', title: 'Notion', posts: '33.7k posts' },
    { id: 6, category: 'Technology · Trending', title: '#Figma', posts: '' }
  ];

  const displayedTopics = showMore ? trendingTopics : trendingTopics.slice(0, 4);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim()) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url')
            .ilike('username', `%${searchQuery}%`)
            .or(`full_name.ilike.%${searchQuery}%`);

          if (error) {
            console.error('Error fetching search results:', error.message);
            setSearchResults([]);
          } else {
            setSearchResults(data || []);
          }
        } catch (error) {
          console.error('Error fetching search results:', error);
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className=" bg-black h-screen text-white rounded-xl overflow-y-auto scrollbar-hide">
      {/* Search Bar */}
      <div className="mb-4 sticky top-0 z-50 bg-black py-4">
        <div className="relative ">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-500" />
          </div>
          <input
            type="text"
            className="w-full bg-gray-800 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Search Results */}
        {searchQuery && searchResults.length > 0 && (
          <div className="mt-2 bg-gray-800 rounded-lg shadow-md max-h-60 overflow-y-auto">
            {searchResults.map((user) => (
              <div key={user.id} className="flex items-center justify-between py-3 px-4 hover:bg-gray-700 cursor-pointer">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center mr-3">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <span className="text-white">{user.full_name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{user.full_name}</div>
                    <div className="text-gray-500 text-xs">{user.username}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar Title */}
      <div className="mb-2 text-xl font-bold">You might like</div>

      {/* Suggested Accounts */}
      <div className="mb-4">
        {suggestedUsers.map(user => (
          <div key={user.id} className="flex items-center justify-between py-3">
            <Link
              to={`/user/${user.username}`}
              className="flex items-center hover:bg-gray-800 px-2 py-2 mr-2 rounded-full transition-colors duration-200 cursor-pointer w-full"
            >
              <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center mr-3 overflow-hidden">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white">{user.full_name.charAt(0)}</span>
                )}
              </div>
              <div>
                <div className="font-bold text-sm">{user.full_name}</div>
                <div className="text-gray-500 text-sm">@{user.username}</div>
              </div>
            </Link>
            <button className="bg-white text-black rounded-full px-4 py-1 text-sm font-bold">
              Follow
            </button>
          </div>
        ))}

        <button 
          className="text-blue-500 text-sm pt-1"
          onClick={() => setShowMore(!showMore)}>
          Show more
        </button>
      </div>

      {/* Trending Section */}
      <div>
        <div className="mb-2 text-xl font-bold">Trends for you</div>
        {displayedTopics.map(topic => (
          <div key={topic.id} className="py-3 hover:bg-gray-900 cursor-pointer">
            <div className="flex justify-between">
              <span className="text-gray-500 text-xs">{topic.category}</span>
              <MoreHorizontal size={16} className="text-gray-500" />
            </div>
            <div className="font-bold text-sm">{topic.title}</div>
            {topic.posts && <div className="text-gray-500 text-xs">{topic.posts}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Rightbar;
