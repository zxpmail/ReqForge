import { useState } from "react";
import { Plus, BookOpen, Trash2 } from "lucide-react";
import type { Workspace } from "../types";
import { saveWorkspace, deleteWorkspace } from "../db";

interface Props {
  workspaces: Workspace[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onRefresh: () => void;
}

export default function Sidebar({ workspaces, activeId, onSelect, onRefresh }: Props) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");

  async function handleCreate() {
    if (!title.trim()) return;
    const now = Date.now();
    const ws: Workspace = {
      id: crypto.randomUUID(),
      title: title.trim(),
      genre: genre.trim() || "未分类",
      description: "",
      styleGuide: "",
      createdAt: now,
      updatedAt: now,
    };
    await saveWorkspace(ws);
    setAdding(false);
    setTitle("");
    setGenre("");
    onRefresh();
  }

  async function handleDelete(ws: Workspace) {
    if (!window.confirm(`确定删除「${ws.title}」？所有人物、章节、关系将一并删除，无法恢复。`)) return;
    await deleteWorkspace(ws.id);
    onRefresh();
  }

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <BookOpen size={20} /> 创作工作台
        </h1>
      </div>

      <nav className="flex-1 overflow-auto p-2 space-y-1">
        {workspaces.map((ws) => (
          <div key={ws.id} className="group">
            <button
              onClick={() => onSelect(ws.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeId === ws.id
                  ? "bg-indigo-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <div className="font-medium truncate">{ws.title}</div>
              <div className="text-xs text-gray-500 mt-0.5">{ws.genre}</div>
            </button>
            <button
              onClick={() => handleDelete(ws)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ position: "relative", float: "right", marginTop: "-28px", marginRight: "4px" }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-800">
        {adding ? (
          <div className="space-y-2">
            <input
              autoFocus
              placeholder="作品名称"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <input
              placeholder="题材（言情/都市/穿越...）"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="flex-1 px-3 py-1.5 text-sm bg-indigo-600 rounded-lg hover:bg-indigo-500"
              >
                创建
              </button>
              <button
                onClick={() => setAdding(false)}
                className="px-3 py-1.5 text-sm bg-gray-800 rounded-lg hover:bg-gray-700"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm border border-dashed border-gray-700 rounded-lg text-gray-400 hover:border-gray-500 hover:text-gray-200"
          >
            <Plus size={16} /> 新建作品
          </button>
        )}
      </div>
    </aside>
  );
}