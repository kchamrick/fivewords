import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type User } from "@shared/schema";

interface PlayerListProps {
  players: {
    id: number;
    userId: number;
    score: number;
    isHost: boolean;
    user: User;
  }[];
  currentUserId: number;
  currentJudgeId?: number;
}

export default function PlayerList({ players, currentUserId, currentJudgeId }: PlayerListProps) {
  // Sort players by score (highest first)
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">Players</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedPlayers.map(player => {
            const isCurrentUser = player.user.id === currentUserId;
            const isJudge = player.user.id === currentJudgeId;
            
            // Determine avatar color
            const avatarColorClasses = [
              "bg-primary", // 1st player
              "bg-secondary", // 2nd player
              "bg-accent", // 3rd player
              "bg-success", // 4th player
              "bg-warning", // 5th player
            ];
            const index = players.findIndex(p => p.id === player.id);
            const avatarColor = avatarColorClasses[index % avatarColorClasses.length];
            
            return (
              <div key={player.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                <div className="relative">
                  <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white`}>
                    {player.user.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${player.score > 0 ? "bg-success text-white" : "bg-gray-200 text-gray-600"} text-xs rounded-full flex items-center justify-center`}>
                    {player.score}
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    {player.user.username}
                    {isCurrentUser && " (You)"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isJudge && "Current Judge"}
                    {player.isHost && !isJudge && "Host"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
