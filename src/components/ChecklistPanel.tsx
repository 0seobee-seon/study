'use client';

import { useState } from 'react';
import type { ChecklistItem } from '@/types';

interface Props {
  announcementId: string;
  announcementTitle: string;
  items: ChecklistItem[];
  onChange: (id: string, items: ChecklistItem[]) => void;
}

export default function ChecklistPanel({ announcementId, announcementTitle, items, onChange }: Props) {
  const [newText, setNewText] = useState('');

  const completed = items.filter((i) => i.completed).length;
  const total = items.length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  function toggle(itemId: string) {
    onChange(
      announcementId,
      items.map((i) => (i.id === itemId ? { ...i, completed: !i.completed } : i)),
    );
  }

  function addItem() {
    const text = newText.trim();
    if (!text) return;
    onChange(announcementId, [
      ...items,
      { id: crypto.randomUUID(), text, completed: false, custom: true },
    ]);
    setNewText('');
  }

  function removeItem(itemId: string) {
    onChange(announcementId, items.filter((i) => i.id !== itemId));
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-gray-800 mb-1 truncate">{announcementTitle}</h3>

      {/* 진행률 */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs font-bold text-blue-600 w-9 text-right">{pct}%</span>
      </div>

      {/* 목록 */}
      <ul className="space-y-1.5 mb-4">
        {items.length === 0 && (
          <li className="text-sm text-gray-400 italic">제출서류가 없습니다. 직접 추가하세요.</li>
        )}
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2 group">
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => toggle(item.id)}
              className="mt-0.5 accent-blue-600 cursor-pointer"
            />
            <span className={`flex-1 text-sm leading-5 ${item.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
              {item.text}
              {item.custom && <span className="ml-1 text-xs text-gray-300">(직접 추가)</span>}
            </span>
            <button
              onClick={() => removeItem(item.id)}
              className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 text-sm"
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      {/* 항목 추가 */}
      <div className="flex gap-2">
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          placeholder="서류 추가 후 Enter"
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-400"
        />
        <button
          onClick={addItem}
          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
        >
          추가
        </button>
      </div>
    </div>
  );
}
