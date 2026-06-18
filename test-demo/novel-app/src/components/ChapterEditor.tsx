import { useState, useEffect, useCallback } from "react";
import { Sparkles, CheckCircle2, Circle } from "lucide-react";
import type { Workspace, Chapter, Character, ChapterStatus } from "../types";
import { getChapters, saveChapter } from "../db";
import { getCharacters } from "../db";
import { generateChapter } from "../ai";

interface Props {
  workspace: Workspace;
}

const statusLabels: Record<ChapterStatus, string> = {
  outline: "待写作",
  writing: "写作中",
  written: "已完成",
  revised: "已修改",
};

const statusColors: Record<ChapterStatus, string> = {
  outline: "text-gray-500",
  writing: "text-yellow-400",
  written: "text-green-400",
  revised: "text-blue-400",
};

const statusCycle: ChapterStatus[] = ["outline", "writing", "written", "revised"];

export default function ChapterEditor({ workspace }: Props) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [editingContent, setEditingContent] = useState("");

  const load = useCallback(async () => {
    setChapters(await getChapters(workspace.id));
    setCharacters(await getCharacters(workspace.id));
  }, [workspace.id]);

  useEffect(() => {
    load();
  }, [load]);

  const activeChapter = chapters.find((c) => c.id === activeChapterId);

  function handleSelect(chapter: Chapter) {
    setActiveChapterId(chapter.id);
    setEditingContent(chapter.content);
    setStreamText("");
  }

  function handleGenerate(chapter: Chapter) {
    if (generating) return;
    setActiveChapterId(chapter.id);
    setGenerating(true);
    setStreamText("");
    setEditingContent("");

    const prevChapters = chapters
      .filter((c) => c.orderIndex < chapter.orderIndex)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((c) => ({ title: c.title, summary: c.summary || c.content?.slice(0, 200) || "" }));

    generateChapter(
      chapter.title,
      chapter.summary,
      {
        title: workspace.title,
        genre: workspace.genre,
        styleGuide: workspace.styleGuide,
      },
      characters.map((c) => ({
        name: c.name,
        personality: c.personality,
        background: c.background,
      })),
      prevChapters,
      {
        onToken(text) {
          setStreamText((prev) => prev + text);
        },
        async onDone(fullText) {
          const updated = {
            ...chapter,
            content: fullText,
            wordCount: fullText.length,
            status: "written" as ChapterStatus,
            updatedAt: Date.now(),
          };
          await saveChapter(updated);
          setStreamText("");
          setEditingContent(fullText);
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

  async function handleSaveContent() {
    if (!activeChapter) return;
    const updated: Chapter = {
      ...activeChapter,
      content: editingContent,
      wordCount: editingContent.length,
      updatedAt: Date.now(),
      status: activeChapter.status === "writing" ? "written" : activeChapter.status,
    };
    await saveChapter(updated);
    load();
  }

  async function cycleStatus(chapter: Chapter) {
    const idx = statusCycle.indexOf(chapter.status);
    const next = statusCycle[(idx + 1) % statusCycle.length];
    const updated = { ...chapter, status: next, updatedAt: Date.now() };
    await saveChapter(updated);
    load();
  }

  return (
    <div className="flex h-full gap-4">
      {/* Chapter sidebar */}
      <div className="w-64 shrink-0 space-y-1 overflow-auto">
        <h3 className="text-lg font-semibold mb-3">章节列表</h3>
        {chapters.map((ch) => (
          <button
            key={ch.id}
            onClick={() => handleSelect(ch)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              activeChapterId === ch.id
                ? "bg-indigo-600/20 border border-indigo-600/40"
                : "hover:bg-gray-800 border border-transparent"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="truncate font-medium">
                {ch.orderIndex + 1}. {ch.title}
              </span>
              <span className={`text-xs shrink-0 ml-2 ${statusColors[ch.status]}`}>
                {ch.status === "written" || ch.status === "revised" ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <Circle size={14} />
                )}
              </span>
            </div>
            {ch.wordCount > 0 && (
              <span className="text-xs text-gray-600">{ch.wordCount} 字</span>
            )}
          </button>
        ))}
        {chapters.length === 0 && (
          <p className="text-sm text-gray-500">先在大纲页面生成章节</p>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {activeChapter ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold">
                  {activeChapter.orderIndex + 1}. {activeChapter.title}
                </h3>
                <span className="text-xs text-gray-500">
                  {statusLabels[activeChapter.status]} ·{" "}
                  {activeChapter.wordCount} 字
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleGenerate(activeChapter)}
                  disabled={generating}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:opacity-50"
                >
                  <Sparkles size={16} />
                  {generating ? "生成中..." : activeChapter.content ? "重新生成" : "AI 生成"}
                </button>
                {activeChapter.content && (
                  <button
                    onClick={() => cycleStatus(activeChapter)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-800 rounded-lg hover:bg-gray-700"
                  >
                    <CheckCircle2 size={16} />
                    {statusLabels[statusCycle[(statusCycle.indexOf(activeChapter.status) + 1) % 4]]}
                  </button>
                )}
              </div>
            </div>

            {/* Content area */}
            {streamText ? (
              <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-6 overflow-auto">
                <pre className="text-sm text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
                  {streamText}
                </pre>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className="flex-1 w-full bg-gray-900 border border-gray-800 rounded-xl p-6 text-sm text-gray-200 leading-relaxed focus:outline-none focus:border-indigo-500/50 resize-none font-sans"
                  placeholder="在此编辑章节内容..."
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-600">
                    {editingContent.length} 字
                  </span>
                  <button
                    onClick={handleSaveContent}
                    className="px-4 py-1.5 text-sm bg-indigo-600 rounded-lg hover:bg-indigo-500"
                  >
                    保存修改
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            选择一个章节开始写作
          </div>
        )}
      </div>
    </div>
  );
}