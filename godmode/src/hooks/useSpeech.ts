import { useState, useEffect, useRef, useCallback } from 'react';

export function useSpeech(autoRestart = false) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        
        recognition.onresult = (event: any) => {
          let currentFinal = '';
          let currentInterim = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              currentFinal += event.results[i][0].transcript;
            } else {
              currentInterim += event.results[i][0].transcript;
            }
          }
          
          setTranscript(prev => (prev ? prev + " " : "") + currentFinal + currentInterim);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech error", event.error);
          if (event.error !== 'no-speech') {
            setIsListening(false);
          }
        };
        
        recognition.onend = () => {
          if (autoRestart && isListening) {
             try {
                recognition.start();
             } catch(e) {
                setIsListening(false);
             }
          } else {
             setIsListening(false);
          }
        };
        
        recognitionRef.current = recognition;
      }
    }
    
    return () => {
       if (recognitionRef.current) {
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
       }
    };
  }, [autoRestart, isListening]);

  const toggleListening = useCallback(() => {
    if (!supported || !recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript(''); 
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch(e) {
        console.error(e);
      }
    }
  }, [isListening, supported]);

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 0.8;
      utterance.rate = 1.0;
      
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.lang === 'en-US' && (v.name.includes('Google') || v.name.includes('Siri') || v.name.includes('Male')));
      if (preferred) utterance.voice = preferred;
      
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  return { isListening, transcript, setTranscript, toggleListening, speak, supported };
}
