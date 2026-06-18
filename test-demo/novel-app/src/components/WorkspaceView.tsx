import { useState } from "react";
import { Users, Share2, ListOrdered, PenLine, Settings, Download } from "lucide-react";
import type { Workspace, View } from "../types";
import { saveWorkspace } from "../db";
import CharacterList from "./CharacterList";
import CharacterGraph from "./CharacterGraph";
import OutlineView from "./OutlineView";
import ChapterEditor from "./ChapterEditor";
import ApiKeySetup from "./ApiKeySetup";
import DataExport from "./DataExport";

interface Props {
  workspace: Workspace;
  view: View;
  onViewChange: (v: View) => void;
  onRefresh: () => void;
}

const tabs: { key: View; label: string; icon: typeof Users }[] = [
  { key: "characters", label: "人物", icon: Users },
  { key: "graph", label: "关系网", icon: Share2 },
  { key: "outline", label: "大纲", icon: ListOrdered },
  { key: "writing", label: "写作", icon: PenLine },
  { key: "settings", label: "设置", icon: Settings },
];

export default function WorkspaceView({ workspace, view, onViewChange, onRefresh }: Props) {
  const [showExport, setShowExport] = useState(false);
  const [wsForm, setWsForm] = useState({ description: workspace.description, styleGuide: workspace.styleGuide });
  const [wsSaved, setWsSaved] = useState(false);

  async function handleSaveWorkspace() {
    const updated = { ...workspace, description: wsForm.description, styleGuide: wsForm.styleGuide, updatedAt: Date.now() };
    await saveWorkspace(updated);
    setWsSaved(true);
    setTimeout(() => setWsSaved(false), 2000);
    onRefresh();
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{workspace.title}</h2>
          <span className="text-sm text-gray-500">{workspace.genre}</span>
        </div>
        <button
          onClick={() => setShowExport(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-800 rounded-lg hover:bg-gray-700"
        >
          <Download size={16} /> 导入/导出
        </button>
      </header>

      {/* Tabs */}
      <nav className="flex border-b border-gray-800 px-6">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => onViewChange(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 transition-colors ${
                view === t.key
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {view === "characters" && <CharacterList workspaceId={workspace.id} workspace={workspace} />}
        {view === "graph" && <CharacterGraph workspaceId={workspace.id} workspace={workspace} />}
        {view === "outline" && <OutlineView workspace={workspace} />}
        {view === "writing" && <ChapterEditor workspace={workspace} />}
        {view === "settings" && (
          <div className="space-y-6 max-w-xl">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
              <h4 className="font-medium">作品设定</h4>
              <textarea
                value={wsForm.description}
                onChange={(e) => setWsForm({ ...wsForm, description: e.target.value })}
                placeholder="作品简介（影响 AI 生成质量）"
                rows={3}
                className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500 resize-none"
              />
              <textarea
                value={wsForm.styleGuide}
                onChange={(e) => setWsForm({ ...wsForm, styleGuide: e.target.value })}
                placeholder="写作风格要求（如：对话多、节奏快、偏轻松幽默...）"
                rows={2}
                className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500 resize-none"
              />
              <button
                onClick={handleSaveWorkspace}
                className="px-4 py-1.5 text-sm bg-indigo-600 rounded-lg hover:bg-indigo-500"
              >
                {wsSaved ? "已保存" : "保存"}
              </button>
            </div>
            <ApiKeySetup />
          </div>
        )}
      </div>

      {showExport && (
        <DataExport workspaceId={workspace.id} onClose={() => setShowExport(false)} />
      )}
    </div>
  );
}
