'use client';

import { useState, useEffect } from 'react';

interface ClientTimeDisplayProps {
  prefix?: string;
  className?: string;
}

export default function ClientTimeDisplay({ prefix = '', className = '' }: ClientTimeDisplayProps) {
  const [time, setTime] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString());
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return <span className={className}>{prefix}Loading...</span>;
  }

  return <span className={className}>{prefix}{time}</span>;
} 