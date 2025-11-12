"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, GraduationCap, BookOpen, Clock, MapPin, Camera, Upload } from "lucide-react";
import { createClient } from "../../supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus } from "lucide-react";

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
  const [editingClasses, setEditingClasses] = useState(false);
  const [editingPreferences, setEditingPreferences] = useState(false);
  const [newClass, setNewClass] = useState({ class_code: "", class_name: "", semester: "" });
  const [editedClasses, setEditedClasses] = useState<any[]>([]);
  const [editedPreferences, setEditedPreferences] = useState<any>(null);

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

  const handleEditClasses = () => {
    setEditedClasses([...classes]);
    setEditingClasses(true);
  };

  const handleAddClass = () => {
    if (newClass.class_code && newClass.class_name && newClass.semester) {
      setEditedClasses([...editedClasses, { ...newClass, id: `temp-${Date.now()}` }]);
      setNewClass({ class_code: "", class_name: "", semester: "" });
    }
  };

  const handleRemoveClass = (id: string) => {
    setEditedClasses(editedClasses.filter(c => c.id !== id));
  };

  const handleSaveClasses = async () => {
    const supabase = createClient();
    
    // Delete all existing classes
    await supabase.from("student_classes").delete().eq("user_id", userId);
    
    // Insert new classes
    const classesToInsert = editedClasses.map(({ id, ...cls }) => ({
      ...cls,
      user_id: userId
    }));
    
    const { error } = await supabase.from("student_classes").insert(classesToInsert);
    
    if (error) {
      alert("Failed to save classes: " + error.message);
    } else {
      setClasses(editedClasses);
      setEditingClasses(false);
    }
  };

  const handleEditPreferences = () => {
    setEditedPreferences({ ...preferences });
    setEditingPreferences(true);
  };

  const togglePreferenceArray = (field: string, value: string) => {
    const current = editedPreferences[field] || [];
    const updated = current.includes(value)
      ? current.filter((v: string) => v !== value)
      : [...current, value];
    setEditedPreferences({ ...editedPreferences, [field]: updated });
  };

  const handleSavePreferences = async () => {
    const supabase = createClient();
    
    const { error } = await supabase
      .from("study_preferences")
      .update({
        study_time_preference: editedPreferences.study_time_preference,
        study_location_preference: editedPreferences.study_location_preference,
        group_size_preference: editedPreferences.group_size_preference,
        study_style: editedPreferences.study_style,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId);
    
    if (error) {
      alert("Failed to save preferences: " + error.message);
    } else {
      setPreferences(editedPreferences);
      setEditingPreferences(false);
    }
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
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Current Classes
            </CardTitle>
          </div>
          <Dialog open={editingClasses} onOpenChange={setEditingClasses}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={handleEditClasses}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Classes</DialogTitle>
                <DialogDescription>
                  Add or remove classes. This will update your match recommendations.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-3">
                  {editedClasses.map((cls) => (
                    <div key={cls.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{cls.class_code} - {cls.class_name}</div>
                        <div className="text-sm text-gray-500">{cls.semester}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveClass(cls.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-4">
                  <Label className="text-base mb-3 block">Add New Class</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="class_code">Class Code</Label>
                      <Input
                        id="class_code"
                        placeholder="CS101"
                        value={newClass.class_code}
                        onChange={(e) => setNewClass({ ...newClass, class_code: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="class_name">Class Name</Label>
                      <Input
                        id="class_name"
                        placeholder="Intro to CS"
                        value={newClass.class_name}
                        onChange={(e) => setNewClass({ ...newClass, class_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="semester">Semester</Label>
                      <Input
                        id="semester"
                        placeholder="Fall 2024"
                        value={newClass.semester}
                        onChange={(e) => setNewClass({ ...newClass, semester: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddClass} className="mt-3 w-full" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Class
                  </Button>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveClasses} className="flex-1">
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setEditingClasses(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Study Preferences
            </CardTitle>
          </div>
          <Dialog open={editingPreferences} onOpenChange={setEditingPreferences}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={handleEditPreferences}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Study Preferences</DialogTitle>
                <DialogDescription>
                  Update your preferences to find better study matches.
                </DialogDescription>
              </DialogHeader>
              {editedPreferences && (
                <div className="space-y-6 py-4">
                  <div>
                    <Label className="text-base mb-3 block">Study Times</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {["Morning", "Afternoon", "Evening", "Night"].map((time) => (
                        <div key={time} className="flex items-center space-x-2">
                          <Checkbox
                            id={`time-${time}`}
                            checked={editedPreferences.study_time_preference?.includes(time)}
                            onCheckedChange={() => togglePreferenceArray("study_time_preference", time)}
                          />
                          <label htmlFor={`time-${time}`} className="text-sm cursor-pointer">
                            {time}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-base mb-3 block">Study Locations</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {["Library", "Coffee Shop", "Dorm", "Online"].map((location) => (
                        <div key={location} className="flex items-center space-x-2">
                          <Checkbox
                            id={`location-${location}`}
                            checked={editedPreferences.study_location_preference?.includes(location)}
                            onCheckedChange={() => togglePreferenceArray("study_location_preference", location)}
                          />
                          <label htmlFor={`location-${location}`} className="text-sm cursor-pointer">
                            {location}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-base mb-3 block">Study Style</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {["Visual", "Auditory", "Reading/Writing", "Kinesthetic"].map((style) => (
                        <div key={style} className="flex items-center space-x-2">
                          <Checkbox
                            id={`style-${style}`}
                            checked={editedPreferences.study_style?.includes(style)}
                            onCheckedChange={() => togglePreferenceArray("study_style", style)}
                          />
                          <label htmlFor={`style-${style}`} className="text-sm cursor-pointer">
                            {style}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-base mb-3 block">Group Size Preference</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {["One-on-one", "Small group (3-5)", "Large group (6+)"].map((size) => (
                        <div key={size} className="flex items-center space-x-2">
                          <Checkbox
                            id={`size-${size}`}
                            checked={editedPreferences.group_size_preference === size}
                            onCheckedChange={() => setEditedPreferences({ ...editedPreferences, group_size_preference: size })}
                          />
                          <label htmlFor={`size-${size}`} className="text-sm cursor-pointer">
                            {size}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSavePreferences} className="flex-1">
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setEditingPreferences(false)} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
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