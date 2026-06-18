import { useState, useEffect, useCallback } from "react";
import { Sparkles, Trash2 } from "lucide-react";
import type { Workspace, Chapter, Character } from "../types";
import { getChapters, saveChapter, deleteChapter } from "../db";
import { getCharacters } from "../db";
import { generateOutline } from "../ai";

interface Props {
  workspace: Workspace;
}

export default function OutlineView({ workspace }: Props) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [generating, setGenerating] = useState(false);
  const [streamText, setStreamText] = useState("");

  const load = useCallback(async () => {
    setChapters(await getChapters(workspace.id));
    setCharacters(await getCharacters(workspace.id));
  }, [workspace.id]);

  useEffect(() => {
    load();
  }, [load]);

  function handleGenerate() {
    if (generating) return;
    setGenerating(true);
    setStreamText("");

    generateOutline(
      {
        title: workspace.title,
        genre: workspace.genre,
        description: workspace.description,
        styleGuide: workspace.styleGuide,
      },
      characters.map((c) => ({
        name: c.name,
        personality: c.personality,
        background: c.background,
        relationships: c.relationships,
      })),
      {
        onToken(text) {
          setStreamText((prev) => prev + text);
        },
        async onDone(fullText) {
          // Delete all existing chapters first
          for (const ch of chapters) await deleteChapter(ch.id);

          // Parse chapters from markdown
          const lines = fullText.split("\n");
          const parsed: { title: string; summary: string }[] = [];
          let currentTitle = "";
          let currentSummary: string[] = [];

          for (const line of lines) {
            if (line.startsWith("## ")) {
              if (currentTitle) {
                parsed.push({
                  title: currentTitle,
                  summary: currentSummary.join("\n").trim(),
                });
              }
              currentTitle = line.replace(/^##\s+/, "");
              currentSummary = [];
            } else if (currentTitle) {
              currentSummary.push(line);
            }
          }
          if (currentTitle) {
            parsed.push({
              title: currentTitle,
              summary: currentSummary.join("\n").trim(),
            });
          }

          // Save new chapters
          const now = Date.now();
          for (let i = 0; i < parsed.length; i++) {
            const ch: Chapter = {
              id: crypto.randomUUID(),
              workspaceId: workspace.id,
              title: parsed[i].title,
              summary: parsed[i].summary,
              orderIndex: i,
              status: "outline",
              content: "",
              wordCount: 0,
              createdAt: now,
              updatedAt: now,
            };
            await saveChapter(ch);
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

  async function handleDelete(id: string) {
    await deleteChapter(id);
    load();
  }

  async function handleUpdate(index: number, field: "title" | "summary", value: string) {
    const old = chapters[index];
    if (!old) return;
    const updated = { ...old, [field]: value, updatedAt: Date.now() };
    await saveChapter(updated);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">章节大纲</h3>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:opacity-50"
        >
          <Sparkles size={16} />
          {generating ? "生成中..." : "AI 生成大纲"}
        </button>
      </div>

      {streamText && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans">
            {streamText}
          </pre>
        </div>
      )}

      <div className="space-y-2">
        {chapters.map((ch, i) => (
          <div
            key={ch.id}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 group"
          >
            <div className="flex items-start gap-3">
              <span className="text-xs text-gray-600 font-mono mt-2 w-6 shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0 space-y-2">
                <input
                  value={ch.title}
                  onChange={(e) => handleUpdate(i, "title", e.target.value)}
                  className="w-full bg-transparent font-medium focus:outline-none border-b border-transparent focus:border-indigo-500 pb-0.5"
                  placeholder="章节标题"
                />
                <textarea
                  value={ch.summary}
                  onChange={(e) => handleUpdate(i, "summary", e.target.value)}
                  rows={2}
                  className="w-full bg-gray-800/50 text-sm text-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:bg-gray-800 resize-none"
                  placeholder="章节摘要"
                />
              </div>
              <button
                onClick={() => handleDelete(ch.id)}
                className="p-1.5 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {chapters.length === 0 && !streamText && (
          <p className="text-gray-500 text-sm text-center py-8">
            还没有章节大纲，点击"AI 生成大纲"开始
          </p>
        )}
      </div>
    </div>
  );
}