import { Link } from "@tanstack/react-router";

export function Logo({ size = 110, withLink = true }: { size?: number; withLink?: boolean }) {
  const img = (
    <span className="logo-glow">
      <img src="/logo.png" alt="KR8 Digitals" width={720} height={703} style={{ width: size, height: "auto" }} />
    </span>
  );
  if (!withLink) return img;
  return (
    <Link to="/" aria-label="KR8 Digitals home">
      {img}
    </Link>
  );
}
