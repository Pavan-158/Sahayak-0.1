/**
 * Chat Storage Service
 * Persists chat sessions in localStorage so they survive page navigation/refresh.
 */

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  isVoice?: boolean;
  timestamp?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

const STORAGE_KEY = 'sahayak_chat_sessions';
const ACTIVE_CHAT_KEY = 'sahayak_active_chat_id';

/**
 * Generate a unique chat ID
 */
function generateId(): string {
  return `chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a title from the first user message
 */
function generateTitle(messages: ChatMessage[]): string {
  const firstUserMsg = messages.find(m => m.role === 'user');
  if (!firstUserMsg) return 'New Chat';
  
  const text = firstUserMsg.content.trim();
  if (text.length <= 40) return text;
  return text.substring(0, 37) + '...';
}

/**
 * Get all saved chat sessions
 */
export function getAllChats(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Sort by updatedAt descending (most recent first)
    return parsed.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (e) {
    console.error('Error reading chat storage:', e);
    return [];
  }
}

/**
 * Get a specific chat session by ID
 */
export function getChat(id: string): ChatSession | null {
  const chats = getAllChats();
  return chats.find(c => c.id === id) || null;
}

/**
 * Get the currently active chat ID
 */
export function getActiveChatId(): string | null {
  return localStorage.getItem(ACTIVE_CHAT_KEY);
}

/**
 * Set the active chat ID
 */
export function setActiveChatId(id: string | null): void {
  if (id === null) {
    localStorage.removeItem(ACTIVE_CHAT_KEY);
  } else {
    localStorage.setItem(ACTIVE_CHAT_KEY, id);
  }
}

/**
 * Create a new chat session
 */
export function createNewChat(): ChatSession {
  const now = Date.now();
  const newChat: ChatSession = {
    id: generateId(),
    title: 'New Chat',
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
  
  const chats = getAllChats();
  chats.unshift(newChat);
  saveChats(chats);
  setActiveChatId(newChat.id);
  
  return newChat;
}

/**
 * Save messages to an existing chat session
 */
export function saveMessages(chatId: string, messages: ChatMessage[]): ChatSession | null {
  const chats = getAllChats();
  const idx = chats.findIndex(c => c.id === chatId);
  
  if (idx === -1) {
    // Chat doesn't exist - create it
    const newChat: ChatSession = {
      id: chatId,
      title: generateTitle(messages),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages,
    };
    chats.unshift(newChat);
    saveChats(chats);
    return newChat;
  }
  
  // Update existing chat
  chats[idx].messages = messages;
  chats[idx].updatedAt = Date.now();
  // Update title from first user message if it's still "New Chat"
  if (chats[idx].title === 'New Chat') {
    chats[idx].title = generateTitle(messages);
  }
  
  // Move to top (most recent)
  const [updated] = chats.splice(idx, 1);
  chats.unshift(updated);
  
  saveChats(chats);
  return updated;
}

/**
 * Delete a chat session
 */
export function deleteChat(chatId: string): void {
  const chats = getAllChats().filter(c => c.id !== chatId);
  saveChats(chats);
  
  // If deleted chat was active, clear active
  if (getActiveChatId() === chatId) {
    if (chats.length > 0) {
      setActiveChatId(chats[0].id);
    } else {
      setActiveChatId(null);
    }
  }
}

/**
 * Rename a chat session
 */
export function renameChat(chatId: string, newTitle: string): void {
  const chats = getAllChats();
  const idx = chats.findIndex(c => c.id === chatId);
  if (idx !== -1) {
    chats[idx].title = newTitle;
    saveChats(chats);
  }
}

/**
 * Clear all chat history
 */
export function clearAllChats(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ACTIVE_CHAT_KEY);
}

/**
 * Internal: Save chats array to localStorage
 */
function saveChats(chats: ChatSession[]): void {
  try {
    // Limit to 50 most recent chats to avoid localStorage overflow
    const trimmed = chats.slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Error saving chat storage:', e);
    // If storage is full, remove oldest chats
    if (chats.length > 10) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(chats.slice(0, 10)));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }
}

/**
 * Format timestamp for display
 */
export function formatChatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
