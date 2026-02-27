'use client';

import React from 'react';
import MentorChat from '@/components/mentor/MentorChat';
import KnowledgeUploader from '@/components/mentor/KnowledgeUploader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BrainCircuit } from 'lucide-react';
import { FeatureGate } from '@/components/common/FeatureGate';

export default function MentorPage() {
  return (
    <FeatureGate feature="mentor" className="min-h-screen">
      <div className="container mx-auto p-6 max-w-6xl space-y-8">
        
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BrainCircuit className="w-8 h-8 text-emerald-500" />
            ICT Mentor AI
          </h1>
          <p className="text-zinc-400">
            Your personal trading mentor. Chat about concepts or audit your charts using your own knowledge base.
          </p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px] bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="chat" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              Chat &amp; Audit
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              Knowledge Base
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <MentorChat />
              </div>
              <div className="space-y-6">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                  <h3 className="text-lg font-medium text-white mb-2">How to use</h3>
                  <ul className="space-y-2 text-sm text-zinc-400 list-disc list-inside">
                    <li>Ask questions like &quot;What is an Order Block?&quot;</li>
                    <li>Upload a screenshot of your chart for a critique.</li>
                    <li>The mentor uses your <b>Knowledge Base</b> to answer.</li>
                  </ul>
                </div>
                
                <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-xl p-5">
                  <h3 className="text-lg font-medium text-emerald-400 mb-2">Pro Tip</h3>
                  <p className="text-sm text-emerald-200/70">
                    Upload transcripts of videos you&apos;ve watched in the &quot;Knowledge Base&quot; tab to make the mentor smarter about your specific strategy.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="knowledge" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <KnowledgeUploader />
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex items-center justify-center text-zinc-500 text-sm">
                <p>Document list coming soon...</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </FeatureGate>
  );
}
