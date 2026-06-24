import { useEffect, useState } from "react";

const COLORS = ["#00E5FF", "#FFD700", "#C026D3", "#7B2FBE", "#25D366"];

interface Piece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  rotate: number;
}

export function Confetti({ count = 80 }: { count?: number }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    const arr: Piece[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 1.1 + Math.random() * 0.6,
      color: COLORS[i % COLORS.length],
      rotate: Math.random() * 360,
    }));
    setPieces(arr);
    const t = setTimeout(() => setPieces([]), 1700);
    return () => clearTimeout(t);
  }, [count]);

  if (pieces.length === 0) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
            borderRadius: p.id % 2 ? "2px" : "9999px",
          }}
        />
      ))}
    </div>
  );
}
