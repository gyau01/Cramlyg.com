"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, BarChart3, Clock, MapPin, Users, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PollsViewProps {
  userId: string;
}

export default function PollsView({ userId }: PollsViewProps) {
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingPoll, setCreatingPoll] = useState(false);
  const [newPoll, setNewPoll] = useState({
    title: "",
    description: "",
    poll_type: "study_time", // study_time, study_location, study_group_size, etc.
    options: [] as string[],
    newOption: ""
  });

  useEffect(() => {
    loadPolls();
  }, [userId]);

  const loadPolls = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("polls")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading polls:", error);
      } else {
        setPolls(data || []);
      }
    } catch (error) {
      console.error("Error loading polls:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOption = () => {
    if (newPoll.newOption.trim()) {
      setNewPoll({
        ...newPoll,
        options: [...newPoll.options, newPoll.newOption.trim()],
        newOption: ""
      });
    }
  };

  const handleRemoveOption = (index: number) => {
    setNewPoll({
      ...newPoll,
      options: newPoll.options.filter((_, i) => i !== index)
    });
  };

  const handleCreatePoll = async () => {
    // Validate title
    const trimmedTitle = newPoll.title.trim();
    if (!trimmedTitle) {
      alert("Please provide a poll title.");
      return;
    }

    // Validate options - filter out empty strings and check count
    const validOptions = newPoll.options.filter(opt => opt.trim().length > 0);
    if (validOptions.length < 2) {
      alert("Please provide at least 2 valid options (non-empty).");
      return;
    }

    console.log("Creating poll with:", {
      title: trimmedTitle,
      options: validOptions,
      poll_type: newPoll.poll_type,
      userId
    });

    try {
      const supabase = createClient();
      
      // Create poll
      const { data: pollData, error: pollError } = await supabase
        .from("polls")
        .insert({
          user_id: userId,
          title: trimmedTitle,
          description: newPoll.description.trim() || null,
          poll_type: newPoll.poll_type,
          options: validOptions,
          votes: validOptions.reduce((acc, option) => {
            acc[option] = 0;
            return acc;
          }, {} as Record<string, number>)
        })
        .select()
        .single();

      if (pollError) {
        console.error("Error creating poll:", pollError);
        console.error("Error details:", JSON.stringify(pollError, null, 2));
        alert("Failed to create poll: " + pollError.message + "\n\nCheck the browser console for details.");
        return;
      }

      console.log("Poll created successfully:", pollData);

      // Reset form
      setNewPoll({
        title: "",
        description: "",
        poll_type: "study_time",
        options: [],
        newOption: ""
      });
      setCreatingPoll(false);
      
      // Reload polls
      await loadPolls();
      alert("Poll created successfully!");
    } catch (error: any) {
      console.error("Error creating poll:", error);
      alert("An error occurred: " + (error.message || "Unknown error"));
    }
  };

  const handleVote = async (pollId: string, option: string) => {
    try {
      const supabase = createClient();
      
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from("poll_votes")
        .select("*")
        .eq("poll_id", pollId)
        .eq("user_id", userId)
        .single();

      if (existingVote) {
        alert("You have already voted on this poll.");
        return;
      }

      // Get current poll
      const { data: poll } = await supabase
        .from("polls")
        .select("*")
        .eq("id", pollId)
        .single();

      if (!poll) return;

      // Update votes
      const updatedVotes = { ...poll.votes };
      updatedVotes[option] = (updatedVotes[option] || 0) + 1;

      // Update poll
      await supabase
        .from("polls")
        .update({ votes: updatedVotes })
        .eq("id", pollId);

      // Record vote
      await supabase
        .from("poll_votes")
        .insert({
          poll_id: pollId,
          user_id: userId,
          selected_option: option
        });

      // Reload polls
      await loadPolls();
    } catch (error: any) {
      console.error("Error voting:", error);
      alert("Failed to vote: " + (error.message || "Unknown error"));
    }
  };

  const getPollTypeIcon = (type: string) => {
    switch (type) {
      case "study_time":
        return <Clock className="h-4 w-4" />;
      case "study_location":
        return <MapPin className="h-4 w-4" />;
      case "study_group_size":
        return <Users className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getPollTypeLabel = (type: string) => {
    switch (type) {
      case "study_time":
        return "Study Time";
      case "study_location":
        return "Study Location";
      case "study_group_size":
        return "Group Size";
      default:
        return "General";
    }
  };

  const getTotalVotes = (votes: Record<string, number>) => {
    return Object.values(votes || {}).reduce((sum, count) => sum + count, 0);
  };

  if (loading) {
    return <div className="text-center py-12">Loading polls...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Polls</h2>
          <p className="text-gray-600 mt-1">Create and vote on polls about study preferences</p>
        </div>
        <Dialog open={creatingPoll} onOpenChange={setCreatingPoll}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Poll
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Poll</DialogTitle>
              <DialogDescription>
                Create a poll to gather opinions from the community
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 pt-4">
              <div>
                <Label htmlFor="poll_type">Poll Type</Label>
                <Select
                  value={newPoll.poll_type}
                  onValueChange={(value) => setNewPoll({ ...newPoll, poll_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select poll type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="study_time">Study Time</SelectItem>
                    <SelectItem value="study_location">Study Location</SelectItem>
                    <SelectItem value="study_group_size">Group Size</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">Poll Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., What's your preferred study time?"
                  value={newPoll.title}
                  onChange={(e) => setNewPoll({ ...newPoll, title: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add more context about your poll..."
                  value={newPoll.description}
                  onChange={(e) => setNewPoll({ ...newPoll, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label>Poll Options (at least 2 required)</Label>
                <div className="space-y-2 mt-2">
                  {newPoll.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={option}
                        readOnly
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveOption(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Add an option..."
                      value={newPoll.newOption}
                      onChange={(e) => setNewPoll({ ...newPoll, newOption: e.target.value })}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddOption();
                        }
                      }}
                    />
                    <Button onClick={handleAddOption} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreatePoll} className="flex-1">
                Create Poll
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCreatingPoll(false);
                  setNewPoll({
                    title: "",
                    description: "",
                    poll_type: "study_time",
                    options: [],
                    newOption: ""
                  });
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {polls.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No polls yet. Be the first to create one!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {polls.map((poll) => {
            const totalVotes = getTotalVotes(poll.votes || {});
            return (
              <Card key={poll.id} className="shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getPollTypeIcon(poll.poll_type)}
                        <Badge variant="outline">{getPollTypeLabel(poll.poll_type)}</Badge>
                      </div>
                      <CardTitle className="text-xl">{poll.title}</CardTitle>
                      {poll.description && (
                        <CardDescription className="mt-2">{poll.description}</CardDescription>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {poll.options.map((option: string) => {
                      const votes = poll.votes?.[option] || 0;
                      const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                      return (
                        <div key={option} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{option}</span>
                            <span className="text-sm text-gray-600">
                              {votes} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVote(poll.id, option)}
                            className="w-full"
                          >
                            Vote for {option}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

