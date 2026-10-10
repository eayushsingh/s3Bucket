import React from "react";
import { TECHNOLOGY_CATEGORIES } from "@/lib/technology-stack";

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  categoryCounts: Record<string, number>;
  totalCount: number;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  totalCount,
}) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none font-mono text-xs">
      <button
        onClick={() => onSelectCategory("all")}
        className={`px-3 py-1.5 rounded text-[11px] font-medium transition flex items-center gap-1.5 whitespace-nowrap border ${
          selectedCategory === "all"
            ? "bg-zinc-100 text-zinc-950 border-zinc-100 shadow-sm"
            : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800/60"
        }`}
      >
        <span>All Packages</span>
        <span
          className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            selectedCategory === "all" ? "bg-zinc-300 text-zinc-900" : "bg-zinc-800 text-zinc-400"
          }`}
        >
          {totalCount}
        </span>
      </button>

      {TECHNOLOGY_CATEGORIES.map((cat) => {
        const count = categoryCounts[cat.id] || 0;
        const isSelected = selectedCategory === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`px-3 py-1.5 rounded text-[11px] font-medium transition flex items-center gap-1.5 whitespace-nowrap border ${
              isSelected
                ? "bg-zinc-100 text-zinc-950 border-zinc-100 shadow-sm"
                : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800/60"
            }`}
          >
            <span>{cat.title}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                isSelected ? "bg-zinc-300 text-zinc-900" : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
