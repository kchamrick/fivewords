import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { GameWithPlayers, User } from "@shared/schema";
import { Trophy, ArrowRight } from "lucide-react";

interface ResultsPhaseProps {
  game: GameWithPlayers;
  currentUser: User;
  isLastRound: boolean;
  onNextRound: () => void;
  isLoading: boolean;
}

export default function ResultsPhase({ game, currentUser, isLastRound, onNextRound, isLoading }: ResultsPhaseProps) {
  const { toast } = useToast();
  
  const currentRound = game.currentRound;
  const isJudge = currentRound?.judgeId === currentUser.id;
  
  if (!currentRound || currentRound.status !== "completed") {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-700">Invalid Phase</h2>
            <p className="text-gray-500 mt-2">
              The round is not currently in the results phase.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!currentRound.winnerId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-700">No Winner Selected</h2>
            <p className="text-gray-500 mt-2">
              No winner was selected for this round.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const winningPlayer = game.players.find(p => p.id === currentRound.winnerId);
  const winningPoem = currentRound.poems.find(p => p.playerId === currentRound.winnerId);
  
  if (!winningPlayer || !winningPoem) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-700">Winner Information Missing</h2>
            <p className="text-gray-500 mt-2">
              Could not find information about the winning player or poem.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const isWinner = winningPlayer.userId === currentUser.id;
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center mb-6">
          <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {isWinner ? "Your Poem Won!" : `${winningPlayer.user.username}'s Poem Won!`}
          </h1>
          <p className="text-gray-600">
            {isWinner 
              ? "Congratulations! The judge selected your poem as the winner."
              : `${game.players.find(p => p.userId === currentRound.judgeId)?.user.username} selected this poem as the winner.`}
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
        
        {/* Winning Poem */}
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-5 mb-6 border border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-gray-800">Winning Poem by {winningPlayer.user.username}</h3>
          </div>
          
          <div className="bg-white rounded border border-gray-200 p-4 font-serif italic">
            {winningPoem.content.split('\n').map((line, i) => (
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
        
        {/* Current Standings */}
        <div className="bg-gray-50 rounded-lg p-5 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Current Standings</h3>
          <div className="space-y-2">
            {game.players
              .sort((a, b) => b.score - a.score)
              .map(player => (
                <div key={player.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      player.userId === currentUser.id ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {player.user.username.substring(0, 1).toUpperCase()}
                    </div>
                    <span className={`${player.userId === currentUser.id ? 'font-medium' : ''}`}>
                      {player.user.username}
                      {player.userId === currentUser.id && " (You)"}
                    </span>
                  </div>
                  <div className="bg-gray-200 px-2 py-1 rounded-full text-xs font-medium">
                    {player.score} {player.score === 1 ? 'point' : 'points'}
                  </div>
                </div>
              ))}
          </div>
        </div>
        
        {/* Next Round / Game Over */}
        <div className="flex justify-center">
          {isLastRound ? (
            <div className="text-center">
              <h3 className="font-bold text-gray-800 mb-2">Game Completed!</h3>
              <p className="text-gray-600 mb-4">
                {game.players.reduce((prev, current) => (prev.score > current.score) ? prev : current).user.username} wins with {game.players.reduce((prev, current) => (prev.score > current.score) ? prev : current).score} points!
              </p>
              <Button onClick={() => window.location.href = "/"}>
                Return to Home
              </Button>
            </div>
          ) : (
            <Button 
              onClick={onNextRound}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? "Starting..." : "Next Round"}
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
