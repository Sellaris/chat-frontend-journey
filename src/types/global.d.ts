// src/types/global.d.ts
declare module 'react-speech-recognition' {
    interface SpeechRecognitionOptions {
      continuous?: boolean;
      language?: string;
    }
    
    export interface SpeechRecognition {
      startListening(options?: SpeechRecognitionOptions): Promise<void>;
      stopListening(): void;
    }
  }