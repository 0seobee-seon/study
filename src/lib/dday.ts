export interface DDayInfo {
  label: string;
  colorClass: string;
  days: number | null;
}

export function calcDDay(deadlineStr: string): DDayInfo {
  const cleaned = deadlineStr.replace(/[년월]\s*/g, '-').replace(/일.*/, '').trim();
  const date = new Date(cleaned);

  if (isNaN(date.getTime())) {
    return { label: '날짜 미확인', colorClass: 'bg-gray-200 text-gray-600', days: null };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diff = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) return { label: '마감', colorClass: 'bg-gray-300 text-gray-700', days: diff };
  if (diff === 0) return { label: 'D-Day', colorClass: 'bg-red-600 text-white', days: 0 };
  if (diff <= 7) return { label: `D-${diff}`, colorClass: 'bg-red-500 text-white', days: diff };
  return { label: `D-${diff}`, colorClass: 'bg-blue-500 text-white', days: diff };
}

/** 마감일 문자열 → 잔여 일수 (숫자). 파싱 실패 시 null. */
export function getDDay(deadlineStr: string): number | null {
  return calcDDay(deadlineStr).days;
}
