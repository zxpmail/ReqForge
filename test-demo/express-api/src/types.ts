export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'completed';
  category: 'feature' | 'bug' | 'chore' | 'docs';
  createdAt: string;
}

export type TaskStatus = Task['status'];
export type TaskCategory = Task['category'];
