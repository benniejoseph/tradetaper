'use client';

import { useState } from 'react';
import { Upload, FileText, CircleCheck, CircleAlert, LoaderCircle } from 'lucide-react';

export default function KnowledgeUploader() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleIngest = async () => {
    if (!title || !content) {
      setMessage('Please provide both title and content.');
      setStatus('error');
      return;
    }

    setStatus('uploading');
    setMessage('');

    try {
      const token = localStorage.getItem('token'); // Assuming JWT auth
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/agents/mentor/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content,
          type: 'transcript',
        }),
      });

      if (!res.ok) throw new Error('Ingestion failed');

      setStatus('success');
      setTitle('');
      setContent('');
      setMessage('Knowledge ingested successfully! The mentor is now smarter.');
      
      // Reset after 3s
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 3000);

    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setMessage(err.message || 'Failed to upload knowledge.');
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Upload className="w-5 h-5 text-emerald-400" />
        <h2 className="text-lg font-semibold text-white">Train Mentor</h2>
      </div>
      
      <p className="text-zinc-400 text-sm mb-6">
        Paste transcripts or notes here to add to the Mentor's knowledge base.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Title / Source Name</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 2022 Mentorship Ep. 4"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Content / Transcript</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste text content here..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white h-40 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
            status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 
            status === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-zinc-800 text-zinc-300'
          }`}>
            {status === 'success' && <CircleCheck className="w-4 h-4" />}
            {status === 'error' && <CircleAlert className="w-4 h-4" />}
            {status === 'uploading' && <LoaderCircle className="w-4 h-4 animate-spin" />}
            {message}
          </div>
        )}

        <button
          onClick={handleIngest}
          disabled={status === 'uploading'}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {status === 'uploading' ? (
            <>Ingesting...</>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Ingest Knowledge
            </>
          )}
        </button>
      </div>
    </div>
  );
}
