// Import the word generator from shared
import { generateRandomWords } from "@shared/wordGenerator";

/**
 * Generates random words for poetry challenges
 * This is a client-side wrapper for the shared word generator
 * 
 * @param count Number of words to generate (default: 5)
 * @returns Array of random words
 */
export function getRandomWords(count: number = 5): string[] {
  return generateRandomWords(count);
}

/**
 * Highlights challenge words in poem text
 * 
 * @param text The poem text to process
 * @param words Array of challenge words to highlight
 * @returns HTML string with highlighted words
 */
export function highlightWords(text: string, words: string[]): string {
  if (!text || !words || words.length === 0) return text;
  
  // Process the text line by line
  return text.split('\n').map(line => {
    let result = line;
    
    // Apply highlighting for each word
    words.forEach((word, idx) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const colorClasses = [
        "text-primary font-medium",
        "text-secondary font-medium", 
        "text-accent font-medium",
        "text-success font-medium",
        "text-warning font-medium"
      ];
      const colorClass = colorClasses[idx % colorClasses.length];
      
      result = result.replace(regex, `<span class="${colorClass}">${word}</span>`);
    });
    
    return result;
  }).join('\n');
}

/**
 * Creates JSX elements from a poem with highlighted words
 * 
 * @param content The poem content
 * @param words The challenge words to highlight
 * @returns Array of JSX paragraph elements
 */
export function renderPoemWithHighlightedWords(content: string, words: string[]): JSX.Element[] {
  if (!content) return [];
  
  return content.split('\n').map((line, i) => {
    let processedLine = line;
    
    words.forEach((word, idx) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const colorClasses = [
        "text-primary font-medium",
        "text-secondary font-medium", 
        "text-accent font-medium",
        "text-success font-medium",
        "text-warning font-medium"
      ];
      const colorClass = colorClasses[idx % colorClasses.length];
      
      processedLine = processedLine.replace(
        regex, 
        `<span class="${colorClass}">${word}</span>`
      );
    });
    
    // Use dangerouslySetInnerHTML to render the HTML
    return (
      <p key={i} className="mb-1" dangerouslySetInnerHTML={{ __html: processedLine }} />
    );
  });
}

/**
 * Checks if a poem contains all the required challenge words
 * 
 * @param content The poem content
 * @param words Array of required words
 * @returns Boolean indicating if all words are used
 */
export function validatePoemWords(content: string, words: string[]): boolean {
  if (!content || !words || words.length === 0) return false;
  
  const contentLower = content.toLowerCase();
  return words.every(word => {
    const regex = new RegExp(`\\b${word.toLowerCase()}\\b`);
    return regex.test(contentLower);
  });
}

/**
 * Generates a word chip element with animated floating effect
 * 
 * @param word The word to display
 * @param index The index for color selection and animation delay
 * @returns React element for the word chip
 */
export function generateWordChip(word: string, index: number): JSX.Element {
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
}
