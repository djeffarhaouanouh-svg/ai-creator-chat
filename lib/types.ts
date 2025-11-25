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