'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import disciplineService, { CooldownSession } from '@/services/disciplineService';

interface CooldownOverlayProps {
  cooldown: CooldownSession | null;
  onComplete?: () => void;
  onSkip?: () => void;
}

// Exercise definitions
const EXERCISES = {
  breathing: {
    id: 'breathing',
    name: '🧘 Box Breathing',
    description: 'Calm your mind with 4-4-4-4 breathing',
    duration: 60, // seconds
    instructions: [
      'Breathe in for 4 seconds',
      'Hold for 4 seconds',
      'Breathe out for 4 seconds',
      'Hold for 4 seconds',
      'Repeat 4 times'
    ]
  },
  journal: {
    id: 'journal',
    name: '📝 Quick Journal',
    description: 'Reflect on your current mindset',
    prompts: [
      'What emotion are you feeling right now?',
      'Why did you want to take this trade?',
      'What would happen if you waited 30 minutes?'
    ]
  },
  past_mistakes: {
    id: 'past_mistakes',
    name: '📊 Review Past Mistakes',
    description: 'Learn from your trading history',
    content: 'Review your last 3 losing trades. What patterns do you see?'
  },
  risk_visualization: {
    id: 'risk_visualization',
    name: '⚠️ Risk Visualization',
    description: 'Visualize the worst case scenario',
    content: 'If you lost this trade, how would it affect your account? Your emotions? Your week?'
  }
};

type ExerciseId = keyof typeof EXERCISES;

