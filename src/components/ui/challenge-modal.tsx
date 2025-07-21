"use client";

import { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  friendName: string;
  friendId: string;
  onChallenge: (challengeData: {
    title: string;
    description: string;
    targetProblems: number;
    durationDays: number;
  }) => void;
}

export function ChallengeModal({ isOpen, onClose, friendName, friendId, onChallenge }: ChallengeModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetProblems, setTargetProblems] = useState(10);
  const [durationDays, setDurationDays] = useState(7);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!title.trim()) return;
    
    onChallenge({
      title: title.trim(),
      description: description.trim(),
      targetProblems,
      durationDays
    });
    
    // Reset form
    setTitle("");
    setDescription("");
    setTargetProblems(10);
    setDurationDays(7);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in zoom-in duration-300">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Challenge {friendName} 🏆
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Challenge Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., 7-Day LeetCode Sprint"
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Let's see who can solve more problems!"
              className="w-full"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Problems
              </label>
              <Input
                type="number"
                value={targetProblems}
                onChange={(e) => setTargetProblems(parseInt(e.target.value) || 1)}
                min="1"
                max="100"
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (days)
              </label>
              <Input
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
                min="1"
                max="30"
                className="w-full"
              />
            </div>
          </div>
        </div>
        
        <div className="flex space-x-3 mt-8">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
          >
            Send Challenge
          </Button>
        </div>
      </div>
    </div>
  );
}