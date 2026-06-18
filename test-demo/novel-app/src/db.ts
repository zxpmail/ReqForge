import { openDB, type IDBPDatabase } from "idb";
import type { Workspace, Character, Chapter, Relationship } from "./types";

const DB_NAME = "novel-app";
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains("workspaces")) {
          db.createObjectStore("workspaces", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("characters")) {
          const cs = db.createObjectStore("characters", { keyPath: "id" });
          cs.createIndex("workspaceId", "workspaceId", { unique: false });
        }
        if (!db.objectStoreNames.contains("chapters")) {
          const ch = db.createObjectStore("chapters", { keyPath: "id" });
          ch.createIndex("workspaceId", "workspaceId", { unique: false });
        }
        if (oldVersion < 2 && !db.objectStoreNames.contains("relationships")) {
          const rs = db.createObjectStore("relationships", { keyPath: "id" });
          rs.createIndex("workspaceId", "workspaceId", { unique: false });
        }
      },
    }).catch((err) => {
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

// --- Workspace ---
export async function getAllWorkspaces(): Promise<Workspace[]> {
  const db = await getDb();
  return db.getAll("workspaces");
}

export async function getWorkspace(id: string): Promise<Workspace | undefined> {
  const db = await getDb();
  return db.get("workspaces", id);
}

export async function saveWorkspace(w: Workspace): Promise<void> {
  const db = await getDb();
  await db.put("workspaces", w);
}

export async function deleteWorkspace(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("workspaces", id);
  for (const c of await getCharacters(id)) await db.delete("characters", c.id);
  for (const c of await getChapters(id)) await db.delete("chapters", c.id);
  for (const r of await getRelationships(id)) await db.delete("relationships", r.id);
}

// --- Character ---
export async function getCharacters(workspaceId: string): Promise<Character[]> {
  const db = await getDb();
  return db.getAllFromIndex("characters", "workspaceId", workspaceId);
}

export async function saveCharacter(c: Character): Promise<void> {
  const db = await getDb();
  await db.put("characters", c);
}

export async function deleteCharacter(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("characters", id);
  const all = await db.getAll("relationships");
  for (const r of all) {
    if (r.sourceId === id || r.targetId === id) await db.delete("relationships", r.id);
  }
}

// --- Relationship ---
export async function getRelationships(workspaceId: string): Promise<Relationship[]> {
  const db = await getDb();
  return db.getAllFromIndex("relationships", "workspaceId", workspaceId);
}

export async function saveRelationship(r: Relationship): Promise<void> {
  const db = await getDb();
  await db.put("relationships", r);
}

export async function deleteRelationship(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("relationships", id);
}

// --- Chapter ---
export async function getChapters(workspaceId: string): Promise<Chapter[]> {
  const db = await getDb();
  const chs = await db.getAllFromIndex("chapters", "workspaceId", workspaceId);
  return chs.sort((a, b) => a.orderIndex - b.orderIndex || a.createdAt - b.createdAt);
}

export async function saveChapter(c: Chapter): Promise<void> {
  const db = await getDb();
  await db.put("chapters", c);
}

export async function deleteChapter(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("chapters", id);
}

// --- Export/Import ---
export async function exportWorkspace(workspaceId: string) {
  const ws = await getWorkspace(workspaceId);
  if (!ws) return null;
  const characters = await getCharacters(workspaceId);
  const chapters = await getChapters(workspaceId);
  const relationships = await getRelationships(workspaceId);
  return { workspace: ws, characters, chapters, relationships };
}

export async function importWorkspace(data: {
  workspace: Workspace;
  characters?: Character[];
  chapters?: Chapter[];
  relationships?: Relationship[];
}): Promise<void> {
  const db = await getDb();
  await db.put("workspaces", data.workspace);
  if (Array.isArray(data.characters)) for (const c of data.characters) await db.put("characters", c);
  if (Array.isArray(data.chapters)) for (const c of data.chapters) await db.put("chapters", c);
  if (Array.isArray(data.relationships)) for (const r of data.relationships) await db.put("relationships", r);
}
