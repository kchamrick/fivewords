import { useEffect, useState } from "react";

interface TimerProps {
  seconds: number;
}

export default function Timer({ seconds }: TimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(seconds);
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate the percentage of time that has elapsed
  const calculatePercentage = () => {
    // Assume the starting time was the current seconds + 20% buffer
    const estimatedStartingSeconds = Math.floor(seconds * 1.2);
    const elapsed = estimatedStartingSeconds - remainingSeconds;
    const percentage = Math.min(100, Math.max(0, (elapsed / estimatedStartingSeconds) * 100));
    return percentage;
  };
  
  // Calculate stroke-dashoffset based on percentage
  const dashOffset = () => {
    const circumference = 45 * 2 * Math.PI; // 2πr where r=45
    return circumference - (calculatePercentage() / 100) * circumference;
  };
  
  useEffect(() => {
    setRemainingSeconds(seconds);
    
    // Update timer every second
    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [seconds]);
  
  // Don't show timer if no time remaining
  if (remainingSeconds <= 0) return null;
  
  return (
    <div className="fixed bottom-20 right-4 w-16 h-16 z-10">
      <div className="relative w-full h-full">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle
            className="text-gray-200"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r="45"
            cx="50"
            cy="50"
          />
          <circle
            className="text-primary timer-circle"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r="45"
            cx="50"
            cy="50"
            strokeDasharray={45 * 2 * Math.PI}
            strokeDashoffset={dashOffset()}
          />
        </svg>
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-sm font-bold">
          {formatTime(remainingSeconds)}
        </div>
      </div>
    </div>
  );
}
