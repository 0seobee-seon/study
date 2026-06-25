'use client';

import { useState, useCallback } from 'react';
import type { ParsedAnnouncement, ChecklistItem } from '@/types';
import { useAppState } from '@/hooks/useAppState';
import Sidebar from '@/components/Sidebar';
import DashboardHome from '@/components/DashboardHome';
import AnnouncementTable from '@/components/AnnouncementTable';
import SlidePanel from '@/components/SlidePanel';
import AnnouncementCard from '@/components/AnnouncementCard';
import ChecklistPanel from '@/components/ChecklistPanel';
import CompareView from '@/components/CompareView';
import CredentialForm from '@/components/CredentialForm';
import WarningBanner from '@/components/WarningBanner';

type Page = 'dashboard' | 'announcements' | 'compare' | 'credential';

export default function Home() {
  const { state, setState, reset, loaded } = useAppState();
  const [page, setPage] = useState<Page>('dashboard');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const announcements = Object.values(state.announcements);

  const addAnnouncement = useCallback(
    (ann: ParsedAnnouncement) => {
      const docs = ann.documents.filter((d) => !d.includes('미확인'));
      const items: ChecklistItem[] = docs.map((d) => ({
        id: crypto.randomUUID(),
        text: d,
        completed: false,
        custom: false,
      }));
      setState((prev) => ({
        ...prev,
        announcements: { ...prev.announcements, [ann.id]: ann },
        checklists: { ...prev.checklists, [ann.id]: items },
      }));
      setSelectedId(ann.id);
      setPage('announcements');
    },
    [setState],
  );

  function removeAnnouncement(id: string) {
    setState((prev) => {
      const { [id]: _a, ...anns } = prev.announcements;
      const { [id]: _c, ...cls } = prev.checklists;
      return { ...prev, announcements: anns, checklists: cls };
    });
    if (selectedId === id) setSelectedId(null);
  }

  function editAnnouncement(id: string, field: string, value: string) {
    setState((prev) => ({
      ...prev,
      announcements: {
        ...prev.announcements,
        [id]: {
          ...prev.announcements[id],
          manualEdits: { ...prev.announcements[id].manualEdits, [field]: value },
        },
      },
    }));
  }

  function updateChecklist(annId: string, items: ChecklistItem[]) {
    setState((prev) => ({ ...prev, checklists: { ...prev.checklists, [annId]: items } }));
  }

  function handleSelectAnnouncement(id: string) {
    setSelectedId(id);
    if (page !== 'announcements') setPage('announcements');
  }

  function handleReset() {
    if (confirm('모든 데이터를 초기화하시겠습니까?')) {
      reset();
      setSelectedId(null);
    }
  }

  if (!loaded) return null;

  const selectedAnn = selectedId ? state.announcements[selectedId] : null;

  return (
    <div className="flex h-screen bg-violet-950 overflow-hidden">
      <Sidebar
        current={page}
        onChange={setPage}
        onReset={handleReset}
        count={announcements.length}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">
          {page === 'dashboard' && (
            <DashboardHome
              announcements={announcements}
              checklists={state.checklists}
              onSelectAnnouncement={handleSelectAnnouncement}
            />
          )}

          {page === 'announcements' && (
            <AnnouncementTable
              announcements={announcements}
              checklists={state.checklists}
              onParsed={addAnnouncement}
              onRemove={removeAnnouncement}
              onSelect={(id) => setSelectedId(selectedId === id ? null : id)}
              selectedId={selectedId}
            />
          )}

          {page === 'compare' && (
            <div className="space-y-5">
              <div>
                <h1 className="text-lg font-semibold text-gray-800">비교 뷰</h1>
                <p className="text-sm text-gray-400 mt-0.5">공고를 나란히 비교합니다. (최대 4개)</p>
              </div>
              <WarningBanner />
              <CompareView announcements={announcements} />
            </div>
          )}

          {page === 'credential' && (
            <div className="space-y-5">
              <div>
                <h1 className="text-lg font-semibold text-gray-800">실적·경력</h1>
                <p className="text-sm text-gray-400 mt-0.5">유사용역 실적과 기술자 경력을 입력하고 Word로 내보냅니다.</p>
              </div>
              <CredentialForm
                projects={state.form.projects}
                engineers={state.form.engineers}
                onChange={(projects, engineers) =>
                  setState((prev) => ({ ...prev, form: { projects, engineers } }))
                }
              />
            </div>
          )}
        </div>
      </main>

      {/* Right slide panel */}
      <SlidePanel open={!!selectedAnn} onClose={() => setSelectedId(null)}>
        {selectedAnn && (
          <>
            <WarningBanner />
            <AnnouncementCard
              ann={selectedAnn}
              onEdit={editAnnouncement}
              onRemove={(id) => { removeAnnouncement(id); setSelectedId(null); }}
            />
            <ChecklistPanel
              announcementId={selectedAnn.id}
              announcementTitle={
                (selectedAnn.manualEdits.title ?? selectedAnn.title).slice(0, 40) ||
                selectedAnn.fileName
              }
              items={state.checklists[selectedAnn.id] ?? []}
              onChange={updateChecklist}
            />
          </>
        )}
      </SlidePanel>
    </div>
  );
}