export const CooldownOverlay: React.FC<CooldownOverlayProps> = ({
  cooldown,
  onComplete,
  onSkip,
}) => {
  const [currentExercise, setCurrentExercise] = useState<ExerciseId | null>(null);
  const [breathingPhase, setBreathingPhase] = useState(0);
  const [breathingCount, setBreathingCount] = useState(0);
  const [journalAnswers, setJournalAnswers] = useState<string[]>(['', '', '']);
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Calculate time remaining
  useEffect(() => {
    if (!cooldown?.expiresAt) return;
    
    const updateTimer = () => {
      const remaining = Math.max(0, new Date(cooldown.expiresAt!).getTime() - Date.now());
      setTimeRemaining(Math.floor(remaining / 1000));
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [cooldown?.expiresAt]);

  // Breathing exercise timer
  useEffect(() => {
    if (currentExercise !== 'breathing') return;
    
    const phases = ['Breathe In', 'Hold', 'Breathe Out', 'Hold'];
    const interval = setInterval(() => {
      setBreathingPhase((p) => {
        const next = (p + 1) % 4;
        if (next === 0) {
          setBreathingCount((c) => c + 1);
        }
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [currentExercise]);

  if (!cooldown) return null;

  const completedIds = cooldown.exercisesCompleted.map((e) => e.exerciseId);
  const remainingExercises = cooldown.requiredExercises.filter(
    (id) => !completedIds.includes(id)
  );
  const allComplete = remainingExercises.length === 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleCompleteExercise = async (exerciseId: string) => {
    setLoading(true);
    try {
      await disciplineService.completeExercise(cooldown.id, exerciseId);
      setCurrentExercise(null);
      // Refresh cooldown data
    } catch (err) {
      console.error('Failed to complete exercise:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipCooldown = async () => {
    if (!confirm('Skipping will result in a discipline penalty. Continue?')) return;
    setLoading(true);
    try {
      await disciplineService.skipCooldown(cooldown.id);
      onSkip?.();
    } catch (err) {
      console.error('Failed to skip cooldown:', err);
    } finally {
      setLoading(false);
    }
  };

  const triggerReasons: Record<string, { emoji: string; title: string }> = {
    loss_streak: { emoji: '📉', title: 'Loss Streak Detected' },
    overtrading: { emoji: '⚡', title: 'Overtrading Warning' },
    revenge_trade: { emoji: '😤', title: 'Revenge Trade Risk' },
    unauthorized_trade: { emoji: '🚫', title: 'Unauthorized Trade' },
    outside_hours: { emoji: '🌙', title: 'Outside Trading Hours' },
    manual: { emoji: '✋', title: 'Manual Cooldown' },
  };

  const trigger = triggerReasons[cooldown.triggerReason] || { emoji: '⏸️', title: 'Cooldown Active' };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gray-900/95 backdrop-blur-lg z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* No exercise selected - show list */}
          {!currentExercise && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-center text-white">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-5xl mb-2"
                >
                  {trigger.emoji}
                </motion.div>
                <h2 className="text-xl font-bold">{trigger.title}</h2>
                <p className="text-orange-100 text-sm mt-1">
                  Complete exercises to resume trading
                </p>
              </div>

              {/* Timer */}
              <div className="text-center py-4 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-500">Time Remaining</span>
                <div className="text-3xl font-mono font-bold text-orange-500">
                  {formatTime(timeRemaining)}
                </div>
              </div>

              {/* Exercises */}
              <div className="p-6 space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Required Exercises ({cooldown.requiredExercises.length - remainingExercises.length}/{cooldown.requiredExercises.length})
                </h3>
                
                {cooldown.requiredExercises.map((exId) => {
                  const exercise = EXERCISES[exId as ExerciseId];
                  const isCompleted = completedIds.includes(exId);
                  
                  if (!exercise) return null;
                  
                  return (
                    <motion.button
                      key={exId}
                      onClick={() => !isCompleted && setCurrentExercise(exId as ExerciseId)}
                      disabled={isCompleted}
                      whileHover={!isCompleted ? { scale: 1.02 } : {}}
                      whileTap={!isCompleted ? { scale: 0.98 } : {}}
                      className={`w-full p-4 rounded-xl text-left flex items-center gap-3 transition-all ${
                        isCompleted
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                          : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                      } border`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-600'
                      }`}>
                        {isCompleted ? '✓' : '○'}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {exercise.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {exercise.description}
                        </div>
                      </div>
                      {!isCompleted && <span className="text-gray-400">→</span>}
                    </motion.button>
                  );
                })}

                {allComplete && (
                  <motion.button
                    onClick={onComplete}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-xl mt-4"
                  >
                    ✅ Resume Trading
                  </motion.button>
                )}

                {!allComplete && (
                  <button
                    onClick={handleSkipCooldown}
                    disabled={loading}
                    className="w-full py-2 text-gray-500 text-sm hover:text-red-500 transition-colors mt-4"
                  >
                    Skip (lose 5 discipline points)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Breathing Exercise */}
          {currentExercise === 'breathing' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
              <motion.div
                animate={{
                  scale: breathingPhase % 2 === 0 ? [1, 1.3] : [1.3, 1],
                  opacity: breathingPhase === 1 || breathingPhase === 3 ? 0.7 : 1,
                }}
                transition={{ duration: 4, ease: 'easeInOut' }}
                className="w-40 h-40 mx-auto rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mb-6"
              >
                <span className="text-white text-lg font-medium">
                  {['Breathe In', 'Hold', 'Breathe Out', 'Hold'][breathingPhase]}
                </span>
              </motion.div>
              
              <p className="text-gray-500 mb-4">Cycle {breathingCount + 1} of 4</p>
              
              {breathingCount >= 4 && (
                <button
                  onClick={() => handleCompleteExercise('breathing')}
                  disabled={loading}
                  className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl"
                >
                  {loading ? 'Completing...' : 'Complete Exercise ✓'}
                </button>
              )}
              
              <button
                onClick={() => setCurrentExercise(null)}
                className="w-full py-2 text-gray-500 text-sm mt-2"
              >
                ← Back
              </button>
            </div>
          )}

          {/* Journal Exercise */}
          {currentExercise === 'journal' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
                📝 Quick Journal
              </h3>
              
              <div className="space-y-4">
                {EXERCISES.journal.prompts.map((prompt, index) => (
                  <div key={index}>
                    <label className="text-sm text-gray-600 dark:text-gray-400 block mb-1">
                      {prompt}
                    </label>
                    <textarea
                      value={journalAnswers[index]}
                      onChange={(e) => {
                        const newAnswers = [...journalAnswers];
                        newAnswers[index] = e.target.value;
                        setJournalAnswers(newAnswers);
                      }}
                      className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                      rows={2}
                    />
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => handleCompleteExercise('journal')}
                disabled={loading || journalAnswers.some((a) => a.length < 10)}
                className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl mt-4 disabled:opacity-50"
              >
                {loading ? 'Completing...' : 'Submit Journal ✓'}
              </button>
              
              <button
                onClick={() => setCurrentExercise(null)}
                className="w-full py-2 text-gray-500 text-sm mt-2"
              >
                ← Back
              </button>
            </div>
          )}

          {/* Other Exercises (simple read & complete) */}
          {currentExercise && !['breathing', 'journal'].includes(currentExercise) && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                {EXERCISES[currentExercise]?.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {(EXERCISES[currentExercise] as any)?.content}
              </p>
              
              <button
                onClick={() => handleCompleteExercise(currentExercise)}
                disabled={loading}
                className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl"
              >
                {loading ? 'Completing...' : 'I\'ve reflected on this ✓'}
              </button>
              
              <button
                onClick={() => setCurrentExercise(null)}
                className="w-full py-2 text-gray-500 text-sm mt-2"
              >
                ← Back
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CooldownOverlay;
