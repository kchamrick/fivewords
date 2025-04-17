import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type User } from "@shared/schema";
import Navigation from "@/components/Navigation";

const formSchema = z.object({
  name: z.string().min(3, "Game name must be at least 3 characters"),
  totalRounds: z.string().transform((val) => parseInt(val, 10)),
  playerIds: z.array(z.number()).min(2, "Select at least 2 players").max(5, "Maximum 5 players allowed"),
});

export default function CreateGame() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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

  // Fetch all users for player selection
  const { data: users = [], isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!currentUser,
  });

  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      totalRounds: "5",
      playerIds: currentUser ? [currentUser.id] : [],
    },
  });

  // Update form when currentUser changes
  useEffect(() => {
    if (currentUser) {
      form.setValue("playerIds", [currentUser.id]);
    }
  }, [currentUser, form]);

  // Handle form submission
  const createGameMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await apiRequest("POST", "/api/games", values);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Game created!",
        description: "Your new game has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      navigate(`/games/${data.id}`);
    },
    onError: (error) => {
      console.error("Failed to create game:", error);
      toast({
        title: "Failed to create game",
        description: "There was an error creating your game. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createGameMutation.mutate(values);
  }

  const availablePlayers = users.filter((user) => user.id !== currentUser?.id);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-primary text-2xl font-bold">five</span>
            <span className="text-secondary text-2xl font-bold">words</span>
          </div>
          
          {currentUser && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden md:inline">{currentUser.username}</span>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                {currentUser.username.substring(0, 2).toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col pt-6 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate("/")}
          >
            ← Back to Home
          </Button>

          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-xl">Create New Game</CardTitle>
              <CardDescription>
                Start a new poetry game with friends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Game Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Poetry Night" {...field} />
                        </FormControl>
                        <FormDescription>
                          Give your game a creative name
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalRounds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Rounds</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select number of rounds" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="3">3 Rounds</SelectItem>
                            <SelectItem value="5">5 Rounds</SelectItem>
                            <SelectItem value="7">7 Rounds</SelectItem>
                            <SelectItem value="10">10 Rounds</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          How many rounds of poetry to play
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="playerIds"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel className="text-base">Players</FormLabel>
                          <FormDescription>
                            Select players to invite (2-5 players including you)
                          </FormDescription>
                        </div>
                        {loadingUsers ? (
                          <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className="flex items-center space-x-2 animate-pulse"
                              >
                                <div className="h-5 w-5 rounded-sm bg-gray-200"></div>
                                <div className="h-5 w-32 bg-gray-200 rounded"></div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Current user is always included */}
                            {currentUser && (
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={true}
                                  disabled
                                  id={`user-${currentUser.id}`}
                                />
                                <label
                                  htmlFor={`user-${currentUser.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
                                >
                                  {currentUser.username} (You - Game Host)
                                </label>
                              </div>
                            )}

                            {availablePlayers.map((user) => (
                              <FormField
                                key={user.id}
                                control={form.control}
                                name="playerIds"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={user.id}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(user.id)}
                                          onCheckedChange={(checked) => {
                                            const currentIds = [...field.value];
                                            if (checked) {
                                              field.onChange([...currentIds, user.id]);
                                            } else {
                                              field.onChange(
                                                currentIds.filter((id) => id !== user.id)
                                              );
                                            }
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal">
                                        {user.username}
                                      </FormLabel>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <CardFooter className="px-0 pt-6">
                    <Button
                      type="submit"
                      disabled={createGameMutation.isPending}
                      className="w-full"
                    >
                      {createGameMutation.isPending
                        ? "Creating Game..."
                        : "Create Game"}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Navigation */}
      <Navigation />
    </div>
  );
}
