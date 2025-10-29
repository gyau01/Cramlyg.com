"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X } from "lucide-react";

interface ProfileSetupProps {
  onComplete: () => void;
}

export default function ProfileSetup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Academic Info State
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("");
  const [gpa, setGpa] = useState("");
  const [bio, setBio] = useState("");

  // Classes State
  const [classes, setClasses] = useState<Array<{ code: string; name: string; semester: string }>>([
    { code: "", name: "", semester: "" }
  ]);

  // Study Preferences State
  const [studyTimes, setStudyTimes] = useState<string[]>([]);
  const [studyLocations, setStudyLocations] = useState<string[]>([]);
  const [groupSize, setGroupSize] = useState("");
  const [studyStyles, setStudyStyles] = useState<string[]>([]);

  const addClass = () => {
    setClasses([...classes, { code: "", name: "", semester: "" }]);
  };

  const removeClass = (index: number) => {
    setClasses(classes.filter((_, i) => i !== index));
  };

  const updateClass = (index: number, field: string, value: string) => {
    const updated = [...classes];
    updated[index] = { ...updated[index], [field]: value };
    setClasses(updated);
  };

  const togglePreference = (value: string, state: string[], setState: (val: string[]) => void) => {
    if (state.includes(value)) {
      setState(state.filter(item => item !== value));
    } else {
      setState([...state, value]);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/profile/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: { university, major, yearOfStudy, gpa: parseFloat(gpa), bio },
          classes: classes.filter(c => c.code && c.name),
          preferences: { studyTimes, studyLocations, groupSize, studyStyles }
        })
      });

      if (response.ok) {
        router.push("/dashboard/finding-matches");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
          <p className="text-gray-600">Help us find your perfect study buddy</p>
          <div className="flex justify-center gap-2 mt-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 w-24 rounded-full transition-colors ${
                  s <= step ? "bg-blue-600" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        {step === 1 && (
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Academic Information</CardTitle>
              <CardDescription>Tell us about your academic background</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="university">University</Label>
                <Input
                  id="university"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="e.g., Stanford University"
                />
              </div>
              <div>
                <Label htmlFor="major">Major</Label>
                <Input
                  id="major"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="e.g., Computer Science"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="year">Year of Study</Label>
                  <Select value={yearOfStudy} onValueChange={setYearOfStudy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="freshman">Freshman</SelectItem>
                      <SelectItem value="sophomore">Sophomore</SelectItem>
                      <SelectItem value="junior">Junior</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                      <SelectItem value="graduate">Graduate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="gpa">GPA (Optional)</Label>
                  <Input
                    id="gpa"
                    type="number"
                    step="0.01"
                    min="0"
                    max="4"
                    value={gpa}
                    onChange={(e) => setGpa(e.target.value)}
                    placeholder="3.5"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us a bit about yourself and your study goals..."
                  rows={4}
                />
              </div>
              <Button onClick={() => setStep(2)} className="w-full" disabled={!university || !major || !yearOfStudy}>
                Next
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Current Classes</CardTitle>
              <CardDescription>Add the classes you're currently taking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {classes.map((cls, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label>Code</Label>
                        <Input
                          value={cls.code}
                          onChange={(e) => updateClass(index, "code", e.target.value)}
                          placeholder="CS101"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Name</Label>
                        <Input
                          value={cls.name}
                          onChange={(e) => updateClass(index, "name", e.target.value)}
                          placeholder="Introduction to Programming"
                        />
                      </div>
                    </div>
                    <Input
                      value={cls.semester}
                      onChange={(e) => updateClass(index, "semester", e.target.value)}
                      placeholder="Fall 2024"
                    />
                  </div>
                  {classes.length > 1 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeClass(index)}
                      className="mb-0.5"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" onClick={addClass} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Another Class
              </Button>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1">
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Study Preferences</CardTitle>
              <CardDescription>Help us match you with compatible study partners</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base mb-3 block">Preferred Study Times</Label>
                <div className="grid grid-cols-2 gap-3">
                  {["Morning", "Afternoon", "Evening", "Late Night"].map((time) => (
                    <div key={time} className="flex items-center space-x-2">
                      <Checkbox
                        id={time}
                        checked={studyTimes.includes(time)}
                        onCheckedChange={() => togglePreference(time, studyTimes, setStudyTimes)}
                      />
                      <label htmlFor={time} className="text-sm cursor-pointer">
                        {time}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base mb-3 block">Preferred Study Locations</Label>
                <div className="grid grid-cols-2 gap-3">
                  {["Library", "Coffee Shop", "Dorm", "Online"].map((location) => (
                    <div key={location} className="flex items-center space-x-2">
                      <Checkbox
                        id={location}
                        checked={studyLocations.includes(location)}
                        onCheckedChange={() => togglePreference(location, studyLocations, setStudyLocations)}
                      />
                      <label htmlFor={location} className="text-sm cursor-pointer">
                        {location}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="groupSize">Preferred Group Size</Label>
                <Select value={groupSize} onValueChange={setGroupSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-on-one">One-on-One</SelectItem>
                    <SelectItem value="small">Small Group (3-4)</SelectItem>
                    <SelectItem value="large">Large Group (5+)</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-base mb-3 block">Study Style</Label>
                <div className="grid grid-cols-2 gap-3">
                  {["Visual Learner", "Auditory Learner", "Hands-on", "Discussion-based"].map((style) => (
                    <div key={style} className="flex items-center space-x-2">
                      <Checkbox
                        id={style}
                        checked={studyStyles.includes(style)}
                        onCheckedChange={() => togglePreference(style, studyStyles, setStudyStyles)}
                      />
                      <label htmlFor={style} className="text-sm cursor-pointer">
                        {style}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
                  {loading ? "Saving..." : "Complete Profile"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}