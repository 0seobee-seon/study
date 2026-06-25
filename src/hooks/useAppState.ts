'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AppState, ParsedAnnouncement, ChecklistItem, ProjectRecord, Engineer } from '@/types';
import { createClient } from '@/lib/supabase/client';

const DEFAULT_STATE: AppState = {
  announcements: {},
  checklists: {},
  form: { projects: [], engineers: [] },
};

// DB 행 → 앱 타입 변환
function rowToAnnouncement(row: Record<string, unknown>): ParsedAnnouncement {
  return {
    id: row.id as string,
    uploadedAt: row.uploaded_at as string,
    fileName: row.file_name as string,
    rawText: row.raw_text as string,
    title: row.title as string,
    agency: row.agency as string,
    estimatedPrice: row.estimated_price as string,
    servicePeriod: row.service_period as string,
    deadline: row.deadline as string,
    qualifications: row.qualifications as string,
    documents: (row.documents as string[]) ?? [],
    manualEdits: (row.manual_edits as ParsedAnnouncement['manualEdits']) ?? {},
  };
}

function rowToChecklistItem(row: Record<string, unknown>): ChecklistItem {
  return {
    id: row.id as string,
    text: row.text as string,
    completed: row.completed as boolean,
    custom: row.custom as boolean,
  };
}

function rowToProject(row: Record<string, unknown>): ProjectRecord {
  return {
    id: row.id as string,
    serviceTitle: row.service_title as string,
    agency: row.agency as string,
    contractAmount: row.contract_amount as string,
    servicePeriod: row.service_period as string,
    description: row.description as string,
  };
}

function rowToEngineer(row: Record<string, unknown>): Engineer {
  return {
    id: row.id as string,
    name: row.name as string,
    certification: row.certification as string,
    experience: row.experience as string,
    role: row.role as string,
  };
}

