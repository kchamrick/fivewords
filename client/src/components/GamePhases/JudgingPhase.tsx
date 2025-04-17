import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { GameWithPlayers, User, Poem } from "@shared/schema";

interface JudgingPhaseProps {
  game: GameWithPlayers;
  currentUser: User;
  refetchGame: () => void;
}

export default function JudgingPhase({ game, currentUser, refetchGame }: JudgingPhaseProps) {
  const { toast } = useToast();
  const [selectedPoemId, setSelectedPoemId] = useState<number | null>(null);
  
  const currentRound = game.currentRound;
  const isJudge = currentRound?.judgeId === currentUser.id;
  
  // Select winner mutation (judge only)
  const selectWinnerMutation = useMutation({
    mutationFn: async (poemId: number) => {
      if (!currentRound) return null;
      
      const response = await apiRequest("POST", `/api/rounds/${currentRound.id}/winner`, {
        poemId
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Winner selected",
        description: "The winner has been announced!"
      });
      queryClient.invalidateQueries({ queryKey: [`/api/games/${game.id}`] });
      refetchGame();
    },
    onError: (error) => {
      console.error("Error selecting winner:", error);
      toast({
        title: "Error",
        description: "Failed to select the winner",
        variant: "destructive",
      });
    }
  });
  
  const handleSelectWinner = (poemId: number) => {
    console.log("Selecting winner for poem ID:", poemId);
    setSelectedPoemId(poemId);
    selectWinnerMutation.mutate(poemId);
  };
  
  // If the round is not in the judging phase
  if (!currentRound || currentRound.status !== "judging") {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-700">Invalid Phase</h2>
            <p className="text-gray-500 mt-2">
              The round is not currently in the judging phase.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // No poems to judge
  if (currentRound.poems.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-700">No Poems Submitted</h2>
            <p className="text-gray-500 mt-2">
              There are no poems to judge for this round.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Filter only submitted poems
  const submittedPoems = currentRound.poems.filter(poem => poem.submitted);
  
  // If the current user is the judge
  if (isJudge) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Select the Best Poem</h1>
            <p className="text-gray-600">Read all poems and pick your favorite. The winning poet gets a point!</p>
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
          
          {/* Poem Submissions */}
          <div className="space-y-6">
            {submittedPoems.map((poem, index) => (
              <div key={poem.id} className="bg-gray-50 rounded-lg p-5 transition-all hover:shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-gray-700">Poem #{index + 1}</h3>
                  <Button
                    onClick={() => handleSelectWinner(poem.id)}
                    disabled={selectWinnerMutation.isPending}
                    className="text-white bg-primary hover:bg-primary/90 px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                  >
                    {selectedPoemId === poem.id && selectWinnerMutation.isPending 
                      ? "Selecting..." 
                      : "Select Winner"}
                  </Button>
                </div>
                <div className="poem-text text-gray-800 italic leading-relaxed">
                  {poem.content.split('\n').map((line, i) => (
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
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // If the current user is a player waiting for the judge's decision
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Judging in Progress</h1>
          <p className="text-gray-600">
            {game.players.find(p => p.userId === currentRound.judgeId)?.user.username} is reading the poems and will select a winner shortly.
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
        
        {/* User's submitted poem */}
        <div className="bg-gray-50 rounded-lg p-5">
          <h3 className="font-semibold text-gray-700 mb-3">Your Submitted Poem</h3>
          
          {currentRound.poems.some(p => p.playerId === game.players.find(p => p.userId === currentUser.id)?.id) ? (
            <div className="bg-white rounded border border-gray-200 p-4 font-serif italic">
              {currentRound.poems
                .find(p => p.playerId === game.players.find(p => p.userId === currentUser.id)?.id)
                ?.content
                .split('\n')
                .map((line, i) => (
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
          ) : (
            <p className="text-gray-500 italic">You didn't submit a poem for this round.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
