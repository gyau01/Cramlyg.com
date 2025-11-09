"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, GraduationCap, BookOpen, Clock, MapPin, Camera, Upload } from "lucide-react";
import { createClient } from "../../supabase/client";

interface ProfileViewProps {
  userId: string;
}

export default function ProfileView({ userId }: ProfileViewProps) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    const supabase = createClient();

    const [userRes, profileRes, classesRes, preferencesRes] = await Promise.all([
      supabase.from("users").select("full_name, email, profile_picture_url").eq("user_id", userId).single(),
      supabase.from("student_profiles").select("*").eq("user_id", userId).single(),
      supabase.from("student_classes").select("*").eq("user_id", userId),
      supabase.from("study_preferences").select("*").eq("user_id", userId).single()
    ]);

    setUser(userRes.data);
    setProfile(profileRes.data);
    setClasses(classesRes.data || []);
    setPreferences(preferencesRes.data);
    setLoading(false);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    setUploading(true);
    const supabase = createClient();

    // Delete old profile picture if exists
    if (user?.profile_picture_url) {
      const oldPath = user.profile_picture_url.split('/profile-pictures/')[1];
      if (oldPath) {
        await supabase.storage.from('profile-pictures').remove([oldPath]);
      }
    }

    // Upload new image
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/profile.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      alert('Failed to upload image. Please try again.');
      setUploading(false);
      return;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(fileName);

    // Update user record
    const { error: updateError } = await supabase
      .from('users')
      .update({ profile_picture_url: publicUrl })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Update error:', updateError);
      alert('Failed to update profile. Please try again.');
    } else {
      setUser({ ...user, profile_picture_url: publicUrl });
    }

    setUploading(false);
  };

  if (loading) {
    return <div className="text-center py-12">Loading profile...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                {user?.profile_picture_url && (
                  <AvatarImage src={user.profile_picture_url} alt={user?.full_name} />
                )}
                <AvatarFallback className="bg-blue-600 text-white text-2xl">
                  {user?.full_name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1.5 hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <Upload className="h-3 w-3 animate-pulse" />
                ) : (
                  <Camera className="h-3 w-3" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <CardTitle className="text-3xl">{user?.full_name || "User"}</CardTitle>
              <p className="text-gray-500">{user?.email}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-blue-600" />
              Academic Profile
            </CardTitle>
            <CardDescription>Your academic information and background</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">University</p>
              <p className="font-semibold text-lg">{profile?.university}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Major</p>
              <p className="font-semibold text-lg">{profile?.major}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Year of Study</p>
              <p className="font-semibold capitalize">{profile?.year_of_study}</p>
            </div>
            {profile?.gpa && (
              <div>
                <p className="text-sm text-gray-500 mb-1">GPA</p>
                <p className="font-semibold">{profile.gpa}</p>
              </div>
            )}
          </div>
          {profile?.bio && (
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500 mb-2">Bio</p>
              <p className="text-gray-700">{profile.bio}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Current Classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {classes.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {classes.map((cls) => (
                <div key={cls.id} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary" className="font-mono">
                      {cls.class_code}
                    </Badge>
                    <span className="text-xs text-gray-500">{cls.semester}</span>
                  </div>
                  <p className="font-medium text-gray-900">{cls.class_name}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No classes added yet</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Study Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Preferred Study Times</p>
            <div className="flex flex-wrap gap-2">
              {preferences?.study_time_preference?.map((time: string) => (
                <Badge key={time} variant="outline" className="bg-green-50 border-green-200">
                  {time}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Preferred Locations</p>
            <div className="flex flex-wrap gap-2">
              {preferences?.study_location_preference?.map((location: string) => (
                <Badge key={location} variant="outline" className="bg-purple-50 border-purple-200">
                  <MapPin className="h-3 w-3 mr-1" />
                  {location}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Group Size Preference</p>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              {preferences?.group_size_preference}
            </Badge>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Study Style</p>
            <div className="flex flex-wrap gap-2">
              {preferences?.study_style?.map((style: string) => (
                <Badge key={style} variant="outline" className="bg-orange-50 border-orange-200">
                  {style}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}