export interface Skill {
  code: string;
  name: string;
  emoji: string;
  tagline: string;
}

export const SKILLS: Skill[] = [
  { code: "VE", name: "Video Editing", emoji: "🎬", tagline: "Cut, colour & tell stories that move." },
  { code: "WD", name: "Website Design", emoji: "🌐", tagline: "Design & ship sites people love." },
  { code: "FD", name: "Frontend Design", emoji: "💻", tagline: "Build interfaces with real code." },
  { code: "GD", name: "Graphic Design", emoji: "🎨", tagline: "Craft visuals that command attention." },
  { code: "SM", name: "Social Media Management", emoji: "📱", tagline: "Grow & run brands online." },
  { code: "MK", name: "Marketing", emoji: "📣", tagline: "Turn attention into outcomes." },
];

export const SKILL_MAP: Record<string, Skill> = Object.fromEntries(
  SKILLS.map((s) => [s.code, s]),
);

export function skillName(code: string): string {
  return SKILL_MAP[code]?.name ?? code;
}
