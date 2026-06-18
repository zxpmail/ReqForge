export interface Workspace {
  id: string;
  title: string;
  genre: string;
  description: string;
  styleGuide: string;
  createdAt: number;
  updatedAt: number;
}

export interface Character {
  id: string;
  workspaceId: string;
  name: string;
  age: string;
  personality: string;
  background: string;
  appearance: string;
  traits: string[];
  relationships: string;
  createdAt: number;
  updatedAt: number;
}

export type ChapterStatus = "outline" | "writing" | "written" | "revised";

export interface Chapter {
  id: string;
  workspaceId: string;
  title: string;
  summary: string;
  orderIndex: number;
  status: ChapterStatus;
  content: string;
  wordCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface Relationship {
  id: string;
  workspaceId: string;
  sourceId: string;
  targetId: string;
  type: string;       // 情侣/朋友/仇人/亲属/同事/师生/对手...
  description: string;
}

export type View = "characters" | "graph" | "outline" | "writing" | "settings";
