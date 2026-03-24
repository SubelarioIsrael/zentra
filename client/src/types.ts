export type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  streak_count?: number;
  created_at?: string;
};

export type Subject = {
  id: number;
  name: string;
  description: string;
  topic_count?: number;
};

export type Topic = {
  id: number;
  subject_id: number;
  name: string;
  description: string;
  question_count?: number;
};

export type Question = {
  id: number;
  prompt: string;
  topicName: string;
  subjectName: string;
  imageUrls?: string[];
  options: Record<'A' | 'B' | 'C' | 'D', string>;
};
