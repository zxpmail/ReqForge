import { useState } from "react";
import { Download, Upload, X } from "lucide-react";
import { exportWorkspace, importWorkspace } from "../db";

function sanitizeFilename(name: string) {
  return name.replace(/[\/\\:*?"<>|]/g, "_");
}

interface Props {
  workspaceId: string;
  onClose: () => void;
  onImported?: () => void;
}

export default function DataExport({ workspaceId, onClose, onImported }: Props) {
  const [importMsg, setImportMsg] = useState("");

  async function handleExport() {
    const data = await exportWorkspace(workspaceId);
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sanitizeFilename(data.workspace.title)}-backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleExportMarkdown() {
    const data = await exportWorkspace(workspaceId);
    if (!data) return;
    let md = `# ${data.workspace.title}\n\n题材：${data.workspace.genre}\n\n`;

    if (data.characters?.length) {
      md += "## 人物\n\n";
      for (const c of data.characters) {
        md += `### ${c.name}\n`;
        if (c.age) md += `- 年龄：${c.age}\n`;
        if (c.personality) md += `- 性格：${c.personality}\n`;
        if (c.background) md += `- 背景：${c.background}\n`;
        md += "\n";
      }
    }

    md += "## 正文\n\n";
    for (const ch of data.chapters) {
      md += `### 第${ch.orderIndex + 1}章 ${ch.title}\n\n`;
      if (ch.summary) md += `> ${ch.summary}\n\n`;
      if (ch.content) md += `${ch.content}\n\n`;
    }

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sanitizeFilename(data.workspace.title)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data.workspace || !Array.isArray(data.characters) || !Array.isArray(data.chapters)) {
          setImportMsg("无效的备份文件");
          return;
        }
        await importWorkspace(data);
        setImportMsg("导入成功！");
        onImported?.();
        setTimeout(() => onClose(), 1000);
      } catch {
        setImportMsg("文件解析失败");
      }
    };
    input.click();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-96 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">导入 / 导出</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-gray-500">
          数据仅保存在浏览器本地。导出备份以防止丢失。
        </p>

        <div className="space-y-2">
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 rounded-lg hover:bg-indigo-500 text-sm"
          >
            <Download size={16} /> 导出 JSON 备份
          </button>
          <button
            onClick={handleExportMarkdown}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 rounded-lg hover:bg-gray-700 text-sm"
          >
            <Download size={16} /> 导出 Markdown
          </button>
          <button
            onClick={handleImport}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 rounded-lg hover:bg-gray-700 text-sm"
          >
            <Upload size={16} /> 导入备份
          </button>
        </div>

        {importMsg && (
          <p className={`text-sm text-center ${importMsg.includes("成功") ? "text-green-400" : "text-yellow-400"}`}>
            {importMsg}
          </p>
        )}
      </div>
    </div>
  );
}