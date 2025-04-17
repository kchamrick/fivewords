// Common words suitable for poetry challenges
const poeticWords = [
  // Nature
  "ocean", "mountain", "forest", "river", "sky", 
  "moon", "star", "sun", "cloud", "rain",
  "flower", "tree", "leaf", "thunder", "wind",
  "dawn", "dusk", "twilight", "sunrise", "sunset",
  
  // Time
  "morning", "evening", "night", "day", "moment",
  "eternity", "forever", "instant", "season", "autumn",
  "winter", "spring", "summer", "time", "hour",
  "midnight", "memory", "yesterday", "tomorrow", "today",
  
  // Emotions
  "love", "hope", "dream", "joy", "sorrow",
  "anger", "peace", "fear", "wonder", "desire",
  "passion", "longing", "grief", "delight", "despair",
  "courage", "faith", "trust", "loneliness", "serenity",
  
  // Abstract
  "freedom", "truth", "beauty", "silence", "whisper",
  "shadow", "light", "darkness", "echo", "journey",
  "mirror", "reflection", "spirit", "soul", "destiny",
  "fate", "wisdom", "infinity", "mystery", "secret",
  
  // Objects
  "feather", "glass", "stone", "crystal", "candle",
  "flame", "door", "window", "bridge", "path",
  "treasure", "veil", "key", "crown", "sword",
  "book", "page", "letter", "portrait", "melody",
  
  // Descriptive
  "ancient", "eternal", "fragile", "broken", "golden",
  "silver", "velvet", "crimson", "azure", "emerald",
  "silent", "hollow", "sacred", "wild", "gentle",
  "fierce", "luminous", "hidden", "forgotten", "distant"
];

// Function to generate random words
export function generateRandomWords(count: number): string[] {
  const result: string[] = [];
  
  // Create a copy of the array to avoid duplicates
  const availableWords = [...poeticWords];
  
  for (let i = 0; i < count; i++) {
    if (availableWords.length === 0) break;
    
    // Pick a random word
    const randomIndex = Math.floor(Math.random() * availableWords.length);
    const selectedWord = availableWords[randomIndex];
    
    // Remove the word from the available pool
    availableWords.splice(randomIndex, 1);
    
    result.push(selectedWord);
  }
  
  return result;
}
