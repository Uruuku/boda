"use client";

import { useState, useEffect } from 'react';
import { BODA } from '@/config/boda';

const WEDDING_DATE = new Date(BODA.fechaHora).getTime();

type TimerStatus = 'initializing' | 'active' | 'expired';

export default function Countdown({ dict }: { dict: any }) {
  const [status, setStatus] = useState<TimerStatus>('initializing');
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const distance = WEDDING_DATE - now;
      if (distance <= 0) {
        setStatus('expired');
        return true;
      }
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
      setStatus('active');
      return false;
    };

    calculateTimeLeft();
    const timer = setInterval(() => {
      if (calculateTimeLeft()) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (status === 'initializing' || status === 'expired') return null;

  return (
    <div className="flex gap-4 md:gap-8 justify-center items-center py-6 animate-in fade-in zoom-in duration-1000">
      <TimeUnit value={timeLeft.days} label={dict.dias} />
      <TimeUnit value={timeLeft.hours} label={dict.horas} />
      <TimeUnit value={timeLeft.minutes} label={dict.minutos} />
      <TimeUnit value={timeLeft.seconds} label={dict.segundos} />
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white/40 backdrop-blur-sm border border-wedding-sage/20 rounded-xl w-16 h-16 md:w-20 md:h-20 flex items-center justify-center shadow-sm">
        <span className="text-2xl md:text-3xl font-serif text-wedding-sage font-bold">
          {value}
        </span>
      </div>
      <span className="text-[10px] md:text-xs uppercase tracking-widest text-wedding-gold mt-2 font-semibold">
        {label}
      </span>
    </div>
  );
}