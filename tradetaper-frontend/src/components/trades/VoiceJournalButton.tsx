"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { authApiClient } from '@/services/api';

interface VoiceJournalButtonProps {
  onParsedData: (data: any) => void;
  className?: string;
}

export default function VoiceJournalButton({ onParsedData, className = '' }: VoiceJournalButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error accessing microphone:', err);
      toast.error('Could not access microphone. Please check your browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('audio', audioBlob, 'journal.webm');

    const toastId = toast.loading('AI is analyzing your voice journal...');

    try {
      const response = await authApiClient.post('/trades/voice-parse', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const parsedData = response.data;
      
      toast.success('Journal parsed successfully!', { id: toastId });
      
      // Pass data up to parent form
      onParsedData(parsedData);
      
    } catch (err) {
      console.error('Failed to parse audio:', err);
      toast.error('Failed to analyze voice log. Please try typing manually.', { id: toastId });
    } finally {
      setIsProcessing(false);
      setRecordingTime(0);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        type="button"
        onClick={toggleRecording}
        disabled={isProcessing}
        className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50
          ${isRecording 
            ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500 dark:focus:ring-offset-[#0A0A0A]' 
            : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 focus:ring-emerald-500 dark:focus:ring-offset-[#0A0A0A]'
          }
        `}
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isRecording ? (
          <Square className="w-5 h-5 fill-current" />
        ) : (
          <Mic className="w-5 h-5" />
        )}

        {/* Pulsing ring when recording */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 1.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full border-2 border-red-500 pointer-events-none"
            />
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {(isRecording || isProcessing) && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full"
          >
            {isRecording && <Volume2 className="w-4 h-4 text-red-500 animate-pulse" />}
            <span className={`text-sm font-medium ${isRecording ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
              {isProcessing ? 'Analyzing audio...' : formatTime(recordingTime)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
