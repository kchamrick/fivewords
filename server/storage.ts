import { 
  users, type User, type InsertUser,
  games, type Game, type InsertGame,
  players, type Player, type InsertPlayer,
  rounds, type Round, type InsertRound,
  poems, type Poem, type InsertPoem,
  type GameWithPlayers, type RoundWithPoems, type PoemWithAuthor
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Game operations
  createGame(game: InsertGame): Promise<Game>;
  getGame(id: number): Promise<Game | undefined>;
  getGameWithPlayers(id: number): Promise<GameWithPlayers | undefined>;
  updateGame(id: number, updates: Partial<Game>): Promise<Game | undefined>;
  
  // Player operations
  addPlayerToGame(player: InsertPlayer): Promise<Player>;
  getPlayersByGame(gameId: number): Promise<Player[]>;
  getPlayerScore(playerId: number): Promise<number>;
  updatePlayerScore(playerId: number, scoreIncrement: number): Promise<number>;
  
  // Round operations
  createRound(round: InsertRound): Promise<Round>;
  getRound(id: number): Promise<Round | undefined>;
  getRoundWithPoems(id: number): Promise<RoundWithPoems | undefined>;
  getCurrentRound(gameId: number): Promise<Round | undefined>;
  updateRoundStatus(id: number, status: string): Promise<Round | undefined>;
  setRoundWinner(id: number, winnerId: number): Promise<Round | undefined>;
  updateRoundEndTime(id: number, endTime: Date): Promise<Round | undefined>;
  
  // Poem operations
  createPoem(poem: InsertPoem): Promise<Poem>;
  updatePoem(id: number, content: string): Promise<Poem | undefined>;
  submitPoem(id: number): Promise<Poem | undefined>;
  getPoemsByRound(roundId: number): Promise<Poem[]>;
  getPoem(id: number): Promise<Poem | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private games: Map<number, Game>;
  private players: Map<number, Player>;
  private rounds: Map<number, Round>;
  private poems: Map<number, Poem>;
  
  private userIdCounter: number;
  private gameIdCounter: number;
  private playerIdCounter: number;
  private roundIdCounter: number;
  private poemIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.players = new Map();
    this.rounds = new Map();
    this.poems = new Map();
    
    this.userIdCounter = 1;
    this.gameIdCounter = 1;
    this.playerIdCounter = 1;
    this.roundIdCounter = 1;
    this.poemIdCounter = 1;
    
    // Add some test users for development convenience
    this.createUser({ username: "John", password: "password" });
    this.createUser({ username: "Emma", password: "password" });
    this.createUser({ username: "Robert", password: "password" });
    this.createUser({ username: "Sarah", password: "password" });
    this.createUser({ username: "Michael", password: "password" });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Game operations
  async createGame(insertGame: InsertGame): Promise<Game> {
    const id = this.gameIdCounter++;
    const now = new Date();
    const game: Game = { 
      ...insertGame, 
      id,
      createdAt: now,
      currentRound: 1,
      currentJudgeIndex: 0,
      status: "waiting",
    };
    this.games.set(id, game);
    return game;
  }
  
  async getGame(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }
  
  async getGameWithPlayers(id: number): Promise<GameWithPlayers | undefined> {
    const game = this.games.get(id);
    if (!game) return undefined;
    
    const playersList = Array.from(this.players.values())
      .filter(player => player.gameId === id);
      
    const playersWithUsers = await Promise.all(
      playersList.map(async (player) => {
        const user = await this.getUser(player.userId);
        return { ...player, user: user! };
      })
    );
    
    const currentRound = await this.getCurrentRound(id);
    let roundWithPoems: RoundWithPoems | undefined;
    
    if (currentRound) {
      const poems = await this.getPoemsByRound(currentRound.id);
      const judge = await this.getUser(currentRound.judgeId);
      if (judge) {
        roundWithPoems = {
          ...currentRound,
          poems,
          judge,
        };
      }
    }
    
    return {
      ...game,
      players: playersWithUsers,
      currentRound: roundWithPoems
    };
  }
  
  async updateGame(id: number, updates: Partial<Game>): Promise<Game | undefined> {
    const game = this.games.get(id);
    if (!game) return undefined;
    
    const updatedGame = { ...game, ...updates };
    this.games.set(id, updatedGame);
    return updatedGame;
  }
  
  // Player operations
  async addPlayerToGame(insertPlayer: InsertPlayer): Promise<Player> {
    const id = this.playerIdCounter++;
    const player: Player = {
      ...insertPlayer,
      id,
      score: 0,
      isHost: insertPlayer.isHost || false,
    };
    this.players.set(id, player);
    return player;
  }
  
  async getPlayersByGame(gameId: number): Promise<Player[]> {
    return Array.from(this.players.values())
      .filter(player => player.gameId === gameId);
  }
  
  async getPlayerScore(playerId: number): Promise<number> {
    const player = this.players.get(playerId);
    return player ? player.score : 0;
  }
  
  async updatePlayerScore(playerId: number, scoreIncrement: number): Promise<number> {
    const player = this.players.get(playerId);
    if (!player) return 0;
    
    const updatedPlayer = { 
      ...player, 
      score: player.score + scoreIncrement 
    };
    this.players.set(playerId, updatedPlayer);
    return updatedPlayer.score;
  }
  
  // Round operations
  async createRound(insertRound: InsertRound): Promise<Round> {
    const id = this.roundIdCounter++;
    const round: Round = {
      ...insertRound,
      id,
      status: "setup",
      winnerId: null,
      endTime: null,
    };
    this.rounds.set(id, round);
    return round;
  }
  
  async getRound(id: number): Promise<Round | undefined> {
    return this.rounds.get(id);
  }
  
  async getRoundWithPoems(id: number): Promise<RoundWithPoems | undefined> {
    const round = this.rounds.get(id);
    if (!round) return undefined;
    
    const poems = await this.getPoemsByRound(id);
    const judge = await this.getUser(round.judgeId);
    
    if (!judge) return undefined;
    
    return {
      ...round,
      poems,
      judge,
    };
  }
  
  async getCurrentRound(gameId: number): Promise<Round | undefined> {
    const game = this.games.get(gameId);
    if (!game) return undefined;
    
    return Array.from(this.rounds.values())
      .find(round => round.gameId === gameId && round.roundNumber === game.currentRound);
  }
  
  async updateRoundStatus(id: number, status: string): Promise<Round | undefined> {
    const round = this.rounds.get(id);
    if (!round) return undefined;
    
    const updatedRound = { ...round, status };
    this.rounds.set(id, updatedRound);
    return updatedRound;
  }
  
  async setRoundWinner(id: number, winnerId: number): Promise<Round | undefined> {
    const round = this.rounds.get(id);
    if (!round) return undefined;
    
    const updatedRound = { ...round, winnerId, status: "completed" };
    this.rounds.set(id, updatedRound);
    return updatedRound;
  }
  
  async updateRoundEndTime(id: number, endTime: Date): Promise<Round | undefined> {
    const round = this.rounds.get(id);
    if (!round) return undefined;
    
    const updatedRound = { ...round, endTime };
    this.rounds.set(id, updatedRound);
    return updatedRound;
  }
  
  // Poem operations
  async createPoem(insertPoem: InsertPoem): Promise<Poem> {
    const id = this.poemIdCounter++;
    const poem: Poem = {
      ...insertPoem,
      id,
      submitted: false,
      submittedAt: null,
    };
    this.poems.set(id, poem);
    return poem;
  }
  
  async updatePoem(id: number, content: string): Promise<Poem | undefined> {
    const poem = this.poems.get(id);
    if (!poem) return undefined;
    
    const updatedPoem = { ...poem, content };
    this.poems.set(id, updatedPoem);
    return updatedPoem;
  }
  
  async submitPoem(id: number): Promise<Poem | undefined> {
    const poem = this.poems.get(id);
    if (!poem) return undefined;
    
    const now = new Date();
    const updatedPoem = { 
      ...poem, 
      submitted: true,
      submittedAt: now,
    };
    this.poems.set(id, updatedPoem);
    return updatedPoem;
  }
  
  async getPoemsByRound(roundId: number): Promise<Poem[]> {
    return Array.from(this.poems.values())
      .filter(poem => poem.roundId === roundId);
  }
  
  async getPoem(id: number): Promise<Poem | undefined> {
    return this.poems.get(id);
  }
}

