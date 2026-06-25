'use client';

import type { ParsedAnnouncement } from '@/types';
import { calcDDay } from '@/lib/dday';

interface Props {
  announcements: ParsedAnnouncement[];
}

const FIELDS: { label: string; key: keyof ParsedAnnouncement }[] = [
  { label: '공고명', key: 'title' },
  { label: '발주기관', key: 'agency' },
  { label: '예정금액', key: 'estimatedPrice' },
  { label: '용역기간', key: 'servicePeriod' },
  { label: '마감일시', key: 'deadline' },
  { label: '참가자격', key: 'qualifications' },
];

function getVal(ann: ParsedAnnouncement, key: keyof ParsedAnnouncement): string {
  const edited = ann.manualEdits[key as keyof typeof ann.manualEdits];
  if (edited && typeof edited === 'string') return edited;
  const raw = ann[key];
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) return raw.join(', ');
  return '';
}

export default function CompareView({ announcements }: Props) {
  if (announcements.length < 2) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400">
        공고를 2개 이상 업로드하면 나란히 비교할 수 있습니다.
      </div>
    );
  }

  const cols = Math.min(announcements.length, 4);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm" style={{ minWidth: cols * 220 }}>
        <thead>
          <tr>
            <th className="w-24 border border-gray-200 bg-gray-50 p-2 text-left text-xs text-gray-500">항목</th>
            {announcements.slice(0, 4).map((ann) => {
              const dday = calcDDay(getVal(ann, 'deadline'));
              return (
                <th key={ann.id} className="border border-gray-200 bg-gray-50 p-2 text-left">
                  <div className="flex items-center gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${dday.colorClass}`}>
                      {dday.label}
                    </span>
                    <span className="text-xs text-gray-600 truncate max-w-[140px]">{ann.fileName}</span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {FIELDS.map(({ label, key }) => (
            <tr key={key} className="hover:bg-gray-50">
              <td className="border border-gray-200 bg-gray-50 p-2 text-xs font-medium text-gray-500 whitespace-nowrap">
                {label}
              </td>
              {announcements.slice(0, 4).map((ann) => {
                const v = getVal(ann, key);
                const unconfirmed = v.includes('미확인');
                return (
                  <td
                    key={ann.id}
                    className={`border border-gray-200 p-2 align-top ${unconfirmed ? 'text-gray-400 italic' : 'text-gray-800'}`}
                  >
                    {v}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
