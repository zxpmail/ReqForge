import { useState } from "react";
import { Key, Eye, EyeOff, Cpu } from "lucide-react";
import { getApiKey, setApiKey, getProvider, setProvider, type AIProvider } from "../ai";

const providers: { value: AIProvider; label: string; model: string; keyHint: string; link: string }[] = [
  { value: "deepseek", label: "DeepSeek", model: "deepseek-chat", keyHint: "sk-...", link: "https://platform.deepseek.com/api_keys" },
  { value: "openai", label: "OpenAI", model: "gpt-4o-mini", keyHint: "sk-...", link: "https://platform.openai.com/api-keys" },
  { value: "claude", label: "Claude", model: "claude-sonnet-4-6", keyHint: "sk-ant-...", link: "https://console.anthropic.com/settings/keys" },
];

export default function ApiKeySetup() {
  const [key, setKey] = useState(getApiKey());
  const [provider, setProv] = useState<AIProvider>(getProvider());
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  const current = providers.find((p) => p.value === provider) || providers[0];

  function handleSave() {
    setApiKey(key.trim());
    setProvider(provider);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* AI Provider */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
        <h4 className="font-medium flex items-center gap-2">
          <Cpu size={16} /> AI 模型
        </h4>
        <div className="flex gap-2">
          {providers.map((p) => (
            <button
              key={p.value}
              onClick={() => setProv(p.value)}
              className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                provider === p.value
                  ? "border-indigo-500 bg-indigo-600/20 text-indigo-300"
                  : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
              }`}
            >
              <div className="font-medium">{p.label}</div>
              <div className="text-xs mt-0.5 opacity-70">{p.model}</div>
            </button>
          ))}
        </div>
      </div>

      {/* API Key */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
        <h4 className="font-medium flex items-center gap-2">
          <Key size={16} /> API Key（仅保存在本地）
        </h4>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={show ? "text" : "password"}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={current.keyHint}
              className="w-full px-3 py-2 pr-10 text-sm bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
            />
            <button
              onClick={() => setShow(!show)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-indigo-600 rounded-lg hover:bg-indigo-500"
          >
            {saved ? "已保存" : "保存"}
          </button>
        </div>
        <div className="text-xs text-gray-600">
          获取 {current.label} API Key：{" "}
          <a
            href={current.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:underline"
          >
            {current.link}
          </a>
        </div>
      </div>
    </div>
  );
}
