'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaMicrophone, 
  FaStop, 
  FaPlay, 
  FaPause, 
  FaTrash,
  FaSpinner,
  FaCheck,
  FaTimes,
  FaWaveSquare
} from 'react-icons/fa';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { notesService } from '@/services/notesService';
import toast from 'react-hot-toast';

interface VoiceRecorderProps {
  onTranscriptionComplete: (transcript: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

interface VoiceRecording {
  id: string;
  blob: Blob;
  duration: number;
  url: string;
  transcript?: string;
  isTranscribing: boolean;
  error?: string;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscriptionComplete,
  onClose,
  isOpen,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordings, setRecordings] = useState<VoiceRecording[]>([]);
  const [currentRecording, setCurrentRecording] = useState<VoiceRecording | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    checkMicrophonePermission();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (isRecording && !isPaused) {
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording, isPaused]);

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const checkMicrophonePermission = async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setHasPermission(permission.state === 'granted');
      
      permission.addEventListener('change', () => {
        setHasPermission(permission.state === 'granted');
      });
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      setHasPermission(false);
    }
  };

  const setupAudioContext = async (stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      // Start audio level monitoring
      const updateAudioLevel = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          setAudioLevel(average / 255);
        }
        
        if (isRecording) {
          animationRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
    } catch (error) {
      console.error('Error setting up audio context:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      streamRef.current = stream;
      await setupAudioContext(stream);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        
        const recording: VoiceRecording = {
          id: Date.now().toString(),
          blob,
          duration: recordingTime,
          url,
          isTranscribing: false,
        };
        
        setCurrentRecording(recording);
        setRecordings(prev => [recording, ...prev]);
        setRecordingTime(0);
        setAudioLevel(0);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setHasPermission(true);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to access microphone');
      setHasPermission(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  const playRecording = (recording: VoiceRecording) => {
    if (playingId === recording.id) {
      setPlayingId(null);
      return;
    }

    const audio = new Audio(recording.url);
    audio.onended = () => setPlayingId(null);
    audio.play();
    setPlayingId(recording.id);
  };

  const deleteRecording = (recordingId: string) => {
    setRecordings(prev => prev.filter(r => r.id !== recordingId));
    if (currentRecording?.id === recordingId) {
      setCurrentRecording(null);
    }
  };

  const transcribeRecording = async (recording: VoiceRecording) => {
    try {
      setRecordings(prev => 
        prev.map(r => 
          r.id === recording.id 
            ? { ...r, isTranscribing: true, error: undefined }
            : r
        )
      );

      const response = await notesService.speechToText(recording.blob);
      
      setRecordings(prev => 
        prev.map(r => 
          r.id === recording.id 
            ? { ...r, transcript: response.transcript, isTranscribing: false }
            : r
        )
      );

      toast.success('Transcription completed!');
      
    } catch (error) {
      console.error('Error transcribing recording:', error);
      setRecordings(prev => 
        prev.map(r => 
          r.id === recording.id 
            ? { ...r, isTranscribing: false, error: 'Transcription failed' }
            : r
        )
      );
      toast.error('Failed to transcribe recording');
    }
  };

  const useTranscription = (transcript: string) => {
    onTranscriptionComplete(transcript);
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Voice Recorder
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <FaTimes />
            </button>
          </div>

          {hasPermission === false && (
            <div className="text-center py-8">
              <FaMicrophone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Microphone access is required for voice recording.
              </p>
              <AnimatedButton
                onClick={checkMicrophonePermission}
                variant="gradient"
                className="bg-gradient-to-r from-blue-500 to-purple-500"
              >
                Grant Permission
              </AnimatedButton>
            </div>
          )}

          {hasPermission !== false && (
            <>
              {/* Recording Controls */}
              <div className="text-center mb-6">
                {!isRecording ? (
                  <AnimatedButton
                    onClick={startRecording}
                    variant="gradient"
                    className="bg-gradient-to-r from-red-500 to-red-600 w-20 h-20 rounded-full"
                    icon={<FaMicrophone className="w-8 h-8" />}
                  />
                ) : (
                  <div className="space-y-4">
                    {/* Waveform Visualization */}
                    <div className="flex items-center justify-center gap-1 h-12">
                      {[...Array(20)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-1 bg-red-500 rounded-full"
                          animate={{
                            height: isPaused ? 4 : 4 + (audioLevel * 40) * (Math.random() * 0.5 + 0.5),
                          }}
                          transition={{
                            duration: 0.1,
                            repeat: isPaused ? 0 : Infinity,
                            repeatType: 'reverse',
                          }}
                        />
                      ))}
                    </div>

                    {/* Timer */}
                    <div className="text-2xl font-mono text-gray-900 dark:text-white">
                      {formatTime(recordingTime)}
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-center gap-4">
                      <AnimatedButton
                        onClick={pauseRecording}
                        variant="outline"
                        icon={isPaused ? <FaPlay /> : <FaPause />}
                      />
                      
                      <AnimatedButton
                        onClick={stopRecording}
                        variant="solid"
                        className="bg-red-500 hover:bg-red-600 text-white"
                        icon={<FaStop />}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Recordings List */}
              {recordings.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Recordings
                  </h4>
                  
                  {recordings.map(recording => (
                    <AnimatedCard key={recording.id} variant="glass" className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => playRecording(recording)}
                            className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                          >
                            {playingId === recording.id ? (
                              <FaPause className="w-4 h-4 text-blue-600" />
                            ) : (
                              <FaPlay className="w-4 h-4 text-blue-600" />
                            )}
                          </button>
                          
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatTime(recording.duration)}
                            </div>
                            {recording.transcript && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 max-w-xs truncate">
                                {recording.transcript}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!recording.transcript && !recording.isTranscribing && !recording.error && (
                            <AnimatedButton
                              onClick={() => transcribeRecording(recording)}
                              variant="outline"
                              size="sm"
                              icon={<FaWaveSquare />}
                            >
                              Transcribe
                            </AnimatedButton>
                          )}

                          {recording.isTranscribing && (
                            <FaSpinner className="animate-spin text-blue-500" />
                          )}

                          {recording.transcript && (
                            <AnimatedButton
                              onClick={() => useTranscription(recording.transcript!)}
                              variant="gradient"
                              size="sm"
                              className="bg-gradient-to-r from-green-500 to-green-600"
                              icon={<FaCheck />}
                            >
                              Use
                            </AnimatedButton>
                          )}

                          <button
                            onClick={() => deleteRecording(recording.id)}
                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <FaTrash className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {recording.error && (
                        <div className="mt-2 text-xs text-red-500">
                          {recording.error}
                        </div>
                      )}
                    </AnimatedCard>
                  ))}
                </div>
              )}
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VoiceRecorder; 