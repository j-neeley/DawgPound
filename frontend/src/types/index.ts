// User types
export interface User {
  id: string;
  email: string;
  name: string;
  universityEmail?: string;
  verified: boolean;
  onboardingCompleted: boolean;
  majors?: string[];
  interests?: string[];
  year?: string;
  graduationYear?: number;
  privacySettings?: PrivacySettings;
  createdAt?: string;
}

export interface PrivacySettings {
  profileVisible: boolean;
  showEmail: boolean;
  allowMessages: boolean;
  showGroups: boolean;
}

// Auth types
export interface SignupRequest {
  email: string;
  name: string;
}

export interface SignupResponse {
  userId: string;
  verificationToken: string;
  message: string;
}

export interface VerifyRequest {
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Onboarding types
export interface OnboardingData {
  majors: string[];
  interests_hobbies: string[];
  year: string;
  graduationYear: number;
  privacySettings: PrivacySettings;
}

// Group types
export interface Group {
  id: string;
  name: string;
  description: string;
  category: 'class_year' | 'major' | 'interests_activities';
  tags: string[];
  creator: string;
  creatorName?: string;
  moderators: string[];
  members: string[];
  memberCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Thread {
  id: string;
  groupId: string;
  author: string;
  authorName: string;
  title: string;
  content: string;
  contentType: 'plain' | 'markdown' | 'html';
  attachments?: Attachment[];
  pinned: boolean;
  locked: boolean;
  replyCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Reply {
  id: string;
  threadId: string;
  author: string;
  authorName: string;
  content: string;
  contentType: 'plain' | 'markdown' | 'html';
  attachments?: Attachment[];
  createdAt: string;
  updatedAt?: string;
}

export interface Attachment {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  virusScanned?: boolean;
}

// Messaging types
export interface Chat {
  id: string;
  name: string;
  avatar?: string;
  participants: string[];
  participantDetails?: User[];
  lastMessage?: Message;
  unreadCount?: number;
  muted?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Message {
  id: string;
  chatId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

// Friend types
export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface Friendship {
  userId: string;
  userName: string;
  email?: string;
  createdAt: string;
}

// Discovery types
export interface UserRecommendation {
  user: User;
  score: number;
  reasons: string[];
}

export interface GroupRecommendation {
  group: Group;
  score: number;
  reasons: string[];
}

export interface DiscoveryFeed {
  groups: GroupRecommendation[];
  users: UserRecommendation[];
}

// Admin types
export interface AdminStats {
  totalUsers: number;
  verifiedUsers: number;
  onboardingCompleted: number;
  majorCounts: Record<string, number>;
  interestCounts: Record<string, number>;
  totalGroups?: number;
  totalThreads?: number;
  totalMessages?: number;
}

// WebSocket event types
export interface WSMessage {
  type: string;
  data: any;
}

export interface TypingIndicator {
  chatId: string;
  userId: string;
  userName: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}
