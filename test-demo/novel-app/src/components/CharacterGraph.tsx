import { useState, useEffect, useCallback, useRef } from "react";
import * as d3 from "d3";
import { Sparkles, Plus, Trash2 } from "lucide-react";
import type { Character, Relationship } from "../types";
import { getCharacters, getRelationships, saveRelationship, deleteRelationship } from "../db";
import { generateRelationships } from "../ai";

interface Props {
  workspaceId: string;
  workspace: { title: string; genre: string; description: string };
}

const RELATION_TYPES = [
  "情侣", "朋友", "仇人", "亲属", "同事",
  "师生", "对手", "主仆", "暗恋", "知己",
  "队友", "上下级",
];

const RELATION_COLORS: Record<string, string> = {
  "情侣": "#ec4899",
  "暗恋": "#f472b6",
  "仇人": "#ef4444",
  "对手": "#f97316",
  "朋友": "#22d3ee",
  "知己": "#06b6d4",
  "亲属": "#a78bfa",
  "师生": "#818cf8",
  "同事": "#6b7280",
  "队友": "#10b981",
  "主仆": "#8b5cf6",
  "上下级": "#6b7280",
};

function getEdgeColor(type: string) {
  return RELATION_COLORS[type] || "#6b7280";
}

interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  type: string;
  description: string;
  id: string;
}

