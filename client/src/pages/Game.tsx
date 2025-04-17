import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { GameWithPlayers, User } from "@shared/schema";
import Navigation from "@/components/Navigation";
import GameProgress from "@/components/GameProgress";
import PlayerList from "@/components/PlayerList";
import SetupPhase from "@/components/GamePhases/SetupPhase";
import WritingPhase from "@/components/GamePhases/WritingPhase";
import JudgingPhase from "@/components/GamePhases/JudgingPhase";
import ResultsPhase from "@/components/GamePhases/ResultsPhase";

export default function Game() {
  const [, params] = useRoute("/games/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const gameId = params?.id ? parseInt(params.id) : null;

  // Get current user from session storage
  useEffect(() => {
    const userJson = sessionStorage.getItem("currentUser");
    if (!userJson) {
      toast({
        title: "Not logged in",
        description: "Please select a user first",
        variant: "destructive",
      });
      navigate("/");
      return;
    }
    
    try {
      const user = JSON.parse(userJson);
      setCurrentUser(user);
    } catch (error) {
      console.error("Failed to parse user", error);
      navigate("/");
    }
  }, [navigate, toast]);

  // Fetch game data
  const { data: game, isLoading, error, refetch } = useQuery<GameWithPlayers>({
    queryKey: [`/api/games/${gameId}`],
    enabled: !!gameId && !!currentUser,
    refetchInterval: 5000, // Poll for updates every 5 seconds
  });

  // Next round mutation
  const nextRoundMutation = useMutation({
    mutationFn: async () => {
      if (!gameId) return null;
      const response = await apiRequest("POST", `/api/games/${gameId}/next-round`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Next round started",
        description: "The next round has begun!"
      });
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
    },
    onError: (error) => {
      console.error("Error starting next round:", error);
      toast({
        title: "Error",
        description: "Failed to start the next round",
        variant: "destructive",
      });
    }
  });

  // Handle game loading states
  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading game...</p>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Game Not Found</h1>
          <p className="text-gray-600 mb-6">
            The game you're looking for doesn't exist or you don't have access to it.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }
  
  // Check if the user is part of this game
  const isPlayerInGame = game.players.some(player => player.user.id === currentUser.id);
  if (!isPlayerInGame) {
    toast({
      title: "Access Denied",
      description: "You are not a player in this game",
      variant: "destructive",
    });
    navigate("/");
    return null;
  }

  const currentRound = game.currentRound;
  const isJudge = currentRound?.judgeId === currentUser.id;
  
  // Determine which phase to show
  const renderGamePhase = () => {
    if (!currentRound) return <div>No active round</div>;
    
    switch (currentRound.status) {
      case "setup":
        return <SetupPhase game={game} currentUser={currentUser} refetchGame={refetch} />;
      case "writing":
        return <WritingPhase game={game} currentUser={currentUser} refetchGame={refetch} />;
      case "judging":
        return <JudgingPhase game={game} currentUser={currentUser} refetchGame={refetch} />;
      case "completed":
        const isLastRound = game.currentRound === game.totalRounds;
        return (
          <ResultsPhase 
            game={game} 
            currentUser={currentUser} 
            isLastRound={isLastRound}
            onNextRound={() => nextRoundMutation.mutate()}
            isLoading={nextRoundMutation.isPending}
          />
        );
      default:
        return <div>Unknown game state</div>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-primary text-2xl font-bold">five</span>
            <span className="text-secondary text-2xl font-bold">words</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 hidden md:inline">{currentUser.username}</span>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
              {currentUser.username.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col pt-6 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          
          {/* Game Progress Tracking */}
          <GameProgress 
            currentRound={game.currentRound} 
            totalRounds={game.totalRounds} 
            gameName={game.name}
          />
          
          {/* Game Phase Content */}
          {renderGamePhase()}
          
          {/* Player List */}
          <div className="mt-8">
            <PlayerList 
              players={game.players} 
              currentUserId={currentUser.id} 
              currentJudgeId={currentRound?.judgeId}
            />
          </div>
        </div>
      </main>

      {/* Navigation */}
      <Navigation />
    </div>
  );
}
