import { Link } from "@tanstack/react-router";

export function Logo({ size = 110, withLink = true }: { size?: number; withLink?: boolean }) {
  const img = (
    <span className="logo-glow">
      <img src="/logo.png" alt="KR8 Digitals" width={size} height={size} style={{ width: size, height: size }} />
    </span>
  );
  if (!withLink) return img;
  return (
    <Link to="/" aria-label="KR8 Digitals home">
      {img}
    </Link>
  );
}
