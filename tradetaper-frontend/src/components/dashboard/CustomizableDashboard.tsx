"use client";

import React, { ReactNode } from 'react';
import { Responsive } from 'react-grid-layout';
import WidthProviderModule from 'react-grid-layout/build/components/WidthProvider';
import { FaEdit, FaUndo, FaCheck, FaGripVertical } from 'react-icons/fa';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Create the responsive grid layout with width provider
const ResponsiveGridLayout = WidthProviderModule(Responsive);

// Define types
interface LayoutItem { i: string; x: number; y: number; w: number; h: number; }
type Layouts = { [key: string]: LayoutItem[] };

interface DashboardWidgetProps {
  id: string;
  children: ReactNode;
  isEditMode: boolean;
}

// Widget wrapper with drag handle
function DashboardWidget({ id, children, isEditMode }: DashboardWidgetProps) {
  return (
    <div className={`h-full w-full relative ${isEditMode ? 'cursor-move' : ''}`}>
      {isEditMode && (
        <div className="absolute top-2 right-2 z-50 p-1.5 bg-emerald-500 text-white rounded-lg opacity-80 hover:opacity-100 cursor-grab active:cursor-grabbing drag-handle">
          <FaGripVertical className="w-3 h-3" />
        </div>
      )}
      <div className={`h-full w-full ${isEditMode ? 'ring-2 ring-emerald-500/50 ring-dashed rounded-xl' : ''}`}>
        {children}
      </div>
    </div>
  );
}

interface CustomizableDashboardProps {
  layouts: Layouts;
  isEditMode: boolean;
  onLayoutChange: (layouts: Layouts) => void;
  onToggleEditMode: () => void;
  onResetLayout: () => void;
  children: Record<string, ReactNode>;
}

export default function CustomizableDashboard({
  layouts,
  isEditMode,
  onLayoutChange,
  onToggleEditMode,
  onResetLayout,
  children,
}: CustomizableDashboardProps) {
  const breakpoints = { lg: 1200, md: 996, sm: 768 };
  const cols = { lg: 6, md: 4, sm: 2 };
  const rowHeight = 100;

  return (
    <div className="relative">
      {/* Edit Mode Controls */}
      <div className="flex items-center justify-end gap-3 mb-4">
        {isEditMode && (
          <button
            onClick={onResetLayout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <FaUndo className="w-3.5 h-3.5" />
            Reset Layout
          </button>
        )}
        <button
          onClick={onToggleEditMode}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            isEditMode
              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {isEditMode ? (
            <>
              <FaCheck className="w-3.5 h-3.5" />
              Done Editing
            </>
          ) : (
            <>
              <FaEdit className="w-3.5 h-3.5" />
              Customize Layout
            </>
          )}
        </button>
      </div>

      {/* Edit Mode Banner */}
      {isEditMode && (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-700 rounded-xl">
          <p className="text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <FaGripVertical className="w-4 h-4" />
            Drag widgets to rearrange • Resize from edges • Click "Done Editing" to save
          </p>
        </div>
      )}

      {/* Responsive Grid Layout */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={breakpoints}
        cols={cols}
        rowHeight={rowHeight}
        onLayoutChange={(_: Layout[], allLayouts: Layouts) => onLayoutChange(allLayouts)}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        draggableHandle=".drag-handle"
        margin={[16, 16]}
        containerPadding={[0, 0]}
      >
        {Object.entries(children).map(([key, child]) => (
          <div key={key} className="overflow-hidden">
            <DashboardWidget id={key} isEditMode={isEditMode}>
              {child}
            </DashboardWidget>
          </div>
        ))}
      </ResponsiveGridLayout>

      {/* Custom Styles */}
      <style jsx global>{`
        .react-grid-item.react-grid-placeholder {
          background: rgb(16, 185, 129) !important;
          opacity: 0.2 !important;
          border-radius: 12px !important;
        }
        .react-grid-item > .react-resizable-handle {
          background-image: none !important;
        }
        .react-grid-item > .react-resizable-handle::after {
          content: '';
          position: absolute;
          right: 6px;
          bottom: 6px;
          width: 12px;
          height: 12px;
          border-right: 3px solid rgb(16, 185, 129);
          border-bottom: 3px solid rgb(16, 185, 129);
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