export default function CharacterGraph({ workspaceId, workspace }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [generating, setGenerating] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [selectedRel, setSelectedRel] = useState<Relationship | null>(null);
  const [adding, setAdding] = useState(false);
  const [newRel, setNewRel] = useState({ sourceId: "", targetId: "", type: "朋友", description: "" });

  const load = useCallback(async () => {
    setCharacters(await getCharacters(workspaceId));
    setRelationships(await getRelationships(workspaceId));
  }, [workspaceId]);

  useEffect(() => {
    load();
  }, [load]);

  // Render D3 graph
  useEffect(() => {
    if (!svgRef.current || characters.length === 0) return;
    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight || 600;
    svg.selectAll("*").remove();

    const charMap = new Map(characters.map((c) => [c.id, c]));
    const nodes: D3Node[] = characters.map((c) => ({ id: c.id, name: c.name }));
    const links: D3Link[] = relationships
      .filter((r) => charMap.has(r.sourceId) && charMap.has(r.targetId))
      .map((r) => ({
        source: r.sourceId,
        target: r.targetId,
        type: r.type,
        description: r.description,
        id: r.id,
      }));

    // Color palette for nodes
    const color = d3.scaleOrdinal(d3.schemeSet2);

    // Container group with zoom
    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);

    // Arrow marker
    svg.append("defs").selectAll("marker")
      .data(RELATION_TYPES)
      .enter()
      .append("marker")
      .attr("id", (d) => `arrow-${d}`)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 22)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", (d) => getEdgeColor(d));

    // Links
    const link = g.append("g")
      .selectAll<SVGLineElement, D3Link>("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", (d) => getEdgeColor(d.type))
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.7)
      .attr("marker-end", (d) => `url(#arrow-${d.type})`)
      .style("cursor", "pointer")
      .on("click", (_event, d) => {
        const rel = relationships.find((r) => r.id === d.id);
        if (rel) setSelectedRel(rel);
      });

    // Link labels
    const linkLabel = g.append("g")
      .selectAll<SVGTextElement, D3Link>("text")
      .data(links)
      .enter()
      .append("text")
      .text((d) => d.type)
      .attr("font-size", "11px")
      .attr("fill", (d) => getEdgeColor(d.type))
      .attr("text-anchor", "middle")
      .attr("dy", "-6")
      .style("pointer-events", "none");

    // Nodes
    const node = g.append("g")
      .selectAll<SVGGElement, D3Node>("g")
      .data(nodes)
      .enter()
      .append("g")
      .style("cursor", "grab");

    node.append("circle")
      .attr("r", 8)
      .attr("fill", (_, i) => color(String(i)))
      .attr("stroke", "#1f2937")
      .attr("stroke-width", 2);

    node.append("text")
      .text((d) => d.name)
      .attr("x", 12)
      .attr("y", 4)
      .attr("font-size", "12px")
      .attr("fill", "#e5e7eb")
      .style("pointer-events", "none")
      .style("text-shadow", "0 1px 3px rgba(0,0,0,0.8)");

    // Simulation
    const simulation = d3.forceSimulation<D3Node>(nodes)
      .force("link", d3.forceLink<D3Node, D3Link>(links).id((d) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-250))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as D3Node).x!)
        .attr("y1", (d) => (d.source as D3Node).y!)
        .attr("x2", (d) => (d.target as D3Node).x!)
        .attr("y2", (d) => (d.target as D3Node).y!);
      linkLabel
        .attr("x", (d) => ((d.source as D3Node).x! + (d.target as D3Node).x!) / 2)
        .attr("y", (d) => ((d.source as D3Node).y! + (d.target as D3Node).y!) / 2);
      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    // Drag
    const drag = d3.drag<SVGGElement, D3Node>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
    node.call(drag);

    return () => { simulation.stop(); };
  }, [characters, relationships]);

  // AI generate
  function handleGenerate() {
    if (generating || characters.length < 2) return;
    setGenerating(true);
    setStreamText("");

    generateRelationships(
      { title: workspace.title, genre: workspace.genre, description: workspace.description },
      characters.map((c) => ({
        id: c.id,
        name: c.name,
        personality: c.personality,
        background: c.background,
        traits: c.traits,
      })),
      {
        onToken(text) { setStreamText((prev) => prev + text); },
        async onDone(fullText) {
          const lines = fullText.split("\n");
          const now = Date.now();
          for (const line of lines) {
            const parts = line.trim().split("|");
            if (parts.length >= 3) {
              const [sourceId, targetId, type, ...descParts] = parts;
              if (!sourceId || !targetId) continue;
              // Skip duplicates
              const existing = relationships.find(
                (r) =>
                  (r.sourceId === sourceId && r.targetId === targetId) ||
                  (r.sourceId === targetId && r.targetId === sourceId)
              );
              if (existing) continue;
              const rel: Relationship = {
                id: crypto.randomUUID(),
                workspaceId,
                sourceId,
                targetId,
                type: type.trim(),
                description: descParts.join("|").trim() || `${type}关系`,
              };
              await saveRelationship(rel);
            }
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

  async function handleAddRelation() {
    if (!newRel.sourceId || !newRel.targetId || newRel.sourceId === newRel.targetId) return;
    const rel: Relationship = {
      id: crypto.randomUUID(),
      workspaceId,
      sourceId: newRel.sourceId,
      targetId: newRel.targetId,
      type: newRel.type,
      description: newRel.description || `${newRel.type}关系`,
    };
    await saveRelationship(rel);
    setAdding(false);
    setNewRel({ sourceId: "", targetId: "", type: "朋友", description: "" });
    load();
  }

  async function handleDeleteRel(id: string) {
    await deleteRelationship(id);
    setSelectedRel(null);
    load();
  }

  return (
    <div className="flex gap-4 h-full">
      {/* Graph */}
      <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl relative min-h-[500px]">
        {characters.length < 2 ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
            至少需要 2 个人物才能生成关系网
          </div>
        ) : (
          <svg ref={svgRef} className="w-full h-full" style={{ minHeight: 500 }} />
        )}
      </div>

      {/* Side panel */}
      <div className="w-72 shrink-0 space-y-3">
        <div className="flex gap-2">
          <button
            onClick={handleGenerate}
            disabled={generating || characters.length < 2}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:opacity-50"
          >
            <Sparkles size={16} />
            {generating ? "分析中..." : "AI 推断关系"}
          </button>
          <button
            onClick={() => setAdding(true)}
            className="px-3 py-2 text-sm bg-gray-800 rounded-lg hover:bg-gray-700"
          >
            <Plus size={16} />
          </button>
        </div>

        {streamText && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
            <pre className="text-xs text-gray-400 whitespace-pre-wrap font-sans">{streamText}</pre>
          </div>
        )}

        {/* Add form */}
        {adding && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 space-y-2">
            <select
              value={newRel.sourceId}
              onChange={(e) => setNewRel({ ...newRel, sourceId: e.target.value })}
              className="w-full px-2 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg"
            >
              <option value="">选择人物 A</option>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={newRel.targetId}
              onChange={(e) => setNewRel({ ...newRel, targetId: e.target.value })}
              className="w-full px-2 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg"
            >
              <option value="">选择人物 B</option>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={newRel.type}
              onChange={(e) => setNewRel({ ...newRel, type: e.target.value })}
              className="w-full px-2 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg"
            >
              {RELATION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input
              placeholder="关系描述（可选）"
              value={newRel.description}
              onChange={(e) => setNewRel({ ...newRel, description: e.target.value })}
              className="w-full px-2 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg"
            />
            <div className="flex gap-2">
              <button onClick={handleAddRelation} className="flex-1 px-2 py-1.5 text-sm bg-indigo-600 rounded-lg hover:bg-indigo-500">添加</button>
              <button onClick={() => setAdding(false)} className="px-2 py-1.5 text-sm bg-gray-800 rounded-lg hover:bg-gray-700">取消</button>
            </div>
          </div>
        )}

        {/* Relationship list */}
        <div className="space-y-1 max-h-80 overflow-auto">
          {relationships.length === 0 && !adding && (
            <p className="text-gray-500 text-xs text-center py-4">
              还没有关系，点击"AI 推断关系"自动生成
            </p>
          )}
          {relationships.map((r) => {
            const source = characters.find((c) => c.id === r.sourceId);
            const target = characters.find((c) => c.id === r.targetId);
            return (
              <div
                key={r.id}
                onClick={() => setSelectedRel(r)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer ${
                  selectedRel?.id === r.id ? "bg-indigo-600/20 border border-indigo-600/40" : "bg-gray-900 border border-gray-800 hover:bg-gray-800"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <span className="text-gray-200">{source?.name || "?"}</span>
                  <span className="text-gray-600 mx-1">——</span>
                  <span className="text-gray-200">{target?.name || "?"}</span>
                  <span className="text-xs ml-1" style={{ color: getEdgeColor(r.type) }}>({r.type})</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteRel(r.id); }}
                  className="p-1 text-gray-600 hover:text-red-400 shrink-0"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