import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const [game] = await db
      .insert(games)
      .values(insertGame)
      .returning();
    return game;
  }

  async getGame(id: number): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game || undefined;
  }

  async getGameWithPlayers(id: number): Promise<GameWithPlayers | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    if (!game) return undefined;

    // Get players
    const playersData = await db.select()
      .from(players)
      .where(eq(players.gameId, id));

    // Get users for each player
    const playersWithUsers = await Promise.all(
      playersData.map(async (player) => {
        const [user] = await db.select().from(users).where(eq(users.id, player.userId));
        return { ...player, user };
      })
    );

    // Get current round with poems
    const currentRound = await this.getCurrentRound(id);
    let roundWithPoems: RoundWithPoems | undefined;
    
    if (currentRound) {
      roundWithPoems = await this.getRoundWithPoems(currentRound.id);
    }

    return {
      ...game,
      players: playersWithUsers,
      currentRound: roundWithPoems
    };
  }

  async updateGame(id: number, updates: Partial<Game>): Promise<Game | undefined> {
    const [updatedGame] = await db
      .update(games)
      .set(updates)
      .where(eq(games.id, id))
      .returning();
    return updatedGame;
  }

  async addPlayerToGame(insertPlayer: InsertPlayer): Promise<Player> {
    const [player] = await db
      .insert(players)
      .values(insertPlayer)
      .returning();
    return player;
  }

  async getPlayersByGame(gameId: number): Promise<Player[]> {
    return await db.select().from(players).where(eq(players.gameId, gameId));
  }

  async getPlayerScore(playerId: number): Promise<number> {
    const [player] = await db.select({ score: players.score })
      .from(players)
      .where(eq(players.id, playerId));
    return player?.score || 0;
  }

  async updatePlayerScore(playerId: number, scoreIncrement: number): Promise<number> {
    const [player] = await db.select({ score: players.score })
      .from(players)
      .where(eq(players.id, playerId));
    
    const currentScore = player?.score || 0;
    const newScore = currentScore + scoreIncrement;
    
    await db.update(players)
      .set({ score: newScore })
      .where(eq(players.id, playerId));
    
    return newScore;
  }

  async createRound(insertRound: InsertRound): Promise<Round> {
    const [round] = await db
      .insert(rounds)
      .values(insertRound)
      .returning();
    return round;
  }

  async getRound(id: number): Promise<Round | undefined> {
    const [round] = await db.select().from(rounds).where(eq(rounds.id, id));
    return round || undefined;
  }

  async getRoundWithPoems(id: number): Promise<RoundWithPoems | undefined> {
    const [round] = await db.select().from(rounds).where(eq(rounds.id, id));
    if (!round) return undefined;

    const [judge] = await db.select().from(users)
      .where(eq(users.id, round.judgeId));
    
    if (!judge) return undefined;

    const poemsData = await db.select().from(poems).where(eq(poems.roundId, id));

    return {
      ...round,
      poems: poemsData,
      judge
    };
  }

  async getCurrentRound(gameId: number): Promise<Round | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, gameId));
    if (!game) return undefined;

    const [round] = await db.select().from(rounds)
      .where(and(
        eq(rounds.gameId, gameId),
        eq(rounds.roundNumber, game.currentRound)
      ));
    
    return round || undefined;
  }

  async updateRoundStatus(id: number, status: string): Promise<Round | undefined> {
    const [updatedRound] = await db
      .update(rounds)
      .set({ status })
      .where(eq(rounds.id, id))
      .returning();
    return updatedRound;
  }

  async setRoundWinner(id: number, winnerId: number): Promise<Round | undefined> {
    const [updatedRound] = await db
      .update(rounds)
      .set({ winnerId, status: "completed" })
      .where(eq(rounds.id, id))
      .returning();
    return updatedRound;
  }

  async updateRoundEndTime(id: number, endTime: Date): Promise<Round | undefined> {
    const [updatedRound] = await db
      .update(rounds)
      .set({ endTime })
      .where(eq(rounds.id, id))
      .returning();
    return updatedRound;
  }

  async createPoem(insertPoem: InsertPoem): Promise<Poem> {
    const [poem] = await db
      .insert(poems)
      .values(insertPoem)
      .returning();
    return poem;
  }

  async updatePoem(id: number, content: string): Promise<Poem | undefined> {
    const [updatedPoem] = await db
      .update(poems)
      .set({ content })
      .where(eq(poems.id, id))
      .returning();
    return updatedPoem;
  }

  async submitPoem(id: number): Promise<Poem | undefined> {
    const now = new Date();
    const [updatedPoem] = await db
      .update(poems)
      .set({ 
        submitted: true,
        submittedAt: now
      })
      .where(eq(poems.id, id))
      .returning();
    return updatedPoem;
  }

  async getPoemsByRound(roundId: number): Promise<Poem[]> {
    return await db.select().from(poems).where(eq(poems.roundId, roundId));
  }

  async getPoem(id: number): Promise<Poem | undefined> {
    const [poem] = await db.select().from(poems).where(eq(poems.id, id));
    return poem || undefined;
  }
}

export const storage = new DatabaseStorage();
