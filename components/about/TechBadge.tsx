import React from "react";

interface TechBadgeProps {
  category: string;
  size?: "sm" | "md";
}

export const TechBadge: React.FC<TechBadgeProps> = ({ category, size = "sm" }) => {
  const getBadgeStyle = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "core":
        return "bg-purple-950/60 text-purple-400 border-purple-800/80";
      case "cloud":
        return "bg-sky-950/60 text-sky-400 border-sky-800/80";
      case "database":
        return "bg-emerald-950/60 text-emerald-400 border-emerald-800/80";
      case "ui":
        return "bg-amber-950/60 text-amber-400 border-amber-800/80";
      case "validation":
        return "bg-rose-950/60 text-rose-400 border-rose-800/80";
      case "tooling":
        return "bg-cyan-950/60 text-cyan-400 border-cyan-800/80";
      case "infrastructure":
        return "bg-indigo-950/60 text-indigo-400 border-indigo-800/80";
      default:
        return "bg-zinc-900 text-zinc-400 border-zinc-800";
    }
  };

  const getLabel = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "core":
        return "Core Engine";
      case "cloud":
        return "Cloud SDK";
      case "database":
        return "Audit Ledger";
      case "ui":
        return "Design System";
      case "validation":
        return "Security / Guard";
      case "tooling":
        return "Dev & Testing";
      case "infrastructure":
        return "Infrastructure";
      default:
        return cat;
    }
  };

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded border uppercase tracking-wider ${sizeClasses} ${getBadgeStyle(
        category
      )}`}
    >
      {getLabel(category)}
    </span>
  );
};
