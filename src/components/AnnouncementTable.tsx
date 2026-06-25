'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { ParsedAnnouncement, ChecklistItem } from '@/types';
import { getDDay } from '@/lib/dday';

const PDFUploader = dynamic(() => import('@/components/PDFUploader'), { ssr: false });

interface Props {
  announcements: ParsedAnnouncement[];
  checklists: Record<string, ChecklistItem[]>;
  onParsed: (ann: ParsedAnnouncement) => void;
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
  selectedId: string | null;
}

function DDayBadge({ deadline }: { deadline: string }) {
  const dday = getDDay(deadline);
  if (dday === null) return <span className="text-gray-300 text-xs">—</span>;
  if (dday < 0) return <span className="text-xs text-gray-300">종료</span>;
  const label = dday === 0 ? 'D-Day' : `D-${dday}`;
  const color =
    dday === 0
      ? 'bg-red-600 text-white'
      : dday <= 7
      ? 'bg-red-100 text-red-700'
      : 'bg-gray-100 text-gray-500';
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${color}`}>{label}</span>;
}

function ProgressBar({ items }: { items: ChecklistItem[] }) {
  if (items.length === 0) return <span className="text-xs text-gray-300">—</span>;
  const pct = Math.round((items.filter((i) => i.completed).length / items.length) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500">{pct}%</span>
    </div>
  );
}

export default function AnnouncementTable({
  announcements,
  checklists,
  onParsed,
  onRemove,
  onSelect,
  selectedId,
}: Props) {
  const [uploaderKey, setUploaderKey] = useState(0);

  const handleParsed = useCallback(
    (ann: ParsedAnnouncement) => {
      onParsed(ann);
      setUploaderKey((k) => k + 1);
    },
    [onParsed],
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-gray-800">공고 목록</h1>
        <p className="text-sm text-gray-400 mt-0.5">PDF를 업로드하면 자동으로 목록에 추가됩니다.</p>
      </div>

      {/* Uploader */}
      <PDFUploader key={uploaderKey} onParsed={handleParsed} compact />

      {/* Table */}
      {announcements.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 px-5 py-12 text-center">
          <p className="text-sm text-gray-400">공고 PDF를 업로드하면 목록이 표시됩니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3 font-medium">공고명</th>
                <th className="text-left px-4 py-3 font-medium">발주기관</th>
                <th className="text-left px-4 py-3 font-medium">예정금액</th>
                <th className="text-left px-4 py-3 font-medium">마감일</th>
                <th className="text-left px-4 py-3 font-medium">D-Day</th>
                <th className="text-left px-4 py-3 font-medium">체크리스트</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {announcements.map((ann) => {
                const title = (ann.manualEdits.title ?? ann.title).replace(
                  '미확인 — 원문 확인 필요',
                  ann.fileName,
                );
                const agency = (ann.manualEdits.agency ?? ann.agency).replace(
                  '미확인 — 원문 확인 필요',
                  '—',
                );
                const price = (ann.manualEdits.estimatedPrice ?? ann.estimatedPrice).replace(
                  '미확인 — 원문 확인 필요',
                  '—',
                );
                const deadline = ann.manualEdits.deadline ?? ann.deadline;
                const isSelected = ann.id === selectedId;

                return (
                  <tr
                    key={ann.id}
                    onClick={() => onSelect(ann.id)}
                    className={`border-b border-gray-50 last:border-0 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50' : 'hover:bg-gray-50/70'
                    }`}
                  >
                    <td className="px-5 py-3 max-w-[200px]">
                      <p className="truncate text-gray-800 font-medium">{title}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-[120px]">
                      <p className="truncate">{agency}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{price}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                      {deadline.replace('미확인 — 원문 확인 필요', '—')}
                    </td>
                    <td className="px-4 py-3">
                      <DDayBadge deadline={deadline} />
                    </td>
                    <td className="px-4 py-3">
                      <ProgressBar items={checklists[ann.id] ?? []} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('이 공고를 삭제하시겠습니까?')) onRemove(ann.id);
                        }}
                        className="text-gray-300 hover:text-red-400 transition-colors text-base leading-none"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
