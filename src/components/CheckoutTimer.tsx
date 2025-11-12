import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CheckoutTimerProps {
  textColor?: string;
  buttonColor?: string;
}

export function CheckoutTimer({ textColor = '#000000', buttonColor = '#6366f1' }: CheckoutTimerProps) {
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (timeLeft === 0) {
    return (
      <div 
        className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed"
        style={{ 
          borderColor: buttonColor,
          backgroundColor: `${buttonColor}10`
        }}
      >
        <span className="text-lg font-bold" style={{ color: buttonColor }}>
          ⚠️ Oferta expirada!
        </span>
      </div>
    );
  }

  return (
    <div 
      className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed animate-pulse"
      style={{ 
        borderColor: buttonColor,
        backgroundColor: `${buttonColor}10`
      }}
    >
      <Clock className="w-5 h-5" style={{ color: buttonColor }} />
      <div className="flex items-center gap-1">
        <span className="text-lg font-bold" style={{ color: buttonColor }}>
          Oferta expira em:
        </span>
        <span className="text-2xl font-mono font-bold" style={{ color: buttonColor }}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}
