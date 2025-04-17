import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { GameWithPlayers, User, Poem } from "@shared/schema";
import Timer from "@/components/Timer";

interface WritingPhaseProps {
  game: GameWithPlayers;
  currentUser: User;
  refetchGame: () => void;
}

export default function WritingPhase({ game, currentUser, refetchGame }: WritingPhaseProps) {
  const { toast } = useToast();
  const [poem, setPoem] = useState("");
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  
  const currentRound = game.currentRound;
  const isJudge = currentRound?.judgeId === currentUser.id;
  
  // Find player's poem for this round
  const userPlayer = game.players.find(p => p.userId === currentUser.id);
  const myPoem = currentRound?.poems.find(p => p.playerId === userPlayer?.id);
  
  // Calculate time remaining when component mounts
  useEffect(() => {
    if (currentRound?.endTime) {
      const endTime = new Date(currentRound.endTime).getTime();
      const now = Date.now();
      const remainingTime = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeRemaining(remainingTime);
      
      // Set up timer
      const timer = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        setTimeRemaining(remaining);
        
        if (remaining <= 0) {
          clearInterval(timer);
          refetchGame();
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [currentRound?.endTime, refetchGame]);
  
  // Transition to judging phase when time expires
  useEffect(() => {
    if (isJudge && timeRemaining === 0) {
      startJudgingPhase();
    }
  }, [timeRemaining, isJudge]);
  
  // Initialize poem content from existing poem if it exists
  useEffect(() => {
    if (myPoem && myPoem.content) {
      setPoem(myPoem.content);
    }
  }, [myPoem]);
  
  // Save poem mutation (auto-save)
  const savePoemMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!myPoem) return null;
      
      const response = await apiRequest("PUT", `/api/poems/${myPoem.id}`, {
        content
      });
      return response.json();
    },
    onError: (error) => {
      console.error("Error saving poem:", error);
      toast({
        title: "Error",
        description: "Failed to save your poem",
        variant: "destructive",
      });
    }
  });
  
  // Submit poem mutation
  const submitPoemMutation = useMutation({
    mutationFn: async () => {
      if (!myPoem) return null;
      
      const response = await apiRequest("POST", `/api/poems/${myPoem.id}/submit`, {});
      return response.json();
    },
    onSuccess: (data: Poem) => {
      toast({
        title: "Poem submitted",
        description: "Your poem has been submitted successfully"
      });
      queryClient.invalidateQueries({ queryKey: [`/api/games/${game.id}`] });
      refetchGame();
    },
    onError: (error) => {
      console.error("Error submitting poem:", error);
      toast({
        title: "Error",
        description: "Failed to submit your poem",
        variant: "destructive",
      });
    }
  });
  
  // Auto-save poem every 10 seconds
  useEffect(() => {
    if (!myPoem || isJudge) return;
    
    const saveInterval = setInterval(() => {
      if (poem.trim() && poem !== myPoem.content) {
        savePoemMutation.mutate(poem);
      }
    }, 10000);
    
    return () => clearInterval(saveInterval);
  }, [poem, myPoem, isJudge]);
  
  // Start judging phase mutation (for judge only)
  const startJudgingPhaseMutation = useMutation({
    mutationFn: async () => {
      if (!currentRound) return null;
      
      const response = await apiRequest("PUT", `/api/rounds/${currentRound.id}/status`, {
        status: "judging"
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Judging phase started",
        description: "You can now review and select the winning poem"
      });
      queryClient.invalidateQueries({ queryKey: [`/api/games/${game.id}`] });
    },
    onError: (error) => {
      console.error("Error starting judging phase:", error);
      toast({
        title: "Error",
        description: "Failed to start the judging phase",
        variant: "destructive",
      });
    }
  });
  
  const startJudgingPhase = () => {
    if (isJudge) {
      startJudgingPhaseMutation.mutate();
    }
  };
  
  const handleSubmitPoem = () => {
    if (!poem.trim()) {
      toast({
        title: "Empty poem",
        description: "Please write something before submitting",
        variant: "destructive",
      });
      return;
    }
    
    // Save poem first
    savePoemMutation.mutate(poem, {
      onSuccess: () => {
        // Then submit it
        submitPoemMutation.mutate();
      }
    });
  };
  
  // Check if all poems have been submitted
  const allPoemsSubmitted = currentRound?.poems.every(p => p.submitted);
  
  // If user is the judge
  if (isJudge) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Waiting for Poems</h1>
            <p className="text-gray-600">
              Players are crafting their poems. You'll review them once the time is up or all poems are submitted.
            </p>
          </div>
          
          {/* Challenge Words */}
          <div className="mb-8">
            <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-3">Challenge Words</h3>
            <div className="flex flex-wrap gap-2">
              {currentRound.words.map((word, index) => {
                const colorClasses = [
                  "bg-primary/10 text-primary",
                  "bg-secondary/10 text-secondary", 
                  "bg-accent/10 text-accent",
                  "bg-success/10 text-success",
                  "bg-warning/10 text-warning"
                ];
                const colorClass = colorClasses[index % colorClasses.length];
                
                return (
                  <span 
                    key={index} 
                    className={`word-chip ${colorClass} px-3 py-1 rounded-full text-sm font-medium`} 
                    style={{ "--delay": index } as React.CSSProperties}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-5">
            <h3 className="font-semibold text-gray-700 mb-3">Submission Status</h3>
            <div className="space-y-3">
              {game.players
                .filter(p => p.userId !== currentRound.judgeId)
                .map(player => {
                  const playerPoem = currentRound.poems.find(p => p.playerId === player.id);
                  const isSubmitted = playerPoem?.submitted;
                  
                  return (
                    <div key={player.id} className="flex justify-between items-center">
                      <span className="text-gray-700">{player.user.username}</span>
                      <span className={`px-2 py-1 rounded text-xs ${isSubmitted ? 'bg-success/20 text-success' : 'bg-gray-200 text-gray-500'}`}>
                        {isSubmitted ? 'Submitted' : 'Writing...'}
                      </span>
                    </div>
                  );
                })}
            </div>
            
            {timeRemaining !== null && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500 mb-2">Time remaining</p>
                <div className="text-xl font-bold text-primary">
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </div>
              </div>
            )}
            
            {allPoemsSubmitted && (
              <Button
                onClick={startJudgingPhase}
                className="w-full mt-4"
                disabled={startJudgingPhaseMutation.isPending}
              >
                {startJudgingPhaseMutation.isPending ? "Starting..." : "Start Judging Now"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // If the player has already submitted their poem
  if (myPoem?.submitted) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Poem Submitted</h1>
            <p className="text-gray-600">
              Your poem has been submitted. Waiting for other players or time to expire.
            </p>
          </div>
          
          {/* Challenge Words */}
          <div className="mb-8">
            <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-3">Challenge Words</h3>
            <div className="flex flex-wrap gap-2">
              {currentRound.words.map((word, index) => {
                const colorClasses = [
                  "bg-primary/10 text-primary",
                  "bg-secondary/10 text-secondary", 
                  "bg-accent/10 text-accent",
                  "bg-success/10 text-success",
                  "bg-warning/10 text-warning"
                ];
                const colorClass = colorClasses[index % colorClasses.length];
                
                return (
                  <span 
                    key={index} 
                    className={`word-chip ${colorClass} px-3 py-1 rounded-full text-sm font-medium`} 
                    style={{ "--delay": index } as React.CSSProperties}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-5">
            <h3 className="font-semibold text-gray-700 mb-3">Your Submitted Poem</h3>
            <div className="bg-white rounded border border-gray-200 p-4 font-serif italic">
              {myPoem.content.split('\n').map((line, i) => (
                <p key={i} className="mb-1">
                  {currentRound.words.reduce((acc, word, idx) => {
                    const regex = new RegExp(`\\b${word}\\b`, 'gi');
                    const colorClasses = [
                      "text-primary font-medium",
                      "text-secondary font-medium", 
                      "text-accent font-medium",
                      "text-success font-medium",
                      "text-warning font-medium"
                    ];
                    const colorClass = colorClasses[idx % colorClasses.length];
                    
                    return acc.replace(regex, `<span class="${colorClass}">${word}</span>`);
                  }, line)}
                </p>
              ))}
            </div>
            
            {timeRemaining !== null && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500 mb-2">Time remaining</p>
                <div className="text-xl font-bold text-primary">
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // If player is writing their poem
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Write Your Poem</h1>
          <p className="text-gray-600">
            Use all five words to create your poem. Be creative!
          </p>
        </div>
        
        {/* Challenge Words */}
        <div className="mb-6">
          <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-3">Challenge Words</h3>
          <div className="flex flex-wrap gap-2">
            {currentRound.words.map((word, index) => {
              const colorClasses = [
                "bg-primary/10 text-primary",
                "bg-secondary/10 text-secondary", 
                "bg-accent/10 text-accent",
                "bg-success/10 text-success",
                "bg-warning/10 text-warning"
              ];
              const colorClass = colorClasses[index % colorClasses.length];
              
              return (
                <span 
                  key={index} 
                  className={`word-chip ${colorClass} px-3 py-1 rounded-full text-sm font-medium`} 
                  style={{ "--delay": index } as React.CSSProperties}
                >
                  {word}
                </span>
              );
            })}
          </div>
        </div>
        
        {/* Poem Editor */}
        <div className="mb-4">
          <Textarea
            placeholder="Your poem here..."
            value={poem}
            onChange={(e) => setPoem(e.target.value)}
            rows={10}
            className="font-serif text-gray-800 resize-none"
          />
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            {savePoemMutation.isPending ? "Saving..." : "Auto-saving enabled"}
          </div>
          
          <Button
            onClick={handleSubmitPoem}
            disabled={submitPoemMutation.isPending || !poem.trim()}
          >
            {submitPoemMutation.isPending ? "Submitting..." : "Submit Poem"}
          </Button>
        </div>
        
        {timeRemaining !== null && <Timer seconds={timeRemaining} />}
      </CardContent>
    </Card>
  );
}
