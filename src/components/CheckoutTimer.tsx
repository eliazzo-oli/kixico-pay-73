import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CheckoutTimerProps {
  textColor?: string;
}

export function CheckoutTimer({ textColor = '#000000' }: CheckoutTimerProps) {
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div 
      className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed animate-pulse"
      style={{ 
        borderColor: textColor,
        color: textColor 
      }}
    >
      <Clock className="w-5 h-5" />
      <div className="flex items-center gap-1">
        <span className="text-lg font-bold">
          Oferta expira em:
        </span>
        <span className="text-2xl font-mono font-bold">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}
