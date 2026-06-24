import { Check } from "lucide-react";
import type { Skill } from "@/lib/skills";

export function SkillCard({
  skill,
  selected,
  onSelect,
}: {
  skill: Skill;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`skill-card ${selected ? "selected" : ""}`}
    >
      {selected ? (
        <span className="skill-check">
          <Check size={16} strokeWidth={3} />
        </span>
      ) : null}
      <div className="text-3xl">{skill.emoji}</div>
      <h3 className="mt-3 text-lg font-bold text-foreground">{skill.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{skill.tagline}</p>
      <span className="mt-2 inline-block text-xs font-semibold tracking-widest text-cyan">{skill.code}</span>
    </button>
  );
}
