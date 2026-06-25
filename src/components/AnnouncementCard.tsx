'use client';

import { useState } from 'react';
import type { ParsedAnnouncement } from '@/types';
import { calcDDay } from '@/lib/dday';

type EditableField = 'title' | 'agency' | 'estimatedPrice' | 'servicePeriod' | 'deadline' | 'qualifications';

interface Props {
  ann: ParsedAnnouncement;
  onEdit: (id: string, field: EditableField, value: string) => void;
  onRemove: (id: string) => void;
  compact?: boolean;
}

function val(ann: ParsedAnnouncement, field: EditableField): string {
  return (ann.manualEdits[field] as string | undefined) ?? ann[field];
}

function Row({
  label,
  field,
  ann,
  onEdit,
  multiline,
}: {
  label: string;
  field: EditableField;
  ann: ParsedAnnouncement;
  onEdit: (f: EditableField, v: string) => void;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const value = val(ann, field);
  const unconfirmed = value.includes('미확인');

  return (
    <div className="flex gap-2 py-1.5 border-b border-gray-100 last:border-0">
      <span className="w-20 shrink-0 text-xs font-medium text-gray-500 pt-0.5">{label}</span>
      {editing ? (
        multiline ? (
          <textarea
            autoFocus
            className="flex-1 text-sm border border-blue-400 rounded px-2 py-1 resize-none"
            rows={3}
            defaultValue={value}
            onBlur={(e) => { onEdit(field, e.target.value); setEditing(false); }}
          />
        ) : (
          <input
            autoFocus
            className="flex-1 text-sm border border-blue-400 rounded px-2 py-0.5"
            defaultValue={value}
            onBlur={(e) => { onEdit(field, e.target.value); setEditing(false); }}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          />
        )
      ) : (
        <span
          className={`flex-1 text-sm break-words ${unconfirmed ? 'text-gray-400 italic' : 'text-gray-800'}`}
        >
          {value}
        </span>
      )}
      <button
        onClick={() => setEditing(!editing)}
        className="text-gray-300 hover:text-blue-500 shrink-0 text-xs"
        title="수정"
      >
        ✏️
      </button>
    </div>
  );
}

export default function AnnouncementCard({ ann, onEdit, onRemove, compact }: Props) {
  const deadline = val(ann, 'deadline');
  const dday = calcDDay(deadline);

  function handleEdit(field: EditableField, value: string) {
    onEdit(ann.id, field, value);
  }

  return (
    <div className={`relative rounded-xl border border-gray-200 bg-white shadow-sm ${compact ? 'p-4' : 'p-5'}`}>
      <button
        onClick={() => onRemove(ann.id)}
        className="absolute top-3 right-3 text-gray-300 hover:text-red-400 text-lg leading-none"
        title="삭제"
      >
        ×
      </button>

      {/* D-Day 배지 */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${dday.colorClass}`}>
          {dday.label}
        </span>
        <span className="text-xs text-gray-400 truncate max-w-[180px]">{ann.fileName}</span>
      </div>

      <Row label="공고명" field="title" ann={ann} onEdit={handleEdit} />
      <Row label="발주기관" field="agency" ann={ann} onEdit={handleEdit} />
      <Row label="예정금액" field="estimatedPrice" ann={ann} onEdit={handleEdit} />
      <Row label="용역기간" field="servicePeriod" ann={ann} onEdit={handleEdit} />
      <Row label="마감일시" field="deadline" ann={ann} onEdit={handleEdit} />
      <Row label="참가자격" field="qualifications" ann={ann} onEdit={handleEdit} multiline />
    </div>
  );
}
