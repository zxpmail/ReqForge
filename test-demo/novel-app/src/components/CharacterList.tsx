import { useState, useEffect, useCallback } from "react";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import type { Character } from "../types";
import { getCharacters, saveCharacter, deleteCharacter } from "../db";
import { generateCharacters } from "../ai";

interface Props {
  workspaceId: string;
  workspace: { title: string; genre: string; description: string };
}

const emptyForm = {
  name: "",
  age: "",
  personality: "",
  background: "",
  appearance: "",
  traits: "",
  relationships: "",
};

export default function CharacterList({ workspaceId, workspace }: Props) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [generating, setGenerating] = useState(false);
  const [streamText, setStreamText] = useState("");

  const load = useCallback(async () => {
    setCharacters(await getCharacters(workspaceId));
  }, [workspaceId]);

  useEffect(() => {
    load();
  }, [load]);

  const isNew = editing === "__new__";

  async function handleSave() {
    if (!form.name.trim()) return;
    const now = Date.now();
    const existingChar = !isNew ? characters.find((ch) => ch.id === editing) : null;
    const c: Character = {
      id: isNew ? crypto.randomUUID() : editing!,
      workspaceId,
      name: form.name.trim(),
      age: form.age.trim(),
      personality: form.personality.trim(),
      background: form.background.trim(),
      appearance: form.appearance.trim(),
      traits: form.traits.split(/[,，、\s]+/).filter(Boolean),
      relationships: form.relationships.trim(),
      createdAt: existingChar?.createdAt || now,
      updatedAt: now,
    };
    await saveCharacter(c);
    setEditing(null);
    setForm(emptyForm);
    load();
  }

  function handleEdit(c: Character) {
    setEditing(c.id);
    setForm({
      name: c.name,
      age: c.age,
      personality: c.personality,
      background: c.background,
      appearance: c.appearance,
      traits: c.traits.join("、"),
      relationships: c.relationships,
    });
  }

  async function handleDelete(id: string) {
    await deleteCharacter(id);
    if (editing === id) {
      setEditing(null);
      setForm(emptyForm);
    }
    load();
  }

  function handleGenerate() {
    if (generating) return;
    setGenerating(true);
    setStreamText("");

    generateCharacters(
      { title: workspace.title, genre: workspace.genre, description: workspace.description },
      {
        onToken(text) {
          setStreamText((prev) => prev + text);
        },
        async onDone(fullText) {
          const lines = fullText.split("\n").filter((l) => l.trim() && l.includes("|"));
          const now = Date.now();
          for (const line of lines) {
            const parts = line.split("|").map((s) => s.trim());
            if (parts.length < 1 || !parts[0]) continue;
            const [name, age, personality, background, appearance, traitsStr] = parts;
            const c: Character = {
              id: crypto.randomUUID(),
              workspaceId,
              name,
              age: age || "",
              personality: personality || "",
              background: background || "",
              appearance: appearance || "",
              traits: (traitsStr || "").split(/[,，、\s]+/).filter(Boolean),
              relationships: "",
              createdAt: now,
              updatedAt: now,
            };
            await saveCharacter(c);
          }
          setStreamText("");
          setGenerating(false);
          load();
        },
        onError(err) {
          setStreamText(`错误: ${err.message}`);
          setGenerating(false);
        },
      }
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">人物设定</h3>
        <div className="flex gap-2">
          {!editing && (
            <>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-600/50 rounded-lg hover:bg-indigo-500/70 disabled:opacity-50"
              >
                <Sparkles size={16} />
                {generating ? "生成中..." : "AI 生成人物"}
              </button>
              <button
                onClick={() => {
                  setEditing("__new__");
                  setForm(emptyForm);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-600 rounded-lg hover:bg-indigo-500"
              >
                <Plus size={16} /> 添加人物
              </button>
            </>
          )}
        </div>
      </div>

      {/* Streaming output */}
      {streamText && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans">
            {streamText}
          </pre>
        </div>
      )}

      {/* Form */}
      {editing && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="姓名"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500"
            />
            <input
              placeholder="年龄"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              className="px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>
          <input
            placeholder="性格描述"
            value={form.personality}
            onChange={(e) => setForm({ ...form, personality: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500"
          />
          <textarea
            placeholder="背景故事"
            value={form.background}
            onChange={(e) => setForm({ ...form, background: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500 resize-none"
          />
          <input
            placeholder="外貌特征"
            value={form.appearance}
            onChange={(e) => setForm({ ...form, appearance: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500"
          />
          <input
            placeholder="标签（如：外向、腹黑、话痨，用顿号分隔）"
            value={form.traits}
            onChange={(e) => setForm({ ...form, traits: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500"
          />
          <textarea
            placeholder="人物关系描述"
            value={form.relationships}
            onChange={(e) => setForm({ ...form, relationships: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-1.5 text-sm bg-indigo-600 rounded-lg hover:bg-indigo-500"
            >
              保存
            </button>
            <button
              onClick={() => {
                setEditing(null);
                setForm(emptyForm);
              }}
              className="px-4 py-1.5 text-sm bg-gray-800 rounded-lg hover:bg-gray-700"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="grid gap-3">
        {characters.map((c) => (
          <div
            key={c.id}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start justify-between group"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{c.name}</h4>
                {c.age && <span className="text-xs text-gray-500">{c.age}岁</span>}
                {c.traits.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 text-xs bg-indigo-900/50 text-indigo-300 rounded-full"
                  >
                    {t}
                  </span>
                ))}
              </div>
              {c.personality && (
                <p className="text-sm text-gray-400 mt-1">{c.personality}</p>
              )}
              {c.background && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-1">{c.background}</p>
              )}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleEdit(c)}
                className="p-1.5 text-sm text-gray-500 hover:text-gray-200"
              >
                编辑
              </button>
              <button
                onClick={() => handleDelete(c.id)}
                className="p-1.5 text-sm text-red-500 hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {characters.length === 0 && !editing && !streamText && (
          <p className="text-gray-500 text-sm text-center py-8">
            还没有人物，点击"AI 生成人物"自动创建或手动添加
          </p>
        )}
      </div>
    </div>
  );
}
