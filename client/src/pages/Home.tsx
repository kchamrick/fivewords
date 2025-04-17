import { Link } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { type User } from "@shared/schema";
import Navigation from "@/components/Navigation";

export default function Home() {
  const { toast } = useToast();
  const [username, setUsername] = useState<string>("");
  const [userId, setUserId] = useState<number | null>(null);

  // Get user from sessionStorage if available
  useEffect(() => {
    const storedUser = sessionStorage.getItem("currentUser");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUsername(parsedUser.username);
        setUserId(parsedUser.id);
      } catch (error) {
        console.error("Failed to parse stored user", error);
      }
    }
  }, []);

  // Fetch existing games (in a real app, would filter by active or recently created)
  const { data: users, isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !userId,
  });

  const handleQuickJoin = (selectedUser: User) => {
    // Save user to session for persistence across app
    sessionStorage.setItem("currentUser", JSON.stringify(selectedUser));
    setUsername(selectedUser.username);
    setUserId(selectedUser.id);
    
    toast({
      title: "Logged in as " + selectedUser.username,
      description: "You can now create or join games",
    });
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
          
          {userId && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden md:inline">{username}</span>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                {username?.charAt(0).toUpperCase()}{username?.charAt(1).toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col pt-6 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          {/* Welcome & User Selection */}
          {!userId ? (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-xl">Welcome to Five Words!</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-gray-600">
                  Five Words is a collaborative poetry game where players create poems using five random words.
                  Select a user to get started:
                </p>
                
                {loadingUsers ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 animate-pulse">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-12 bg-gray-200 rounded-md"></div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {users?.map((user) => (
                      <Button 
                        key={user.id} 
                        variant="outline" 
                        onClick={() => handleQuickJoin(user)}
                        className="justify-start"
                      >
                        <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs mr-2">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        {user.username}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Poetry Games</h1>
                <Link href="/create-game">
                  <Button className="bg-primary hover:bg-primary/90">Create New Game</Button>
                </Link>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">How to Play</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg bg-gray-50 p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">Game Rules</h3>
                    <ol className="list-decimal list-inside space-y-2 text-gray-600">
                      <li>A round leader selects five random words for the challenge</li>
                      <li>All players (except the round leader) must write a poem using these words</li>
                      <li>After the time limit, poems are submitted anonymously</li>
                      <li>The round leader selects their favorite poem</li>
                      <li>The winning poet gets a point</li>
                      <li>A new round begins with the next player as the round leader</li>
                    </ol>
                  </div>
                  
                  <div className="flex justify-center">
                    <Link href="/create-game">
                      <Button size="lg" className="bg-primary hover:bg-primary/90">
                        Start a New Game
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>

      {/* Navigation */}
      {userId && <Navigation />}
    </div>
  );
}
