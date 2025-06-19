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
  FaCheckCircle
} from 'react-icons/fa';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { notesService } from '@/services/notesService';
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

      // Import and use the notes service
      const savedNote = await notesService.createNote(noteData);
      
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
  }, [note.title, note.content, note.tags, note.visibility, note.accountId, note.tradeId, router]);

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
    <div className="max-w-4xl mx-auto space-y-6">
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
        <div className="space-y-2">
          {note.content.map((block) => (
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
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => addBlock('text')}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors"
          >
            <FaPlus />
            <span>Add a block</span>
          </button>
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
  );
};

// Block Editor Component
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

// Block Menu Component
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
    { type: 'text' as const, icon: <FaCode />, label: 'Text' },
    { type: 'heading' as const, icon: <FaCode />, label: 'Heading' },
    { type: 'quote' as const, icon: <FaQuoteLeft />, label: 'Quote' },
    { type: 'code' as const, icon: <FaCode />, label: 'Code' },
    { type: 'callout' as const, icon: <FaInfoCircle />, label: 'Callout' },
  ];

  return (
    <div
      className="block-menu fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-[200px]"
      style={{ left: x, top: y }}
    >
      {menuItems.map((item) => (
        <button
          key={item.type}
          onClick={() => onSelect(item.type)}
          className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default NewNotePage; 