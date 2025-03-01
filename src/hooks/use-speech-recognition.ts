
import { useState, useEffect, useCallback } from "react";

type UseSpeechRecognitionProps = {
  onResult?: (result: string) => void;
  onEnd?: () => void;
  language?: string;
  continuous?: boolean;
};

export function useSpeechRecognition({
  onResult,
  onEnd,
  language = "en-US",
  continuous = false,
}: UseSpeechRecognitionProps = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser.");
      setIsSupported(false);
      return;
    }
    
    setIsSupported(true);
    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = continuous;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = language;
    
    recognitionInstance.onresult = (event) => {
      let finalTranscript = "";
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }
      
      if (finalTranscript) {
        setTranscript(finalTranscript);
        onResult?.(finalTranscript);
      }
    };
    
    recognitionInstance.onerror = (event) => {
      if (event.error !== 'no-speech') {
        console.error("Speech recognition error:", event.error);
        setError(event.error);
        setIsListening(false);
      }
    };
    
    recognitionInstance.onend = () => {
      setIsListening(false);
      onEnd?.();
    };
    
    setRecognition(recognitionInstance);
    
    return () => {
      if (recognitionInstance) {
        recognitionInstance.abort();
      }
    };
  }, [continuous, language, onEnd, onResult]);

  const startListening = useCallback(() => {
    if (!recognition) return;
    
    setError(null);
    setTranscript("");
    setIsListening(true);
    
    try {
      recognition.start();
    } catch (err) {
      console.error("Error starting speech recognition:", err);
      setError("Failed to start speech recognition.");
      setIsListening(false);
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (!recognition) return;
    
    try {
      recognition.stop();
    } catch (err) {
      console.error("Error stopping speech recognition:", err);
    }
    
    setIsListening(false);
  }, [recognition]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    error,
    isSupported,
  };
}
