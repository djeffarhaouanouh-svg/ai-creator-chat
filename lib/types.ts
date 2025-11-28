export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  creatorId: string;
  messages: Message[];
  messageCount: number;
  lastMessageAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  subscriptions: string[]; // creator IDs
  messageCredits: number;
}

export interface Subscription {
  creatorId: string;
  userId: string;
  startDate: Date;
  status: 'active' | 'cancelled';
  messageLimit: number;
  messagesUsed: number;
}

export interface Creator {
  id: string;
  name: string;
  username: string;
  avatar: string;
  coverImage: string;
  bio: string;
  personality: string;
  subscribers: number;
  messagesCount: number;
  price: number;
  tags: string[];
  aiPrompt: string;
  imageY?: string; // optionnel
}
