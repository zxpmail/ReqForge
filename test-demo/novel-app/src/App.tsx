import { useState, useEffect, useCallback } from "react";
import type { Workspace, View } from "./types";
import { getAllWorkspaces } from "./db";
import Sidebar from "./components/Sidebar";
import WorkspaceView from "./components/WorkspaceView";

export default function App() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [view, setView] = useState<View>("characters");

  const refresh = useCallback(async () => {
    const ws = await getAllWorkspaces();
    setWorkspaces(ws);
    if (activeId && !ws.find((w) => w.id === activeId)) {
      setActiveId(null);
    }
  }, [activeId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const activeWorkspace = workspaces.find((w) => w.id === activeId) || null;

  return (
    <div className="flex h-screen">
      <Sidebar
        workspaces={workspaces}
        activeId={activeId}
        onSelect={(id) => {
          setActiveId(id);
          setView("characters");
        }}
        onRefresh={refresh}
      />
      <main className="flex-1 overflow-auto">
        {activeWorkspace ? (
          <WorkspaceView
            workspace={activeWorkspace}
            view={view}
            onViewChange={setView}
            onRefresh={refresh}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            选择一个作品开始创作
          </div>
        )}
      </main>
    </div>
  );
}
