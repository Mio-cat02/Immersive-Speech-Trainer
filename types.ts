export enum AppScreen {
  HOME = 'HOME',
  TOPIC_SELECT = 'TOPIC_SELECT',
  CHAT = 'CHAT',
  PROFILE = 'PROFILE'
}

export enum Difficulty {
  LEVEL_1 = 'L1: Full Script (CN+EN)',
  LEVEL_2 = 'L2: English Script',
  LEVEL_3 = 'L3: Keywords & Hints',
  LEVEL_4 = 'L4: Free Talk'
}

export interface Persona {
  id: string;
  name: string;
  avatar: string; // URL
  traits: string[];
  voiceName: string; // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
  systemPrompt: string;
  color: string;
  minLevel: number; // Global level required to unlock
}

export interface Topic {
  id: string;
  title: string;
  category: 'Daily' | 'Professional' | 'Social Media' | 'Academic' | 'Books & Stories' | 'Fun' | 'Game';
  emoji: string;
  description: string;
  initialPrompt: string;
  minLevel: number; // Global level required to unlock
}

export interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  translation?: string; // For AI messages
  suggestedScript?: string; // For User messages (what they SHOULD say)
  scriptTranslation?: string;
  audioData?: Uint8Array; // PCM data for playback
  isAudioPlaying?: boolean;
}

export interface UserProgress {
  totalXP: number;
  streak: number;
  level: number;
  // Map personaId -> Relationship Level (0-10)
  relationships: Record<string, number>;
  // Map topicId -> Mastery Percentage (0-100)
  topicMastery: Record<string, number>;
}
