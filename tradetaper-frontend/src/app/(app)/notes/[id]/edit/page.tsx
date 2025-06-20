'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  FaArrowLeft, 
  FaSave, 
  FaSpinner,
  FaTags,
  FaEye,
  FaEyeSlash,
  FaPlus,
  FaInfoCircle,
  FaExclamationTriangle,
  FaCheckCircle,
  FaStar,
  FaRegStar
} from 'react-icons/fa';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { NotesService } from '@/services/notesService';
import { Note, NoteBlock } from '@/types/note';
import toast from 'react-hot-toast';

const NoteEditPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const noteId = params?.id as string;
  
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<NoteBlock[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [visibility, setVisibility] = useState<'private' | 'shared'>('private');
  const [isPinned, setIsPinned] = useState(false);

  const fetchNote = async () => {
    if (!noteId) return;
    
    try {
      setLoading(true);
      const noteData = await NotesService.getNote(noteId);
      setNote(noteData);
      setTitle(noteData.title);
      setContent(noteData.content || []);
      setTags(noteData.tags || []);
      setVisibility(noteData.visibility as 'private' | 'shared');
      setIsPinned(noteData.isPinned);
    } catch (error) {
      console.error('Error fetching note:', error);
      toast.error('Failed to load note');
      router.push('/notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (noteId) {
      fetchNote();
    }
  }, [noteId]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter a note title');
      return;
    }

    try {
      setSaving(true);
      const updatedNote = await NotesService.updateNote(noteId, {
        title,
        content,
        tags,
        visibility,
        isPinned
      });
      
      setNote(updatedNote);
      toast.success('Note saved successfully');
      router.push(`/notes/${noteId}`);
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const addBlock = (type: 'text' | 'heading' | 'quote' | 'list' | 'code' | 'image' | 'video' | 'embed' | 'divider' | 'callout' | 'table', afterIndex?: number) => {
    const insertIndex = afterIndex !== undefined ? afterIndex + 1 : content.length;
    
    const newBlock: NoteBlock = {
      id: `block-${Date.now()}-${Math.random()}`,
      type,
      content: getDefaultBlockContent(type),
      position: insertIndex
    };
    
    const updatedContent = [
      ...content.slice(0, insertIndex),
      newBlock,
      ...content.slice(insertIndex).map(block => ({
        ...block,
        position: block.position + 1
      }))
    ];
    
    setContent(updatedContent);
  };

  const getDefaultBlockContent = (type: string) => {
    switch (type) {
      case 'text':
        return { text: '' };
      case 'heading':
        return { text: '', level: 2 };
      case 'quote':
        return { text: '', author: '' };
      case 'code':
        return { code: '', language: 'javascript' };
      case 'callout':
        return { text: '', type: 'info' };
      default:
        return {};
    }
  };

  const updateBlock = (index: number, updatedContent: any) => {
    const updatedBlocks = [...content];
    updatedBlocks[index] = {
      ...updatedBlocks[index],
      content: { ...updatedBlocks[index].content, ...updatedContent }
    };
    setContent(updatedBlocks);
  };

  const deleteBlock = (index: number) => {
    if (content.length === 1) return; // Don't delete the last block
    const updatedBlocks = content.filter((_, i) => i !== index);
    setContent(updatedBlocks);
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
      setShowTagInput(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mb-4 mx-auto" />
          <p className="text-lg font-medium">Loading note editor...</p>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Note not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The note you're trying to edit doesn't exist or has been deleted.
          </p>
          <AnimatedButton
            onClick={() => router.push('/notes')}
            variant="gradient"
          >
            Back to Notes
          </AnimatedButton>
        </div>
      </div>
    );
  }

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
          <button
            onClick={() => setIsPinned(!isPinned)}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 ${
              isPinned 
                ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' 
                : 'text-gray-500 hover:text-yellow-500'
            }`}
          >
            {isPinned ? <FaStar /> : <FaRegStar />}
            <span className="text-sm">{isPinned ? 'Pinned' : 'Pin'}</span>
          </button>

          <button
            onClick={() => setVisibility(visibility === 'private' ? 'shared' : 'private')}
            className="flex items-center gap-2 px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600"
          >
            {visibility === 'shared' ? <FaEye /> : <FaEyeSlash />}
            <span className="text-sm capitalize">{visibility}</span>
          </button>

          <AnimatedButton
            onClick={handleSave}
            variant="gradient"
            className="bg-gradient-to-r from-green-500 to-green-600"
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
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-4xl font-bold bg-transparent border-none outline-none placeholder-gray-400 dark:placeholder-gray-600 mb-8"
        />

        {/* Tags */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {tags.map(tag => (
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
          {content.map((block, index) => (
            <BlockEditor
              key={block.id}
              block={block}
              index={index}
              onUpdate={(updatedContent) => updateBlock(index, updatedContent)}
              onAddBlock={(type) => addBlock(type, index)}
              onDelete={() => deleteBlock(index)}
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
    </div>
  );
};

// Block Editor Component
const BlockEditor: React.FC<{
  block: NoteBlock;
  index: number;
  onUpdate: (content: any) => void;
  onAddBlock: (type: 'text' | 'heading' | 'quote' | 'list' | 'code' | 'image' | 'video' | 'embed' | 'divider' | 'callout' | 'table') => void;
  onDelete: () => void;
}> = ({ block, onUpdate, onAddBlock, onDelete }) => {
  const handleContentChange = (field: string, value: any) => {
    onUpdate({ [field]: value });
  };

  switch (block.type) {
    case 'text':
      return (
        <div className="group relative">
          <textarea
            value={block.content?.text || ''}
            onChange={(e) => handleContentChange('text', e.target.value)}
            placeholder="Type something..."
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
            type="text"
            value={block.content?.text || ''}
            onChange={(e) => handleContentChange('text', e.target.value)}
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
            value={block.content?.text || ''}
            onChange={(e) => handleContentChange('text', e.target.value)}
            placeholder="Quote..."
            className="w-full bg-transparent border-none outline-none resize-none italic text-gray-600 dark:text-gray-400 placeholder-gray-400"
            rows={1}
          />
          <input
            type="text"
            value={block.content?.author || ''}
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
            value={block.content?.language || 'javascript'}
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
            value={block.content?.code || ''}
            onChange={(e) => handleContentChange('code', e.target.value)}
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
            {calloutIcons[block.content?.type as keyof typeof calloutIcons]}
            <select
              value={block.content?.type || 'info'}
              onChange={(e) => handleContentChange('type', e.target.value)}
              className="text-sm bg-transparent border-none outline-none"
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="success">Success</option>
            </select>
          </div>
          <textarea
            value={block.content?.text || ''}
            onChange={(e) => handleContentChange('text', e.target.value)}
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
  onAddBlock: (type: 'text' | 'heading' | 'quote' | 'list' | 'code' | 'image' | 'video' | 'embed' | 'divider' | 'callout' | 'table') => void;
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

export default NoteEditPage; 