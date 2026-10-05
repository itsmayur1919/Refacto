"use client";

import { useState } from "react";

interface Tab {
  key: string;
  label: string;
  count: number;
}

export function ReviewTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="mb-3.5 flex w-fit gap-1 rounded-lg bg-[#EDECE6] p-[3px]">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`rounded-md px-3.5 py-1.5 text-xs transition-colors ${
            active === tab.key ? "bg-ink font-medium text-paper" : "text-muted hover:text-ink"
          }`}
        >
          {tab.label} ({tab.count})
        </button>
      ))}
    </div>
  );
}
