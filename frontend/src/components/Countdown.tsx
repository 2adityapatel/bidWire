import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface CountdownProps {
  endsAt: string;
  isClosed: boolean;
}

export function Countdown({ endsAt, isClosed }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (isClosed) {
      setTimeLeft("Ended");
      return;
    }

    const update = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Ending...");
        return;
      }
      const totalSeconds = Math.floor(diff / 1000);
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;

      setIsUrgent(totalSeconds < 60);

      if (h > 0) {
        setTimeLeft(`${h}h ${m}m ${s}s`);
      } else if (m > 0) {
        setTimeLeft(`${m}m ${s}s`);
      } else {
        setTimeLeft(`${s}s`);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endsAt, isClosed]);

  return (
    <span className={`countdown ${isUrgent ? "countdown--urgent" : ""}`}>
      <Clock size={12} /> {timeLeft}
    </span>
  );
}
