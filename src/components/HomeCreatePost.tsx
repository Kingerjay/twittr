import { ChangeEvent, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { Image, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface PostInput {
  content: string;
  image_url?: string;
  user_id?: string;
  author: string;
}

const createPost = async (post: PostInput, imageFile?: File) => {
  let imageUrl = post.image_url;

  // Upload image if provided
  if (imageFile) {
    const filePath = `${Date.now()}-${imageFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(filePath, imageFile);
    if (uploadError) throw new Error(uploadError.message);

    const { data: publicUrlData } = supabase.storage
      .from("post-images")
      .getPublicUrl(filePath);
    imageUrl = publicUrlData.publicUrl;
  }

  // Get author info from profiles table
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, username, avatar_url")
    .eq("id", post.user_id)
    .single();

  if (profileError || !profile) throw new Error("Failed to fetch user profile");

  // Create the post
  const { data, error } = await supabase.from("posts").insert({
    content: post.content,
    image_url: imageUrl || null,
    user_id: post.user_id,
    full_name: profile.full_name,
    username: profile.username,
    avatar_url: profile.avatar_url,
  });

  if (error) throw new Error(error.message);
  return data;
};

export const HomeCreatePost = () => {
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const { user } = useAuth();
  const username = user?.user_metadata?.username || "guest_user";

  const queryClient = useQueryClient();

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

  const { mutate, isPending, error } = useMutation({
    mutationFn: () =>
      createPost(
        {
          content,
          user_id: user?.id,
          author: username,
        },
        selectedFile || undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setContent("");
      setSelectedFile(null);
      setPreviewUrl(null);
      setShowSuccess(true);
    },
    onError: () => setShowError(true),
  });

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  useEffect(() => {
    if (showError) {
      const timer = setTimeout(() => setShowError(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showError]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !selectedFile) return;
    mutate();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return (
    <form onSubmit={handleSubmit} className="w-[95%] mx-auto flex gap-4">
      {profile?.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt="User Avatar"
          className="w-[40px] h-[40px] rounded-full object-cover"
        />
      ) : (
        <div className="w-[40px] h-[40px] rounded-full bg-gradient-to-tl from-[#8A2BE2] to-[#491F70] text-2xl flex justify-center items-center text-white font-bold capitalize">
          {username.charAt(0)}
        </div>
      )}

      <div className="space-y-2 w-[90%]">
        <div>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full text-white text-xl bg-transparent p-2 rounded outline-0 placeholder:text-xl placeholder:font-thin resize-none"
            rows={2}
            placeholder="What's happening?"
            maxLength={160}
          />
          <p className="text-gray-500 text-right text-sm mt-1">
            {content.length}/160
          </p>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <label htmlFor="image" className="text-white cursor-pointer">
              <Image className="text-blue-500 hover:text-blue-600" strokeWidth={1.5} />
            </label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {previewUrl && (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-[50px] h-[30px] rounded-sm object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-0.5 right-2.5 bg-black/50 rounded-full p-1 hover:bg-zinc-900"
                >
                  <X className="text-white" size={20} />
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full disabled:opacity-50"
            disabled={isPending || (!content.trim() && !selectedFile)}
          >
            {isPending ? "Creating..." : "Create Post"}
          </button>
        </div>

        {showSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
            Post created successfully!
          </div>
        )}
        {showError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            Error: {error?.message || "Failed to create post"}
          </div>
        )}
      </div>
    </form>
  );
};
