export default function WarningBanner() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm">
      <span className="mt-0.5 text-amber-500">⚠️</span>
      <p className="text-amber-800">
        <strong>원문 확인 필요</strong> — 자동 파싱 결과는 키워드 매칭 방식으로 생성되며 오류가 있을 수 있습니다.
        반드시 공고 원문을 직접 확인하여 최종 판단하세요.
      </p>
    </div>
  );
}
