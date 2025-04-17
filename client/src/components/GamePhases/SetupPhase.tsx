import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { GameWithPlayers, User } from "@shared/schema";
import { Pen, Timer } from "lucide-react";

interface SetupPhaseProps {
  game: GameWithPlayers;
  currentUser: User;
  refetchGame: () => void;
}

export default function SetupPhase({ game, currentUser, refetchGame }: SetupPhaseProps) {
  const { toast } = useToast();
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const currentRound = game.currentRound;
  const isJudge = currentRound?.judgeId === currentUser.id;
  
  const startWritingPhaseMutation = useMutation({
    mutationFn: async () => {
      if (!currentRound) return null;
      
      const response = await apiRequest("PUT", `/api/rounds/${currentRound.id}/status`, {
        status: "writing"
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Writing phase started",
        description: "Players can now begin writing their poems"
      });
      queryClient.invalidateQueries({ queryKey: [`/api/games/${game.id}`] });
      refetchGame();
    },
    onError: (error) => {
      console.error("Error starting writing phase:", error);
      toast({
        title: "Error",
        description: "Failed to start the writing phase",
        variant: "destructive",
      });
      setIsTransitioning(false);
    }
  });
  
  const handleStartWriting = () => {
    setIsTransitioning(true);
    startWritingPhaseMutation.mutate();
  };
  
  if (!currentRound) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-700">Round not found</h2>
            <p className="text-gray-500 mt-2">There was an error loading the current round</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {isJudge ? "You're the Judge" : "Waiting for the Judge"}
          </h1>
          <p className="text-gray-600">
            {isJudge 
              ? "You'll choose the winner after everyone submits their poems" 
              : `${game.players.find(p => p.userId === currentRound.judgeId)?.user.username} is the judge this round`}
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
        
        {/* Instructions and Action Button */}
        <div className="bg-gray-50 rounded-lg p-5 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <Pen className="mr-2 h-5 w-5 text-primary" />
            How to Play
          </h3>
          <ul className="text-gray-600 space-y-2 pl-7 list-disc">
            <li>Each player must create a poem using all five challenge words</li>
            <li>The judge doesn't write a poem but selects the winner</li>
            <li>Be creative! You can use any poetic style or format</li>
            <li>Submissions are anonymous to the judge</li>
            <li>The winning poet earns a point</li>
          </ul>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-5">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <Timer className="mr-2 h-5 w-5 text-primary" />
            Time Limit
          </h3>
          <p className="text-gray-600 mb-4">
            Players will have {Math.floor(currentRound.timeLimit / 60)} minutes to complete their poems once the writing phase begins.
          </p>
          
          {isJudge && (
            <Button 
              onClick={handleStartWriting} 
              disabled={isTransitioning || startWritingPhaseMutation.isPending}
              className="w-full"
            >
              {isTransitioning ? "Starting..." : "Start Writing Phase"}
            </Button>
          )}
          
          {!isJudge && (
            <div className="text-center text-gray-500 italic">
              Waiting for the judge to start the writing phase...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
