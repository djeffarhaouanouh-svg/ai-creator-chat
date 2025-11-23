import { ChatSession, Message } from './types';

export const storage = {
  // Chat sessions
  getChatSession(creatorId: string): ChatSession | null {
    if (typeof window === 'undefined') return null;
    const session = localStorage.getItem(`chat_${creatorId}`);
    if (!session) return null;
    const parsed = JSON.parse(session);
    return {
      ...parsed,
      messages: parsed.messages.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp)
      })),
      lastMessageAt: new Date(parsed.lastMessageAt)
    };
  },

  saveChatSession(creatorId: string, session: ChatSession): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`chat_${creatorId}`, JSON.stringify(session));
  },

  addMessage(creatorId: string, message: Message): void {
    const session = this.getChatSession(creatorId) || {
      creatorId,
      messages: [],
      messageCount: 0,
      lastMessageAt: new Date()
    };

    session.messages.push(message);
    session.messageCount++;
    session.lastMessageAt = new Date();
    this.saveChatSession(creatorId, session);
  },

  clearChat(creatorId: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`chat_${creatorId}`);
  },

  // User subscriptions (mockup)
  isSubscribed(creatorId: string): boolean {
    if (typeof window === 'undefined') return false;
    const subs = localStorage.getItem('subscriptions');
    if (!subs) return false;
    const subscriptions = JSON.parse(subs);
    return subscriptions.includes(creatorId);
  },

  subscribe(creatorId: string): void {
    if (typeof window === 'undefined') return;
    const subs = localStorage.getItem('subscriptions');
    const subscriptions = subs ? JSON.parse(subs) : [];
    if (!subscriptions.includes(creatorId)) {
      subscriptions.push(creatorId);
      localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
    }
  },

  unsubscribe(creatorId: string): void {
    if (typeof window === 'undefined') return;
    const subs = localStorage.getItem('subscriptions');
    if (!subs) return;
    const subscriptions = JSON.parse(subs);
    const filtered = subscriptions.filter((id: string) => id !== creatorId);
    localStorage.setItem('subscriptions', JSON.stringify(filtered));
  },

  getSubscriptions(): string[] {
    if (typeof window === 'undefined') return [];
    const subs = localStorage.getItem('subscriptions');
    return subs ? JSON.parse(subs) : [];
  }
};
