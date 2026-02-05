import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AudioRecorder({ onRecordingComplete, isUploading }) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
        onRecordingComplete(file);
        stream.getTracks().forEach(track => track.stop()); // Stop microphone access
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      toast.error('Could not access microphone.');
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex items-center">
      {isUploading ? (
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      ) : isRecording ? (
        <button
          onClick={stopRecording}
          className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors animate-pulse"
          title="Stop Recording"
        >
          <Square className="w-5 h-5" />
        </button>
      ) : (
        <button
          onClick={startRecording}
          className="p-3 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
          title="Record Audio"
        >
          <Mic className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
