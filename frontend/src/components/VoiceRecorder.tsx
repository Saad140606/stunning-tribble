import React, { useRef, useState } from 'react';

interface VoiceRecorderProps {
  onRecordingComplete?: (blob: Blob, url: string) => void;
  language?: 'en' | 'ur';
}

// FIX 7: Real VoiceRecorder using MediaRecorder API with live waveform visualizer
export function VoiceRecorder({ onRecordingComplete, language = 'en' }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [bars, setBars] = useState<number[]>(Array(20).fill(10));
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onRecordingComplete?.(blob, url);
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setDuration(0);

      // Real waveform from analyser
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const animate = () => {
        analyser.getByteFrequencyData(dataArray);
        setBars(Array.from({ length: 20 }, (_, i) => (dataArray[Math.floor(i * dataArray.length / 20)] / 255) * 100));
        animFrameRef.current = requestAnimationFrame(animate);
      };
      animate();

      timerRef.current = window.setInterval(() => setDuration(d => d + 1), 1000);
    } catch {
      alert(language === 'ur' ? 'مائیکروفون تک رسائی نہیں ملی' : 'Microphone access denied');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsRecording(false);
    setBars(Array(20).fill(10));
  };

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div style={{ background: '#0F2040', borderRadius: 16, padding: '16px', border: '1px solid rgba(0,212,255,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 48, marginBottom: 12 }}>
        {bars.map((h, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              borderRadius: 2,
              background: isRecording ? '#00D4FF' : '#1E3A5F',
              height: `${Math.max(h, 8)}%`,
              transition: 'height 0.05s',
            }}
          />
        ))}
      </div>
      {isRecording && (
        <p style={{ textAlign: 'center', color: '#FF3B3B', fontSize: 13, marginBottom: 8 }}>
          ● {formatDuration(duration)}
        </p>
      )}
      {audioUrl && !isRecording && (
        <audio controls src={audioUrl} style={{ width: '100%', marginBottom: 8 }} />
      )}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: 12,
          fontWeight: 700,
          fontSize: 13,
          background: isRecording ? '#FF3B3B' : 'rgba(0,212,255,0.12)',
          color: isRecording ? '#fff' : '#00D4FF',
          border: `1px solid ${isRecording ? '#FF3B3B' : 'rgba(0,212,255,0.2)'}`,
          cursor: 'pointer',
        }}
      >
        {isRecording
          ? (language === 'ur' ? '⏹ ریکارڈنگ روکیں' : '⏹ Stop Recording')
          : (language === 'ur' ? '🎤 ریکارڈ کریں' : '🎤 Start Recording')}
      </button>
    </div>
  );
}