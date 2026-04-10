export interface Script {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface TeleprompterState {
  script: string;
  isPlaying: boolean;
  speed: number; // pixels per second
  fontSize: number; // in pixels
  scrollPosition: number; // in pixels
}

export interface UserPreferences {
  lastSpeed: number;
  lastFontSize: number;
  darkMode: boolean;
}
