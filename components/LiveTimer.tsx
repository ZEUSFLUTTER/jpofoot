"use client";

import { useEffect, useState } from "react";
import { MatchStatus, isMatchLive } from "@/lib/types";

interface LiveTimerProps {
  status: MatchStatus;
  baseMinute: number;
  timerStartedAt?: string | null;
}

export function LiveTimer({ status, baseMinute, timerStartedAt }: LiveTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!timerStartedAt || !isMatchLive(status)) {
      setElapsed(0);
      return;
    }

    const calc = () => {
      const ms = Date.now() - new Date(timerStartedAt).getTime();
      setElapsed(Math.max(0, Math.floor(ms / 60000)));
    };

    calc();
    const interval = setInterval(calc, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [timerStartedAt, status]);

  const displayMinute = baseMinute + elapsed;

  return (
    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest tabular-nums">
      {displayMinute}'
    </span>
  );
}
