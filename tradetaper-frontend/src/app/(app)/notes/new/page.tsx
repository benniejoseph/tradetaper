'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FaSave, 
  FaSpinner, 
  FaTags, 
  FaBold, 
  FaItalic, 
  FaUnderline, 
  FaCode,
  FaQuoteLeft,
  FaHeading,
  FaArrowLeft,
  FaEye,
  FaEyeSlash,
  FaPlus,
  FaInfoCircle,
  FaExclamationTriangle,
  FaCheckCircle,
  FaImage,
  FaVideo,
  FaLink,
  FaListUl,
  FaTable,
  FaMinus
} from 'react-icons/fa';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { NotesService } from '@/services/notesService';
import { Note as NoteType, NoteBlock } from '@/types/note';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useDebounce } from '@/hooks/useDebounce';

interface Block {
  id: string;
  type: 'text' | 'heading' | 'quote' | 'list' | 'code' | 'image' | 'video' | 'embed' | 'divider' | 'callout' | 'table';
  content: any;
  position: number;
}

interface Note {
  title: string;
  content: Block[];
  tags: string[];
  visibility: 'private' | 'shared';
  accountId?: string;
  tradeId?: string;
}

// Helper functions defined outside component to avoid initialization issues
function getDefaultContent(type: Block['type']) {
  switch (type) {
    case 'text':
    case 'heading':
      return { text: '' };
    case 'quote':
      return { text: '', author: '' };
    case 'list':
      return { items: [''], ordered: false };
    case 'code':
      return { code: '', language: 'javascript' };
    case 'image':
      return { url: '', caption: '', alt: '' };
    case 'video':
      return { url: '', caption: '' };
    case 'embed':
      return { url: '', title: '', description: '' };
    case 'callout':
      return { text: '', type: 'info', icon: 'info' };
    case 'table':
      return { 
        headers: ['Column 1', 'Column 2'],
        rows: [['', ''], ['', '']]
      };
    case 'divider':
      return {};
    default:
      return { text: '' };
  }
}

function createEmptyBlock(type: Block['type'], position: number): Block {
  return {
    id: `block-${Date.now()}-${Math.random()}`,
    type,
    content: getDefaultContent(type),
    position,
  };
}

function getBlockText(block: Block): string {
  switch (block.type) {
    case 'text':
    case 'heading':
      return block.content.text || '';
    case 'quote':
      return block.content.text || '';
    case 'code':
      return block.content.code || '';
    case 'callout':
      return block.content.text || '';
    default:
      return '';
  }
}

