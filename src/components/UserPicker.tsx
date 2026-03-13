"use client";
import { useState } from "react";

const PRESET_USERS = ["Roqim", "Adit"];

interface UserPickerProps {
  value: string;
  onChange: (user: string) => void;
}

export default function UserPicker({ value, onChange }: UserPickerProps) {
  const [showInput, setShowInput] = useState(false);
  const [customName, setCustomName] = useState("");

  const isCustom = value !== "" && !PRESET_USERS.includes(value);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-medium text-stone-500">Staff:</span>
      {PRESET_USERS.map((name) => (
        <button
          key={name}
          type="button"
          onClick={() => {
            onChange(name);
            setShowInput(false);
            setCustomName("");
          }}
          className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors duration-150 ${
            value === name
              ? "bg-amber-500 border-amber-500 text-white"
              : "bg-white border-stone-200 text-stone-600 hover:border-amber-400 hover:text-amber-600"
          }`}
        >
          {name}
        </button>
      ))}

      {/* Lainnya pill */}
      {!showInput && (
        <button
          type="button"
          onClick={() => {
            setShowInput(true);
            if (!isCustom) onChange("");
          }}
          className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors duration-150 ${
            isCustom
              ? "bg-amber-500 border-amber-500 text-white"
              : "bg-white border-stone-200 text-stone-600 hover:border-amber-400 hover:text-amber-600"
          }`}
        >
          {isCustom ? `✏️ ${value}` : "Lainnya…"}
        </button>
      )}

      {showInput && (
        <div className="flex items-center gap-1">
          <input
            autoFocus
            type="text"
            placeholder="Nama staff…"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && customName.trim()) {
                onChange(customName.trim());
                setShowInput(false);
              }
              if (e.key === "Escape") {
                setShowInput(false);
                setCustomName("");
              }
            }}
            className="border border-stone-200 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 w-36"
          />
          <button
            type="button"
            onClick={() => {
              if (customName.trim()) {
                onChange(customName.trim());
                setShowInput(false);
              }
            }}
            className="px-2 py-1 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600"
          >
            ✓
          </button>
          <button
            type="button"
            onClick={() => {
              setShowInput(false);
              setCustomName("");
            }}
            className="px-2 py-1 bg-stone-100 text-stone-500 rounded-lg text-sm hover:bg-stone-200"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
