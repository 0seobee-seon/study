'use client';

type Page = 'dashboard' | 'announcements' | 'compare' | 'credential';

interface Props {
  current: Page;
  onChange: (page: Page) => void;
  onReset: () => void;
  count: number;
}

const NAV: { id: Page; icon: string; label: string }[] = [
  { id: 'dashboard', icon: '⊞', label: '대시보드' },
  { id: 'announcements', icon: '≡', label: '공고 목록' },
  { id: 'compare', icon: '⇆', label: '비교 뷰' },
  { id: 'credential', icon: '◫', label: '실적·경력' },
];

export default function Sidebar({ current, onChange, onReset, count }: Props) {
  return (
    <aside className="w-[220px] shrink-0 h-screen sticky top-0 bg-violet-900 border-r border-violet-800 flex flex-col">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-violet-800">
        <p className="font-bold text-white text-sm leading-tight">선엔지니어링</p>
        <p className="text-[11px] text-violet-400 mt-0.5">입찰 공고 분석기</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {NAV.map((item) => {
          const active = current === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-white/15 text-white font-medium'
                  : 'text-violet-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-base w-4 text-center leading-none">{item.icon}</span>
              <span>{item.label}</span>
              {item.id === 'announcements' && count > 0 && (
                <span className="ml-auto text-[11px] bg-violet-700 text-violet-200 rounded-full px-1.5 py-0.5 font-medium">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-4 py-4 border-t border-violet-800">
        <button
          onClick={onReset}
          className="w-full text-left text-xs text-violet-500 hover:text-red-400 transition-colors py-1"
        >
          데이터 초기화
        </button>
      </div>
    </aside>
  );
}