export function useAppState() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    async function loadAll() {
      const supabase = createClient();
      const [annRes, clRes, projRes, engRes] = await Promise.all([
        supabase.from('announcements').select('*'),
        supabase.from('checklist_items').select('*'),
        supabase.from('projects').select('*').order('rowid' as never),
        supabase.from('engineers').select('*').order('rowid' as never),
      ]);

      const announcements: Record<string, ParsedAnnouncement> = {};
      for (const row of annRes.data ?? []) {
        const ann = rowToAnnouncement(row as Record<string, unknown>);
        announcements[ann.id] = ann;
      }

      const checklists: Record<string, ChecklistItem[]> = {};
      for (const row of clRes.data ?? []) {
        const item = rowToChecklistItem(row as Record<string, unknown>);
        const annId = (row as Record<string, unknown>).announcement_id as string;
        if (!checklists[annId]) checklists[annId] = [];
        checklists[annId].push(item);
      }

      const projects = (projRes.data ?? []).map((r) => rowToProject(r as Record<string, unknown>));
      const engineers = (engRes.data ?? []).map((r) => rowToEngineer(r as Record<string, unknown>));

      setState({ announcements, checklists, form: { projects, engineers } });
      setLoaded(true);
    }

    loadAll().catch(() => setLoaded(true));
  }, []);

  // 공고 추가
  const addAnnouncement = useCallback(
    async (ann: ParsedAnnouncement, items: ChecklistItem[]) => {
      const supabase = createClient();
      await supabase.from('announcements').upsert({
        id: ann.id,
        uploaded_at: ann.uploadedAt,
        file_name: ann.fileName,
        raw_text: ann.rawText,
        title: ann.title,
        agency: ann.agency,
        estimated_price: ann.estimatedPrice,
        service_period: ann.servicePeriod,
        deadline: ann.deadline,
        qualifications: ann.qualifications,
        documents: ann.documents,
        manual_edits: ann.manualEdits,
      });

      if (items.length > 0) {
        await supabase.from('checklist_items').insert(
          items.map((item) => ({
            id: item.id,
            announcement_id: ann.id,
            text: item.text,
            completed: item.completed,
            custom: item.custom,
          })),
        );
      }

      setState((prev) => ({
        ...prev,
        announcements: { ...prev.announcements, [ann.id]: ann },
        checklists: { ...prev.checklists, [ann.id]: items },
      }));
    },
    [],
  );

  // 공고 삭제 (cascade로 checklist_items도 자동 삭제됨)
  const removeAnnouncement = useCallback(async (id: string) => {
    const supabase = createClient();
    await supabase.from('announcements').delete().eq('id', id);

    setState((prev) => {
      const { [id]: _a, ...anns } = prev.announcements;
      const { [id]: _c, ...cls } = prev.checklists;
      return { ...prev, announcements: anns, checklists: cls };
    });
  }, []);

  // 공고 필드 수정
  const editAnnouncement = useCallback(async (id: string, field: string, value: string) => {
    const supabase = createClient();

    setState((prev) => {
      const updated = {
        ...prev.announcements[id],
        manualEdits: { ...prev.announcements[id].manualEdits, [field]: value },
      };
      // DB 업데이트 (비동기, fire-and-forget)
      supabase
        .from('announcements')
        .update({ manual_edits: updated.manualEdits })
        .eq('id', id)
        .then(() => {});
      return {
        ...prev,
        announcements: { ...prev.announcements, [id]: updated },
      };
    });
  }, []);

  // 체크리스트 업데이트
  const updateChecklist = useCallback(async (annId: string, items: ChecklistItem[]) => {
    const supabase = createClient();

    // 기존 항목 삭제 후 재삽입 (가장 단순한 방법)
    await supabase.from('checklist_items').delete().eq('announcement_id', annId);
    if (items.length > 0) {
      await supabase.from('checklist_items').insert(
        items.map((item) => ({
          id: item.id,
          announcement_id: annId,
          text: item.text,
          completed: item.completed,
          custom: item.custom,
        })),
      );
    }

    setState((prev) => ({ ...prev, checklists: { ...prev.checklists, [annId]: items } }));
  }, []);

  // 실적·경력 업데이트
  const updateForm = useCallback(
    async (projects: ProjectRecord[], engineers: Engineer[]) => {
      const supabase = createClient();

      // 전체 교체 방식
      await Promise.all([
        supabase.from('projects').delete().neq('id', ''),
        supabase.from('engineers').delete().neq('id', ''),
      ]);

      if (projects.length > 0) {
        await supabase.from('projects').insert(
          projects.map((p) => ({
            id: p.id,
            service_title: p.serviceTitle,
            agency: p.agency,
            contract_amount: p.contractAmount,
            service_period: p.servicePeriod,
            description: p.description,
          })),
        );
      }
      if (engineers.length > 0) {
        await supabase.from('engineers').insert(
          engineers.map((e) => ({
            id: e.id,
            name: e.name,
            certification: e.certification,
            experience: e.experience,
            role: e.role,
          })),
        );
      }

      setState((prev) => ({ ...prev, form: { projects, engineers } }));
    },
    [],
  );

  // 전체 초기화
  const reset = useCallback(async () => {
    const supabase = createClient();
    await Promise.all([
      supabase.from('announcements').delete().neq('id', ''),
      supabase.from('projects').delete().neq('id', ''),
      supabase.from('engineers').delete().neq('id', ''),
    ]);
    setState(DEFAULT_STATE);
  }, []);

  // page.tsx 하위 호환: setState는 form 업데이트에 여전히 필요
  const setStateCompat = useCallback(
    (updater: AppState | ((prev: AppState) => AppState)) => {
      setState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        return next;
      });
    },
    [],
  );

  return {
    state,
    setState: setStateCompat,
    // 새 API
    addAnnouncement,
    removeAnnouncement,
    editAnnouncement,
    updateChecklist,
    updateForm,
    reset,
    loaded,
  };
}
