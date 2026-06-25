'use client';

import { useState } from 'react';
import type { ProjectRecord, Engineer } from '@/types';
import { exportCredentials } from '@/lib/exporter';

interface Props {
  projects: ProjectRecord[];
  engineers: Engineer[];
  onChange: (projects: ProjectRecord[], engineers: Engineer[]) => void;
}

function emptyProject(): ProjectRecord {
  return { id: crypto.randomUUID(), serviceTitle: '', agency: '', contractAmount: '', servicePeriod: '', description: '' };
}
function emptyEngineer(): Engineer {
  return { id: crypto.randomUUID(), name: '', certification: '', experience: '', role: '' };
}

function ProjectRow({
  p,
  onUpdate,
  onRemove,
}: {
  p: ProjectRecord;
  onUpdate: (updated: ProjectRecord) => void;
  onRemove: () => void;
}) {
  const inp = (field: keyof ProjectRecord, placeholder: string, wide = false) => (
    <input
      value={p[field]}
      placeholder={placeholder}
      onChange={(e) => onUpdate({ ...p, [field]: e.target.value })}
      className={`border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400 ${wide ? 'col-span-2' : ''}`}
    />
  );
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-start p-3 rounded-lg bg-gray-50 border border-gray-100">
      {inp('serviceTitle', '용역명')}
      {inp('agency', '발주기관')}
      {inp('contractAmount', '계약금액')}
      {inp('servicePeriod', '용역기간')}
      <div className="flex gap-1">
        {inp('description', '수행내용')}
        <button onClick={onRemove} className="text-gray-300 hover:text-red-400 text-lg leading-none px-1">×</button>
      </div>
    </div>
  );
}

function EngineerRow({
  e,
  onUpdate,
  onRemove,
}: {
  e: Engineer;
  onUpdate: (updated: Engineer) => void;
  onRemove: () => void;
}) {
  const inp = (field: keyof Engineer, placeholder: string) => (
    <input
      value={e[field]}
      placeholder={placeholder}
      onChange={(ev) => onUpdate({ ...e, [field]: ev.target.value })}
      className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400"
    />
  );
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 items-center p-3 rounded-lg bg-gray-50 border border-gray-100">
      {inp('name', '성명')}
      {inp('certification', '자격증')}
      {inp('experience', '주요경력')}
      <div className="flex gap-1">
        {inp('role', '투입예정 역할')}
        <button onClick={onRemove} className="text-gray-300 hover:text-red-400 text-lg leading-none px-1">×</button>
      </div>
    </div>
  );
}

export default function CredentialForm({ projects, engineers, onChange }: Props) {
  const [exporting, setExporting] = useState(false);

  function updateProject(updated: ProjectRecord) {
    onChange(projects.map((p) => (p.id === updated.id ? updated : p)), engineers);
  }
  function removeProject(id: string) {
    onChange(projects.filter((p) => p.id !== id), engineers);
  }
  function updateEngineer(updated: Engineer) {
    onChange(projects, engineers.map((e) => (e.id === updated.id ? updated : e)));
  }
  function removeEngineer(id: string) {
    onChange(projects, engineers.filter((e) => e.id !== id));
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportCredentials(projects, engineers);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* 유사용역 실적 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">유사용역 실적</h3>
          <button
            onClick={() => onChange([...projects, emptyProject()], engineers)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + 추가
          </button>
        </div>
        {projects.length === 0 && (
          <p className="text-sm text-gray-400 italic">실적을 추가하세요.</p>
        )}
        <div className="space-y-2">
          {projects.map((p) => (
            <ProjectRow key={p.id} p={p} onUpdate={updateProject} onRemove={() => removeProject(p.id)} />
          ))}
        </div>
      </section>

      {/* 기술자 경력 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">기술자 경력</h3>
          <button
            onClick={() => onChange(projects, [...engineers, emptyEngineer()])}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + 추가
          </button>
        </div>
        {engineers.length === 0 && (
          <p className="text-sm text-gray-400 italic">기술자를 추가하세요.</p>
        )}
        <div className="space-y-2">
          {engineers.map((e) => (
            <EngineerRow key={e.id} e={e} onUpdate={updateEngineer} onRemove={() => removeEngineer(e.id)} />
          ))}
        </div>
      </section>

      {/* 내보내기 */}
      <button
        onClick={handleExport}
        disabled={exporting || (projects.length === 0 && engineers.length === 0)}
        className="w-full rounded-xl bg-blue-700 py-3 text-white font-semibold hover:bg-blue-800 disabled:opacity-40 transition-colors"
      >
        {exporting ? '생성 중...' : '📥 Word 파일로 내보내기 (.docx)'}
      </button>
    </div>
  );
}
