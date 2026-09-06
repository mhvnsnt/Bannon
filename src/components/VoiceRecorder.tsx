import React, { useState, useRef } from 'react';

export const VoiceRecorder = ({ characterId, characterName }: { characterId: string, characterName: string }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setAudioBlob(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setUploadStatus('');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setUploadStatus('Microphone access denied or unavailable.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Stop all tracks to release the microphone
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.wav')) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setAudioBlob(file);
      setUploadStatus('');
    } else {
      setUploadStatus('Please select a valid .wav file.');
    }
  };

  const uploadReference = async () => {
    if (!audioBlob) return;
    
    setUploadStatus('Uploading...');
    const formData = new FormData();
    // Use the .wav extension explicitly
    formData.append('file', audioBlob, `${characterId}.wav`);
    
    try {
      // Direct it to the local TTS server API
      const response = await fetch(`http://localhost:5002/api/upload_reference?voice_id=${characterId}`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        setUploadStatus('Success! Reference saved.');
      } else {
        const errorData = await response.json();
        setUploadStatus(`Error: ${errorData.detail || 'Upload failed'}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('Network error uploading file.');
    }
  };

  return (
    <div className="voice-recorder bg-gray-900 p-4 border border-gray-700 rounded-md mt-4">
      <h4 className="text-red-500 font-bold mb-2">Voice Reference: {characterName}</h4>
      <p className="text-gray-400 text-xs mb-4">
        Record 5-15 seconds of clean isolated audio, or upload a .wav file directly.
      </p>
      
      <div className="flex flex-wrap gap-4 items-center mb-4">
        {!isRecording ? (
          <button 
            onClick={startRecording}
            className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded font-bold transition-colors"
          >
            Start Recording
          </button>
        ) : (
          <button 
            onClick={stopRecording}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded font-bold animate-pulse transition-colors"
          >
            Stop Recording
          </button>
        )}
        
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">OR</span>
          <input 
            type="file" 
            accept=".wav" 
            onChange={handleFileUpload} 
            className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-800 file:text-red-500 hover:file:bg-gray-700 cursor-pointer"
          />
        </div>
      </div>

      {audioUrl && (
        <div className="mt-4 p-3 bg-black/50 border border-gray-800 rounded">
          <audio src={audioUrl} controls className="w-full h-8 mb-3" />
          <button 
            onClick={uploadReference}
            className="w-full px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded font-bold transition-colors"
          >
            Save Reference to Assets
          </button>
        </div>
      )}
      
      {uploadStatus && (
        <div className={`mt-3 text-sm font-bold ${uploadStatus.includes('Success') ? 'text-green-500' : 'text-red-500'}`}>
          {uploadStatus}
        </div>
      )}
    </div>
  );
};