const NewNotePage: React.FC = () => {
  const router = useRouter();
  const [note, setNote] = useState<Note>({
    title: '',
    content: [createEmptyBlock('text', 0)],
    tags: [],
    visibility: 'private',
  });
  
  const [saving, setSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showBlockMenu, setShowBlockMenu] = useState<{ blockId: string; x: number; y: number } | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null); // Track if note has been saved
  
  const autoSaveTimer = useRef<NodeJS.Timeout>();
  const debouncedNote = useDebounce(note, 2000);

  // Save note - wrapped in useCallback to prevent recreation on every render
  const handleSave = useCallback(async (isAutoSave = false) => {
    if (!note.title && !note.content.some(block => getBlockText(block))) {
      return; // Don't save empty notes
    }

    try {
      setSaving(true);
      
      // Use the notes service
      const noteData = {
        title: note.title,
        content: note.content,
        tags: note.tags,
        visibility: note.visibility,
        accountId: note.accountId,
        tradeId: note.tradeId,
      };

      let savedNote;
      
      if (savedNoteId) {
        // Update existing note
        savedNote = await NotesService.updateNote(savedNoteId, noteData);
      } else {
        // Create new note
        savedNote = await NotesService.createNote(noteData);
        setSavedNoteId(savedNote.id);
      }
      
      if (!isAutoSave) {
        toast.success('Note saved successfully!');
        router.push(`/notes/${savedNote.id}`);
      }
    } catch (error) {
      console.error('Error saving note:', error);
      if (!isAutoSave) {
        toast.error('Failed to save note. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  }, [note.title, note.content, note.tags, note.visibility, note.accountId, note.tradeId, router, savedNoteId]);

  // Auto-save functionality
  useEffect(() => {
    if (debouncedNote.title || debouncedNote.content.some(block => getBlockText(block))) {
      handleSave(true); // Auto-save
    }
  }, [debouncedNote, handleSave]);

  // Handle block content change
  const updateBlock = (blockId: string, newContent: any) => {
    setNote(prev => ({
      ...prev,
      content: prev.content.map(block => 
        block.id === blockId 
          ? { ...block, content: { ...block.content, ...newContent } }
          : block
      )
    }));
  };

  // Add new block
  const addBlock = (type: Block['type'], afterBlockId?: string) => {
    const afterIndex = afterBlockId 
      ? note.content.findIndex(block => block.id === afterBlockId)
      : note.content.length - 1;
    
    const newBlock = createEmptyBlock(type, afterIndex + 1);
    
    setNote(prev => ({
      ...prev,
      content: [
        ...prev.content.slice(0, afterIndex + 1),
        newBlock,
        ...prev.content.slice(afterIndex + 1).map(block => ({
          ...block,
          position: block.position + 1
        }))
      ]
    }));

    setShowBlockMenu(null);
    
    // Focus the new block
    setTimeout(() => {
      const element = document.getElementById(`block-${newBlock.id}`);
      if (element) element.focus();
    }, 100);
  };

  // Delete block
  const deleteBlock = (blockId: string) => {
    if (note.content.length === 1) return; // Don't delete last block
    
    setNote(prev => ({
      ...prev,
      content: prev.content.filter(block => block.id !== blockId)
    }));
  };

  // Handle key down events
  const handleKeyDown = (e: React.KeyboardEvent, blockId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addBlock('text', blockId);
    } else if (e.key === 'Backspace') {
      const block = note.content.find(b => b.id === blockId);
      if (block && !getBlockText(block) && note.content.length > 1) {
        e.preventDefault();
        deleteBlock(blockId);
      }
    } else if (e.key === '/' && e.target instanceof HTMLElement) {
      const text = e.target.textContent || '';
      if (text === '') {
        e.preventDefault();
        const rect = e.target.getBoundingClientRect();
        setShowBlockMenu({
          blockId,
          x: rect.left,
          y: rect.bottom + window.scrollY
        });
      }
    }
  };

  // Add tag
  const addTag = () => {
    if (tagInput.trim() && !note.tags.includes(tagInput.trim())) {
      setNote(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setNote(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-4xl mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <AnimatedButton
            onClick={() => router.back()}
            variant="ghost"
            icon={<FaArrowLeft />}
            iconPosition="left"
          >
            Back
          </AnimatedButton>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setNote(prev => ({ 
                  ...prev, 
                  visibility: prev.visibility === 'private' ? 'shared' : 'private' 
                }))}
                className="flex items-center gap-2 px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600"
              >
                {note.visibility === 'private' ? <FaEyeSlash /> : <FaEye />}
                <span className="text-sm capitalize">{note.visibility}</span>
              </button>
            </div>

            <AnimatedButton
              onClick={() => handleSave(false)}
              variant="gradient"
              className="bg-gradient-to-r from-blue-500 to-purple-500"
              icon={saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
              iconPosition="left"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Note'}
            </AnimatedButton>
          </div>
        </div>

        {/* Main Editor */}
        <AnimatedCard variant="glass" className="p-8">
          {/* Title */}
          <input
            type="text"
            placeholder="Untitled note"
            value={note.title}
            onChange={(e) => setNote(prev => ({ ...prev, title: e.target.value }))}
            className="w-full text-4xl font-bold bg-transparent border-none outline-none placeholder-gray-400 dark:placeholder-gray-600 mb-8"
          />

          {/* Tags */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {note.tags.map(tag => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    ×
                  </button>
                </span>
              ))}
              
              {showTagInput ? (
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    } else if (e.key === 'Escape') {
                      setShowTagInput(false);
                      setTagInput('');
                    }
                  }}
                  onBlur={() => {
                    if (tagInput.trim()) addTag();
                    setShowTagInput(false);
                  }}
                  placeholder="Add tag..."
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => setShowTagInput(true)}
                  className="flex items-center gap-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-full text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500"
                >
                  <FaTags />
                  Add tag
                </button>
              )}
            </div>
          </div>

          {/* Content Blocks */}
          <div className="space-y-4 min-h-[200px]">
            {note.content.map((block, index) => (
              <BlockEditor
                key={block.id}
                block={block}
                onUpdate={(content) => updateBlock(block.id, content)}
                onKeyDown={(e) => handleKeyDown(e, block.id)}
                onAddBlock={(type) => addBlock(type, block.id)}
                onDelete={() => deleteBlock(block.id)}
              />
            ))}
          </div>

          {/* Add Block Button */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => addBlock('text')}
                className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-300"
              >
                <FaPlus />
                <span className="font-medium">Add a block</span>
              </button>
              
              {/* Quick Block Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => addBlock('image')}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                  title="Add Image"
                >
                  <FaImage />
                  <span className="hidden sm:inline">Image</span>
                </button>
                <button
                  onClick={() => addBlock('video')}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors"
                  title="Add Video"
                >
                  <FaVideo />
                  <span className="hidden sm:inline">Video</span>
                </button>
                <button
                  onClick={() => addBlock('table')}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-md transition-colors"
                  title="Add Table"
                >
                  <FaTable />
                  <span className="hidden sm:inline">Table</span>
                </button>
                <button
                  onClick={() => addBlock('list')}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                  title="Add List"
                >
                  <FaListUl />
                  <span className="hidden sm:inline">List</span>
                </button>
              </div>
            </div>

            {/* Debug Info */}
            <div className="mt-4 text-center text-xs text-gray-500">
              Current blocks: {note.content.length} | 
              Block types: {note.content.map(block => block.type).join(', ')}
            </div>
          </div>
        </AnimatedCard>

        {/* Block Menu */}
        {showBlockMenu && (
          <BlockMenu
            x={showBlockMenu.x}
            y={showBlockMenu.y}
            onSelect={(type) => addBlock(type, showBlockMenu.blockId)}
            onClose={() => setShowBlockMenu(null)}
          />
        )}
      </div>
    </div>
  );
};

// Block Editor Component - Enhanced with all block types
const BlockEditor: React.FC<{
  block: Block;
  onUpdate: (content: any) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onAddBlock: (type: Block['type']) => void;
  onDelete: () => void;
}> = ({ block, onUpdate, onKeyDown, onAddBlock, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleContentChange = (field: string, value: any) => {
    onUpdate({ [field]: value });
  };

  switch (block.type) {
    case 'text':
      return (
        <div className="group relative">
          <textarea
            id={`block-${block.id}`}
            value={block.content.text || ''}
            onChange={(e) => handleContentChange('text', e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type '/' for commands..."
            className="w-full bg-transparent border-none outline-none resize-none min-h-[1.5rem] text-gray-800 dark:text-gray-200 placeholder-gray-400"
            rows={1}
            style={{ height: 'auto' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            }}
          />
          <BlockControls onAddBlock={onAddBlock} onDelete={onDelete} />
        </div>
      );

    case 'heading':
      return (
        <div className="group relative">
          <input
            id={`block-${block.id}`}
            type="text"
            value={block.content.text || ''}
            onChange={(e) => handleContentChange('text', e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Heading"
            className="w-full bg-transparent border-none outline-none text-2xl font-bold text-gray-800 dark:text-gray-200 placeholder-gray-400"
          />
          <BlockControls onAddBlock={onAddBlock} onDelete={onDelete} />
        </div>
      );

    case 'quote':
      return (
        <div className="group relative border-l-4 border-gray-300 dark:border-gray-600 pl-4">
          <textarea
            id={`block-${block.id}`}
            value={block.content.text || ''}
            onChange={(e) => handleContentChange('text', e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Quote..."
            className="w-full bg-transparent border-none outline-none resize-none italic text-gray-600 dark:text-gray-400 placeholder-gray-400"
            rows={1}
          />
          <input
            type="text"
            value={block.content.author || ''}
            onChange={(e) => handleContentChange('author', e.target.value)}
            placeholder="Author (optional)"
            className="w-full bg-transparent border-none outline-none text-sm text-gray-500 dark:text-gray-500 placeholder-gray-400 mt-1"
          />
          <BlockControls onAddBlock={onAddBlock} onDelete={onDelete} />
        </div>
      );

    case 'list':
      return (
        <div className="group relative">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => handleContentChange('ordered', !block.content?.ordered)}
              className="text-sm px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded"
            >
              {block.content?.ordered ? 'Numbered' : 'Bulleted'}
            </button>
          </div>
          <div className="space-y-1">
            {(block.content?.items || ['']).map((item: string, i: number) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-gray-400 pt-1">
                  {block.content?.ordered ? `${i + 1}.` : '•'}
                </span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const newItems = [...(block.content?.items || [''])];
                    newItems[i] = e.target.value;
                    handleContentChange('items', newItems);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const newItems = [...(block.content?.items || [''])];
                      newItems.splice(i + 1, 0, '');
                      handleContentChange('items', newItems);
                    } else if (e.key === 'Backspace' && !item && (block.content?.items?.length || 0) > 1) {
                      e.preventDefault();
                      const newItems = [...(block.content?.items || [''])];
                      newItems.splice(i, 1);
                      handleContentChange('items', newItems);
                    }
                  }}
                  placeholder="List item..."
                  className="flex-1 bg-transparent border-none outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400"
                />
              </div>
            ))}
          </div>
          <BlockControls onAddBlock={onAddBlock} onDelete={onDelete} />
        </div>
      );

    case 'code':
      return (
        <div className="group relative bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <select
            value={block.content.language || 'javascript'}
            onChange={(e) => handleContentChange('language', e.target.value)}
            className="mb-2 text-xs bg-transparent border-none outline-none text-gray-500"
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="json">JSON</option>
            <option value="sql">SQL</option>
            <option value="bash">Bash</option>
          </select>
          <textarea
            id={`block-${block.id}`}
            value={block.content.code || ''}
            onChange={(e) => handleContentChange('code', e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Enter code..."
            className="w-full bg-transparent border-none outline-none resize-none font-mono text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400"
            rows={3}
          />
          <BlockControls onAddBlock={onAddBlock} onDelete={onDelete} />
        </div>
      );

    case 'image':
      return (
        <div className="group relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
          <div className="text-center">
            <FaImage className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4 space-y-2">
              {/* File Upload */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Check file size (max 10MB)
                      if (file.size > 10 * 1024 * 1024) {
                        toast.error('File size must be less than 10MB');
                        return;
                      }
                      
                      // Show loading state
                      handleContentChange('uploading', true);
                      toast.loading('Uploading image...', { id: 'upload-' + block.id });
                      
                      try {
                        // Ensure note is saved first to get an ID for media upload
                        let currentNoteId = savedNoteId;
                        if (!currentNoteId && (note.title || note.content.some(block => getBlockText(block)))) {
                          const savedNote = await NotesService.createNote({
                            title: note.title || 'Untitled note',
                            content: note.content,
                            tags: note.tags,
                            visibility: note.visibility,
                            accountId: note.accountId,
                            tradeId: note.tradeId,
                          });
                          currentNoteId = savedNote.id;
                          setSavedNoteId(savedNote.id);
                        }

                        if (!currentNoteId) {
                          throw new Error('Unable to save note for media upload');
                        }

                        const uploadResult = await NotesService.uploadMedia(file, currentNoteId);
                        handleContentChange('url', uploadResult.url);
                        handleContentChange('filename', uploadResult.filename);
                        handleContentChange('uploading', false);
                        toast.success('Image uploaded successfully', { id: 'upload-' + block.id });
                      } catch (error: any) {
                        console.error('Failed to upload image:', error);
                        handleContentChange('uploading', false);
                        // Try simple URL approach as fallback
                        if (error?.response?.status === 400) {
                          toast.error('Please save your note first, then try uploading the image', { id: 'upload-' + block.id });
                        } else {
                          toast.error(error?.response?.data?.message || 'Failed to upload image. You can paste image URL instead.', { id: 'upload-' + block.id });
                        }
                      }
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id={`file-upload-${block.id}`}
                  disabled={block.content?.uploading}
                />
                <label
                  htmlFor={`file-upload-${block.id}`}
                  className={`w-full py-2 px-4 rounded-lg cursor-pointer transition-colors inline-block text-center ${
                    block.content?.uploading 
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {block.content?.uploading ? (
                    <div className="flex items-center justify-center gap-2">
                      <FaSpinner className="animate-spin" />
                      Uploading...
                    </div>
                  ) : (
                    'Upload Image'
                  )}
                </label>
              </div>
              
              <div className="text-sm text-gray-500">or</div>
              
              <input
                type="text"
                value={block.content?.url || ''}
                onChange={(e) => handleContentChange('url', e.target.value)}
                placeholder="Paste image URL..."
                className="w-full bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                disabled={block.content?.uploading}
              />
              <input
                type="text"
                value={block.content?.caption || ''}
                onChange={(e) => handleContentChange('caption', e.target.value)}
                placeholder="Caption (optional)"
                className="w-full bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={block.content?.alt || ''}
                onChange={(e) => handleContentChange('alt', e.target.value)}
                placeholder="Alt text (optional)"
                className="w-full bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {block.content?.url && !block.content?.uploading && (
              <div className="mt-4">
                <img 
                  src={block.content.url} 
                  alt={block.content.alt || 'Image'} 
                  className="max-w-full h-auto rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    toast.error('Failed to load image');
                  }}
                />
                {block.content.caption && (
                  <p className="text-sm text-gray-500 mt-2 italic">{block.content.caption}</p>
                )}
              </div>
            )}
          </div>
          <BlockControls onAddBlock={onAddBlock} onDelete={onDelete} />
        </div>
      );

    case 'video':
      const getVideoEmbedUrl = (url: string) => {
        // Convert YouTube URLs to embed format
        if (url.includes('youtube.com/watch?v=')) {
          const videoId = url.split('v=')[1]?.split('&')[0];
          return `https://www.youtube.com/embed/${videoId}`;
        }
        if (url.includes('youtu.be/')) {
          const videoId = url.split('youtu.be/')[1]?.split('?')[0];
          return `https://www.youtube.com/embed/${videoId}`;
        }
        // Convert Vimeo URLs to embed format
        if (url.includes('vimeo.com/')) {
          const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
          return `https://player.vimeo.com/video/${videoId}`;
        }
        return url;
      };

      return (
        <div className="group relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
          <div className="text-center">
            <FaVideo className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4 space-y-2">
              <input
                type="text"
                value={block.content?.url || ''}
                onChange={(e) => handleContentChange('url', e.target.value)}
                placeholder="Video URL (YouTube, Vimeo, etc.)"
                className="w-full bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={block.content?.caption || ''}
                onChange={(e) => handleContentChange('caption', e.target.value)}
                placeholder="Caption (optional)"
                className="w-full bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {block.content?.url && (
              <div className="mt-4">
                <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <iframe
                    src={getVideoEmbedUrl(block.content.url)}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Video embed"
                  />
                </div>
                {block.content.caption && (
                  <p className="text-sm text-gray-500 mt-2 italic">{block.content.caption}</p>
                )}
              </div>
            )}
          </div>
          <BlockControls onAddBlock={onAddBlock} onDelete={onDelete} />
        </div>
      );

    case 'embed':
      return (
        <div className="group relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
          <div className="text-center">
            <FaLink className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4 space-y-2">
              <input
                type="text"
                value={block.content?.url || ''}
                onChange={(e) => handleContentChange('url', e.target.value)}
                placeholder="URL to embed"
                className="w-full bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={block.content?.title || ''}
                onChange={(e) => handleContentChange('title', e.target.value)}
                placeholder="Title (optional)"
                className="w-full bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                value={block.content?.description || ''}
                onChange={(e) => handleContentChange('description', e.target.value)}
                placeholder="Description (optional)"
                className="w-full bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
              />
            </div>
            {block.content?.url && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-left">
                  {block.content.title && (
                    <h4 className="font-medium text-gray-900 dark:text-white">{block.content.title}</h4>
                  )}
                  <p className="text-sm text-blue-500 break-all">{block.content.url}</p>
                  {block.content.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{block.content.description}</p>
                  )}
                </div>
              </div>
            )}
          </div>
          <BlockControls onAddBlock={onAddBlock} onDelete={onDelete} />
        </div>
      );

    case 'table':
      return (
        <div className="group relative">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
              <thead>
                <tr>
                  {(block.content?.headers || []).map((header: string, i: number) => (
                    <th key={i} className="border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-2">
                      <input
                        type="text"
                        value={header}
                        onChange={(e) => {
                          const newHeaders = [...(block.content?.headers || [])];
                          newHeaders[i] = e.target.value;
                          handleContentChange('headers', newHeaders);
                        }}
                        className="w-full bg-transparent border-none outline-none text-sm font-medium"
                        placeholder={`Header ${i + 1}`}
                      />
                    </th>
                  ))}
                  <th className="border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-2 w-10">
                    <button
                      onClick={() => {
                        const newHeaders = [...(block.content?.headers || []), ''];
                        const newRows = (block.content?.rows || []).map((row: string[]) => [...row, '']);
                        handleContentChange('headers', newHeaders);
                        handleContentChange('rows', newRows);
                      }}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <FaPlus size={12} />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {(block.content?.rows || []).map((row: string[], rowIndex: number) => (
                  <tr key={rowIndex}>
                    {row.map((cell: string, cellIndex: number) => (
                      <td key={cellIndex} className="border border-gray-300 dark:border-gray-600 p-2">
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) => {
                            const newRows = [...(block.content?.rows || [])];
                            newRows[rowIndex][cellIndex] = e.target.value;
                            handleContentChange('rows', newRows);
                          }}
                          className="w-full bg-transparent border-none outline-none text-sm"
                          placeholder={`Cell ${rowIndex + 1}-${cellIndex + 1}`}
                        />
                      </td>
                    ))}
                    <td className="border border-gray-300 dark:border-gray-600 p-2 w-10">
                      <button
                        onClick={() => {
                          const newRows = (block.content?.rows || []).filter((_: any, i: number) => i !== rowIndex);
                          handleContentChange('rows', newRows);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={(block.content?.headers?.length || 0) + 1} className="border border-gray-300 dark:border-gray-600 p-2 text-center">
                    <button
                      onClick={() => {
                        const newRow = new Array(block.content?.headers?.length || 2).fill('');
                        const newRows = [...(block.content?.rows || []), newRow];
                        handleContentChange('rows', newRows);
                      }}
                      className="text-blue-500 hover:text-blue-700 text-sm"
                    >
                      <FaPlus className="inline mr-1" size={12} />
                      Add Row
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <BlockControls onAddBlock={onAddBlock} onDelete={onDelete} />
        </div>
      );

    case 'divider':
      return (
        <div className="group relative py-4">
          <hr className="border-gray-300 dark:border-gray-600" />
          <BlockControls onAddBlock={onAddBlock} onDelete={onDelete} />
        </div>
      );

    case 'callout':
      const calloutIcons = {
        info: <FaInfoCircle className="text-blue-500" />,
        warning: <FaExclamationTriangle className="text-yellow-500" />,
        success: <FaCheckCircle className="text-green-500" />,
      };

      return (
        <div className="group relative bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            {calloutIcons[block.content.type as keyof typeof calloutIcons]}
            <select
              value={block.content.type || 'info'}
              onChange={(e) => handleContentChange('type', e.target.value)}
              className="text-sm bg-transparent border-none outline-none"
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="success">Success</option>
            </select>
          </div>
          <textarea
            id={`block-${block.id}`}
            value={block.content.text || ''}
            onChange={(e) => handleContentChange('text', e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Callout text..."
            className="w-full bg-transparent border-none outline-none resize-none text-gray-800 dark:text-gray-200 placeholder-gray-400"
            rows={1}
          />
          <BlockControls onAddBlock={onAddBlock} onDelete={onDelete} />
        </div>
      );

    default:
      return (
        <div className="group relative">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500">
            Unsupported block type: {block.type}
          </div>
          <BlockControls onAddBlock={onAddBlock} onDelete={onDelete} />
        </div>
      );
  }
};

// Block Controls Component
const BlockControls: React.FC<{
  onAddBlock: (type: Block['type']) => void;
  onDelete: () => void;
}> = ({ onAddBlock, onDelete }) => (
  <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
    <button
      onClick={() => onAddBlock('text')}
      className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
      title="Add block"
    >
      <FaPlus size={12} />
    </button>
    <button
      onClick={onDelete}
      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
      title="Delete block"
    >
      ×
    </button>
  </div>
);

// Enhanced Block Menu Component with all 11 block types
const BlockMenu: React.FC<{
  x: number;
  y: number;
  onSelect: (type: Block['type']) => void;
  onClose: () => void;
}> = ({ x, y, onSelect, onClose }) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.block-menu')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const menuItems = [
    { type: 'text' as const, icon: <span className="text-lg">📝</span>, label: 'Text', description: 'Simple text block' },
    { type: 'heading' as const, icon: <FaHeading className="text-gray-600" />, label: 'Heading', description: 'Section heading' },
    { type: 'quote' as const, icon: <FaQuoteLeft className="text-gray-600" />, label: 'Quote', description: 'Quote with attribution' },
    { type: 'list' as const, icon: <FaListUl className="text-gray-600" />, label: 'List', description: 'Bulleted or numbered list' },
    { type: 'code' as const, icon: <FaCode className="text-gray-600" />, label: 'Code', description: 'Code block with syntax highlighting' },
    { type: 'image' as const, icon: <FaImage className="text-blue-500" />, label: 'Image', description: 'Upload or embed an image' },
    { type: 'video' as const, icon: <FaVideo className="text-purple-500" />, label: 'Video', description: 'Embed a video' },
    { type: 'embed' as const, icon: <FaLink className="text-green-500" />, label: 'Embed', description: 'Embed external content' },
    { type: 'table' as const, icon: <FaTable className="text-orange-500" />, label: 'Table', description: 'Structured data table' },
    { type: 'divider' as const, icon: <FaMinus className="text-gray-400" />, label: 'Divider', description: 'Visual separator' },
    { type: 'callout' as const, icon: <FaInfoCircle className="text-blue-500" />, label: 'Callout', description: 'Important information box' },
  ];

  // Calculate proper positioning to prevent overflow
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState({ x, y });

  useEffect(() => {
    if (menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let adjustedX = x;
      let adjustedY = y;
      
      // Prevent horizontal overflow
      if (x + menuRect.width > viewportWidth - 20) {
        adjustedX = viewportWidth - menuRect.width - 20;
      }
      
      // Prevent vertical overflow
      if (y + menuRect.height > viewportHeight - 20) {
        adjustedY = y - menuRect.height - 10;
      }
      
      setAdjustedPosition({ x: adjustedX, y: adjustedY });
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="block-menu fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-[250px] max-w-[280px]"
      style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
    >
      <div className="p-2 max-h-[400px] overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.type}
            onClick={() => onSelect(item.type)}
            className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 dark:text-white">{item.label}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{item.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default NewNotePage; 