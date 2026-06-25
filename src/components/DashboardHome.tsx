'use client';

import type { ParsedAnnouncement, ChecklistItem } from '@/types';
import { getDDay } from '@/lib/dday';

interface Props {
  announcements: ParsedAnnouncement[];
  checklists: Record<string, ChecklistItem[]>;
  onSelectAnnouncement: (id: string) => void;
}

function KpiCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 px-6 py-5">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color ?? 'text-gray-800'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardHome({ announcements, checklists, onSelectAnnouncement }: Props) {
  const urgent = announcements.filter((a) => {
    const dd = getDDay(a.manualEdits.deadline ?? a.deadline);
    return dd !== null && dd <= 7 && dd >= 0;
  });

  const avgProgress =
    announcements.length === 0
      ? 0
      : Math.round(
          announcements.reduce((sum, a) => {
            const items = checklists[a.id] ?? [];
            if (items.length === 0) return sum;
            return sum + (items.filter((i) => i.completed).length / items.length) * 100;
          }, 0) / announcements.length,
        );

  const upcoming = [...announcements]
    .map((a) => ({ ...a, dday: getDDay(a.manualEdits.deadline ?? a.deadline) }))
    .filter((a) => a.dday !== null && a.dday >= 0)
    .sort((a, b) => (a.dday ?? 999) - (b.dday ?? 999))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-800">대시보드</h1>
        <p className="text-sm text-gray-400 mt-0.5">입찰 공고 현황을 한눈에 확인하세요.</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="전체 공고" value={announcements.length} sub="건" />
        <KpiCard label="D-7 임박" value={urgent.length} sub="건" color={urgent.length > 0 ? 'text-red-600' : 'text-gray-800'} />
        <KpiCard label="평균 체크리스트 완료율" value={`${avgProgress}%`} />
      </div>

      {/* Upcoming deadlines */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-50">
          <p className="text-sm font-semibold text-gray-700">마감 임박 공고</p>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-400 px-5 py-8 text-center">마감 임박 공고가 없습니다.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-50">
                <th className="text-left px-5 py-3 font-medium">공고명</th>
                <th className="text-left px-4 py-3 font-medium">발주기관</th>
                <th className="text-left px-4 py-3 font-medium">마감일</th>
                <th className="text-right px-5 py-3 font-medium">D-Day</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((ann) => {
                const dday = ann.dday ?? 0;
                const ddayLabel = dday === 0 ? 'D-Day' : `D-${dday}`;
                const ddayColor = dday <= 7 ? 'text-red-600 font-bold' : 'text-gray-500';
                return (
                  <tr
                    key={ann.id}
                    onClick={() => onSelectAnnouncement(ann.id)}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3 text-gray-800 max-w-[220px] truncate">
                      {(ann.manualEdits.title ?? ann.title).replace('미확인 — 원문 확인 필요', ann.fileName)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-[120px] truncate">
                      {(ann.manualEdits.agency ?? ann.agency).replace('미확인 — 원문 확인 필요', '—')}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {(ann.manualEdits.deadline ?? ann.deadline).replace('미확인 — 원문 확인 필요', '—')}
                    </td>
                    <td className={`px-5 py-3 text-right ${ddayColor}`}>{ddayLabel}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
