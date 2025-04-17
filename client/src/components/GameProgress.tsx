import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckIcon, TimerIcon, PenIcon, TrophyIcon } from "lucide-react";
import { Round } from "@shared/schema";

type GameStage = "setup" | "writing" | "judging" | "completed";

interface GameProgressProps {
  currentRound?: Round;
  totalRounds: number;
  gameName: string;
}

export default function GameProgress({ currentRound, totalRounds, gameName }: GameProgressProps) {
  if (!currentRound) return null;
  
  const currentRoundNumber = currentRound.roundNumber;
  const currentStage = currentRound.status as GameStage;
  
  const stages: { id: GameStage; label: string; icon: JSX.Element }[] = [
    {
      id: "setup",
      label: "Setup",
      icon: <PenIcon className="h-4 w-4" />,
    },
    {
      id: "writing",
      label: "Writing",
      icon: <TimerIcon className="h-4 w-4" />,
    },
    {
      id: "judging",
      label: "Judging",
      icon: <CheckIcon className="h-4 w-4" />,
    },
    {
      id: "completed",
      label: "Results",
      icon: <TrophyIcon className="h-4 w-4" />,
    },
  ];
  
  // Find the current stage index
  const currentStageIndex = stages.findIndex(stage => stage.id === currentStage);
  
  return (
    <Card className="bg-white rounded-xl shadow-sm mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">{gameName}</h2>
          <span className="text-sm text-gray-500">Round {currentRoundNumber}/{totalRounds}</span>
        </div>
        
        <div className="mt-4 relative">
          <div className="overflow-x-auto pb-2">
            <div className="flex space-x-2">
              {stages.map((stage, index) => {
                // Determine the stage status
                const isCompleted = index < currentStageIndex;
                const isCurrent = index === currentStageIndex;
                const isPending = index > currentStageIndex;
                
                // Determine the styling
                const bgColor = isCompleted || isCurrent 
                  ? "bg-primary" 
                  : "bg-gray-200";
                  
                const textColor = isCompleted || isCurrent 
                  ? "text-white" 
                  : "text-gray-400";
                  
                const labelColor = isCurrent 
                  ? "text-primary font-medium" 
                  : isCompleted 
                    ? "text-gray-600" 
                    : "text-gray-400";
                    
                // Add animation if it's the current stage
                const animation = isCurrent ? "animate-pulse-slow" : "";
                
                return (
                  <React.Fragment key={stage.id}>
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full ${bgColor} ${textColor} flex items-center justify-center text-sm ${animation}`}>
                        {stage.icon}
                      </div>
                      <div className={`text-xs ${labelColor} mt-1 whitespace-nowrap`}>{stage.label}</div>
                    </div>
                    
                    {/* Connector - don't add after the last item */}
                    {index < stages.length - 1 && (
                      <div 
                        className={`flex-shrink-0 w-8 h-1 self-center ${
                          index < currentStageIndex ? "bg-primary" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
