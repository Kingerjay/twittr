// components/UpdateProfileModal.tsx
import React, { useRef, useState } from 'react';
import { supabase } from '../supabase-client';
import { X, Camera, Image } from 'lucide-react';

export const UpdateProfileModal = ({
  onClose,
  currentProfile,
  onUpdate,
}: {
  onClose: () => void;
  currentProfile: any;
  onUpdate: () => void;
}) => {
  const [bio, setBio] = useState(currentProfile.bio || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      let avatar_url = currentProfile.avatar_url;
      let cover_image_url = currentProfile.cover_image_url;

      // Upload Avatar
      if (avatarFile) {
         const filePath = `${currentProfile.id}-${Date.now()}-avatar`
         const {error: uploadError} = await supabase.storage.from("avatars").upload(filePath, avatarFile)
         if (uploadError) throw new Error(uploadError.message);

         const {data: publicUrlData} = supabase.storage.from("avatars").getPublicUrl(filePath)
         avatar_url = publicUrlData.publicUrl;
      }

          
          
        

      // Upload Cover
      if (coverFile) {
        const { data, error } = await supabase.storage
          .from('covers')
          .upload(`${currentProfile.id}-${Date.now()}-cover`, coverFile, {
            upsert: true,
          });
          
        if (error) {
          console.error("Cover upload error:", error);
          alert(`Cover upload error: ${error.message}`);
          throw error;
        }
        
        if (data) {
          const { data: urlData } = supabase.storage.from('covers').getPublicUrl(data.path);
          cover_image_url = urlData.publicUrl;
        }
      }

      // Update Profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url,
          cover_image_url,
          bio,
        })
        .eq('id', currentProfile.id);

      if (updateError) {
        console.error("Profile update error:", updateError);
        alert(`Failed to update profile: ${updateError.message}`);
        throw updateError;
      }

      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-start justify-center z-50 pt-16 overflow-y-auto">
      <div className="bg-black rounded-2xl w-full max-w-xl mx-4 overflow-hidden border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-800 mr-4"
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold">Edit profile</h2>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-1.5 bg-white text-black rounded-full font-medium hover:bg-gray-200 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* Cover Image */}
        <div className="relative h-48 bg-gray-800">
          {(coverPreview || currentProfile.cover_image_url) && (
            <img
              src={coverPreview || currentProfile.cover_image_url}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="flex gap-4">
              <button
                onClick={() => coverInputRef.current?.click()}
                className="p-2 bg-black/50 rounded-full hover:bg-black/70"
                aria-label="Upload cover image"
              >
                <Image size={20} />
              </button>
              {coverPreview && (
                <button
                  onClick={() => setCoverPreview(null)}
                  className="p-2 bg-black/50 rounded-full hover:bg-black/70"
                  aria-label="Remove cover image"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverChange}
            className="hidden"
          />
        </div>

        {/* Avatar */}
        <div className="relative ml-4 -mt-12 mb-4">
          <div className="relative w-24 h-24 rounded-full border-4 border-black overflow-hidden bg-gray-800">
            {(avatarPreview || currentProfile.avatar_url) && (
              <img
                src={avatarPreview || currentProfile.avatar_url || '/default-avatar.png'}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            )}
            {/* Camera icon inside the avatar circle */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/70 cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
              <Camera size={20} />
            </div>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        {/* Bio */}
        <div className="p-4">
          <label className="block mb-2 text-gray-400 text-sm">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-700 bg-black focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-white resize-none"
            rows={4}
            placeholder="Describe yourself"
            maxLength={160}
          />
          <p className="text-gray-500 text-right text-sm mt-1">
            {bio.length}/160
          </p>
        </div>
      </div>
    </div>
  );
};