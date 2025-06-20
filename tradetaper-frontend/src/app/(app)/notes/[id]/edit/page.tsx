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
  FaRegStar,
  FaImage,
  FaVideo,
  FaLink,
  FaListUl,
  FaListOl,
  FaTable,
  FaMinus,
  FaCode,
  FaQuoteLeft,
  FaHeading,
  FaTimes,
  FaUpload,
  FaPlay
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
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<NoteBlock[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [visibility, setVisibility] = useState<'private' | 'shared'>('private');
  const [isPinned, setIsPinned] = useState(false);
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [blockMenuPosition, setBlockMenuPosition] = useState<{ top: number; left: number } | null>(null);

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
    setShowBlockMenu(false);
  };

  const getDefaultBlockContent = (type: string) => {
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
        return { text: '', type: 'info' };
      case 'table':
        return { 
          headers: ['Column 1', 'Column 2'],
          rows: [['', ''], ['', '']]
        };
      case 'divider':
        return {};
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

  const handleImageUpload = async (file: File, blockIndex: number) => {
    try {
      setUploading(true);
      // Upload the image and get the URL
      const { url } = await NotesService.uploadMedia(file, noteId);
      
      // Update the block with the uploaded image URL
      updateBlock(blockIndex, { url });
      
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const convertVideoUrl = (url: string): string => {
    // Convert YouTube watch URLs to embed URLs
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Convert Vimeo URLs to embed URLs
    if (url.includes('vimeo.com/') && !url.includes('/embed/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('/')[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    
    return url;
  };

  const handleBlockMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const menuHeight = 400; // Approximate menu height
    
    // Calculate position to prevent overflow
    const top = rect.bottom + menuHeight > viewportHeight 
      ? rect.top - menuHeight 
      : rect.bottom;
    
    setBlockMenuPosition({
      top: top + window.scrollY,
      left: rect.left
    });
    setShowBlockMenu(true);
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Note not found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The note you're looking for doesn't exist or has been deleted.</p>
          <AnimatedButton onClick={() => router.push('/notes')}>
            <FaArrowLeft className="mr-2" />
            Back to Notes
          </AnimatedButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 p-4">
      <div className="max-w-4xl mx-auto">
        <AnimatedCard className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 border border-white/20 shadow-xl">
          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <AnimatedButton 
                  onClick={() => router.push(`/notes/${noteId}`)}
                  className="bg-gray-100/50 hover:bg-gray-200/50 text-gray-600 dark:bg-gray-700/50 dark:hover:bg-gray-600/50 dark:text-gray-300"
                >
                  <FaArrowLeft />
                </AnimatedButton>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Note</h1>
              </div>
              
              <div className="flex items-center gap-3">
                <AnimatedButton
                  onClick={() => setIsPinned(!isPinned)}
                  className={`${
                    isPinned 
                      ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                      : 'bg-gray-100/50 text-gray-600 hover:bg-gray-200/50'
                  } dark:bg-gray-700/50 dark:hover:bg-gray-600/50 dark:text-gray-300`}
                >
                  {isPinned ? <FaStar /> : <FaRegStar />}
                </AnimatedButton>
                
                <AnimatedButton
                  onClick={() => setVisibility(visibility === 'private' ? 'shared' : 'private')}
                  className="bg-gray-100/50 hover:bg-gray-200/50 text-gray-600 dark:bg-gray-700/50 dark:hover:bg-gray-600/50 dark:text-gray-300"
                >
                  {visibility === 'private' ? <FaEyeSlash /> : <FaEye />}
                </AnimatedButton>
                
                <AnimatedButton
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
                >
                  {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                  {saving ? 'Saving...' : 'Save'}
                </AnimatedButton>
              </div>
            </div>

            {/* Title Input */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title..."
              className="w-full text-4xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 mb-6"
              autoFocus
            />

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-8">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full"
                >
                  #{tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                  >
                    <FaTimes className="w-3 h-3" />
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
                    else setShowTagInput(false);
                  }}
                  placeholder="Add tag..."
                  className="px-3 py-1 text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded-full outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => setShowTagInput(true)}
                  className="inline-flex items-center gap-1 px-3 py-1 text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-full hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <FaTags className="w-3 h-3" />
                  Add tag
                </button>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-2 mb-6 p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg">
              <button
                onClick={() => addBlock('image')}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                <FaImage className="w-4 h-4" />
                Image
              </button>
              <button
                onClick={() => addBlock('video')}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
              >
                <FaVideo className="w-4 h-4" />
                Video
              </button>
              <button
                onClick={() => addBlock('table')}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
              >
                <FaTable className="w-4 h-4" />
                Table
              </button>
              <button
                onClick={() => addBlock('list')}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
              >
                <FaListUl className="w-4 h-4" />
                List
              </button>
            </div>

            {/* Content Blocks */}
            <div className="space-y-4 min-h-[200px]">
              {content.map((block, index) => (
                <BlockEditor
                  key={block.id}
                  block={block}
                  index={index}
                  onUpdate={(updatedContent) => updateBlock(index, updatedContent)}
                  onAddBlock={(type) => addBlock(type, index)}
                  onDelete={() => deleteBlock(index)}
                  onImageUpload={(file) => handleImageUpload(file, index)}
                  convertVideoUrl={convertVideoUrl}
                  uploading={uploading}
                />
              ))}
            </div>

            {/* Add Block Button */}
            <div className="mt-8">
              <button
                onClick={handleBlockMenuClick}
                className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                <FaPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Add a block
              </button>
            </div>

            {/* Debug Info */}
            <div className="mt-6 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400">
              <strong>Debug:</strong> {content.length} blocks ({content.map(b => b.type).join(', ')})
            </div>
          </div>
        </AnimatedCard>
      </div>

      {/* Block Type Menu */}
      {showBlockMenu && blockMenuPosition && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowBlockMenu(false)}
          />
          <div 
            className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto"
            style={{
              top: blockMenuPosition.top,
              left: blockMenuPosition.left,
              width: '280px'
            }}
          >
            <div className="p-2">
              <BlockMenuItem
                icon={<FaHeading className="text-blue-500" />}
                label="Heading"
                description="Big section heading"
                onClick={() => addBlock('heading')}
              />
              <BlockMenuItem
                icon={<div className="w-4 h-4 bg-gray-400 rounded-sm" />}
                label="Text"
                description="Just start writing with plain text"
                onClick={() => addBlock('text')}
              />
              <BlockMenuItem
                icon={<FaQuoteLeft className="text-gray-500" />}
                label="Quote"
                description="Capture a quote with attribution"
                onClick={() => addBlock('quote')}
              />
              <BlockMenuItem
                icon={<FaListUl className="text-purple-500" />}
                label="Bulleted List"
                description="Create a simple bulleted list"
                onClick={() => addBlock('list')}
              />
              <BlockMenuItem
                icon={<FaListOl className="text-purple-500" />}
                label="Numbered List"
                description="Create a list with numbering"
                onClick={() => {
                  const insertIndex = content.length;
                  const newBlock: NoteBlock = {
                    id: `block-${Date.now()}-${Math.random()}`,
                    type: 'list',
                    content: { items: [''], ordered: true },
                    position: insertIndex
                  };
                  setContent([...content, newBlock]);
                  setShowBlockMenu(false);
                }}
              />
              <BlockMenuItem
                icon={<FaCode className="text-green-500" />}
                label="Code"
                description="Capture a code snippet"
                onClick={() => addBlock('code')}
              />
              <BlockMenuItem
                icon={<FaImage className="text-blue-500" />}
                label="Image"
                description="Upload or embed with a link"
                onClick={() => addBlock('image')}
              />
              <BlockMenuItem
                icon={<FaVideo className="text-red-500" />}
                label="Video"
                description="Embed from YouTube, Vimeo, etc."
                onClick={() => addBlock('video')}
              />
              <BlockMenuItem
                icon={<FaLink className="text-indigo-500" />}
                label="Web Bookmark"
                description="Save a link to any page on the web"
                onClick={() => addBlock('embed')}
              />
              <BlockMenuItem
                icon={<FaTable className="text-green-500" />}
                label="Table"
                description="Add a table with rows and columns"
                onClick={() => addBlock('table')}
              />
              <BlockMenuItem
                icon={<FaInfoCircle className="text-blue-500" />}
                label="Callout"
                description="Make writing stand out"
                onClick={() => addBlock('callout')}
              />
              <BlockMenuItem
                icon={<FaMinus className="text-gray-400" />}
                label="Divider"
                description="Visually divide blocks"
                onClick={() => addBlock('divider')}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Block Menu Item Component
const BlockMenuItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}> = ({ icon, label, description, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
  >
    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-medium text-gray-900 dark:text-white">{label}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{description}</div>
    </div>
  </button>
);

// Block Editor Component
const BlockEditor: React.FC<{
  block: NoteBlock;
  index: number;
  onUpdate: (content: any) => void;
  onAddBlock: (type: 'text' | 'heading' | 'quote' | 'list' | 'code' | 'image' | 'video' | 'embed' | 'divider' | 'callout' | 'table') => void;
  onDelete: () => void;
  onImageUpload: (file: File) => void;
  convertVideoUrl: (url: string) => string;
  uploading: boolean;
}> = ({ block, onUpdate, onAddBlock, onDelete, onImageUpload, convertVideoUrl, uploading }) => {
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
            <option value="sql">SQL</option>
            <option value="bash">Bash</option>
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

    case 'image':
      return (
        <div className="group relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
          <div className="text-center">
            <FaImage className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4 space-y-3">
              {/* File Upload */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 10 * 1024 * 1024) { // 10MB limit
                        toast.error('File size must be less than 10MB');
                        return;
                      }
                      onImageUpload(file);
                    }
                  }}
                  disabled={uploading}
                  className="hidden"
                  id={`file-upload-${block.id}`}
                />
                <label
                  htmlFor={`file-upload-${block.id}`}
                  className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                    uploading 
                      ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 cursor-not-allowed'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }`}
                >
                  {uploading ? (
                    <>
                      <FaSpinner className="animate-spin text-blue-500" />
                      <span className="text-blue-600 dark:text-blue-400">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <FaUpload className="text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">Click to upload image</span>
                    </>
                  )}
                </label>
              </div>

              {/* URL Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLink className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={block.content?.url || ''}
                  onChange={(e) => handleContentChange('url', e.target.value)}
                  placeholder="Or paste image URL..."
                  className="w-full pl-10 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

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
            {block.content?.url && (
              <div className="mt-4">
                <img 
                  src={block.content.url} 
                  alt={block.content.alt || 'Image'} 
                  className="max-w-full h-auto rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
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
                {convertVideoUrl(block.content.url) !== block.content.url ? (
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <iframe
                      src={convertVideoUrl(block.content.url)}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Embedded video"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <FaPlay className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">
                        {block.content.url.includes('youtube.com') || block.content.url.includes('vimeo.com') 
                          ? 'Unsupported video format' 
                          : 'Enter a YouTube or Vimeo URL'
                        }
                      </p>
                    </div>
                  </div>
                )}
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