import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { motion } from 'motion/react';

interface VoiceRecorderProps {
  onRecordingComplete: (hasRecording: boolean) => void;
  language: string;
}

export function VoiceRecorder({ onRecordingComplete, language }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(20).fill(0));

  // Simulate recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
        // Simulate audio levels
        setAudioLevels(prev => 
          prev.map(() => Math.random() * 100)
        );
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    setHasRecording(false);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setHasRecording(true);
    setAudioLevels(Array(20).fill(0));
    onRecordingComplete(true);
  };

  const handleDeleteRecording = () => {
    setHasRecording(false);
    setRecordingTime(0);
    setIsPlaying(false);
    onRecordingComplete(false);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // Simulate playback completion after 3 seconds
    if (!isPlaying) {
      setTimeout(() => {
        setIsPlaying(false);
      }, 3000);
    }
  };

  const formatTime = (centiseconds: number) => {
    const seconds = Math.floor(centiseconds / 10);
    const cs = centiseconds % 10;
    return `${seconds}.${cs}s`;
  };

  if (hasRecording) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Voice Note Recorded
            </span>
          </div>
          <span className="text-xs text-green-600">
            {formatTime(recordingTime)}
          </span>
        </div>
        
        {/* Waveform visualization (static for recorded audio) */}
        <div className="flex items-center gap-1 h-8 mb-3">
          {Array(30).fill(0).map((_, i) => (
            <div
              key={i}
              className="bg-green-300 rounded-full flex-1"
              style={{
                height: `${Math.random() * 70 + 10}%`,
                minHeight: '2px'
              }}
            />
          ))}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePlayPause}
            className="flex-1"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 mr-1" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-1" />
                Play
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteRecording}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (isRecording) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Mic className="w-4 h-4 text-red-600" />
            </motion.div>
            <span className="text-sm font-medium text-red-800">
              Recording...
            </span>
          </div>
          <span className="text-xs text-red-600 font-mono">
            {formatTime(recordingTime)}
          </span>
        </div>
        
        {/* Real-time waveform visualization */}
        <div className="flex items-center gap-1 h-8 mb-3">
          {audioLevels.map((level, i) => (
            <motion.div
              key={i}
              className="bg-red-400 rounded-full flex-1"
              style={{ height: `${level * 0.6 + 10}%`, minHeight: '2px' }}
              animate={{ height: `${level * 0.6 + 10}%` }}
              transition={{ duration: 0.1 }}
            />
          ))}
        </div>
        
        <Button
          variant="destructive"
          size="sm"
          onClick={handleStopRecording}
          className="w-full"
        >
          <MicOff className="w-4 h-4 mr-2" />
          Stop Recording
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={handleStartRecording}
      className="w-full"
    >
      <Mic className="w-4 h-4 mr-2" />
      Record Voice Note
    </Button>
  );
}