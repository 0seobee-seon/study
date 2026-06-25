'use client';

import { useRef, useState, DragEvent } from 'react';
import type { ParsedAnnouncement } from '@/types';
import { parseText } from '@/lib/parser';

// pdfjs는 이 파일이 next/dynamic(ssr:false)로 로드될 때만 실행되므로 top-level import 가능
import * as pdfjs from 'pdfjs-dist';
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface Props {
  onParsed: (announcement: ParsedAnnouncement) => void;
  compact?: boolean;
}

async function extractText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it) => (it as { str: string }).str).join(' ') + '\n';
  }
  return text;
}

export default function PDFUploader({ onParsed, compact = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('PDF 파일만 업로드할 수 있습니다.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const text = await extractText(file);
      const id = crypto.randomUUID();
      const parsed = parseText(text, id, file.name);
      onParsed(parsed);
    } catch (e) {
      console.error('[PDFUploader]', e);
      setError(`PDF 읽기에 실패했습니다: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  if (compact) {
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed px-5 py-4 flex items-center gap-3 transition-colors ${
          dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
        }`}
      >
        <input ref={inputRef} type="file" accept=".pdf" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        <span className="text-xl">📄</span>
        {loading ? (
          <p className="text-sm text-blue-600 font-medium animate-pulse">PDF 분석 중...</p>
        ) : (
          <div>
            <p className="text-sm font-medium text-gray-700">공고 PDF 드래그 또는 클릭하여 업로드</p>
            {error && <p className="text-xs text-red-500 mt-0.5 break-all">{error}</p>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
        dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      {loading ? (
        <p className="text-blue-600 font-medium animate-pulse">PDF 분석 중...</p>
      ) : (
        <>
          <p className="text-3xl mb-2">📄</p>
          <p className="font-semibold text-gray-700">공고 PDF를 여기에 드래그하거나 클릭해서 업로드</p>
          <p className="text-sm text-gray-400 mt-1">나라장터 입찰 공고 PDF 지원</p>
        </>
      )}
      {error && <p className="mt-3 text-red-500 text-sm break-all">{error}</p>}
    </div>
  );
}
