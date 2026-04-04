"use client";
import { useState, useCallback } from "react";
import { Web3Hack } from "@/data/hacks";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  NodeProps,
  Handle,
  Position,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

const NODE_COLORS = {
  attacker: { bg: "rgba(255,60,60,0.15)", border: "rgba(255,60,60,0.5)", text: "#ff6b6b" },
  contract: { bg: "rgba(0,255,255,0.1)", border: "rgba(0,255,255,0.4)", text: "#00ffff" },
  pool: { bg: "rgba(0,255,128,0.1)", border: "rgba(0,255,128,0.4)", text: "#00ff80" },
  bridge: { bg: "rgba(160,80,255,0.15)", border: "rgba(160,80,255,0.5)", text: "#c084fc" },
  oracle: { bg: "rgba(255,200,0,0.1)", border: "rgba(255,200,0,0.4)", text: "#fcd34d" },
  result: { bg: "rgba(255,60,60,0.2)", border: "rgba(255,60,60,0.6)", text: "#f87171" },
};

function CustomNode({ data }: NodeProps) {
  const colors = NODE_COLORS[data.type as keyof typeof NODE_COLORS] ?? NODE_COLORS.contract;
  return (
    <div
      className="px-3 py-2 rounded-lg text-center cursor-pointer"
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        boxShadow: `0 0 12px ${colors.border}`,
        minWidth: 100,
        maxWidth: 160,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: colors.border }} />
      <div className="text-xs font-bold" style={{ color: colors.text }}>{data.label}</div>
      {data.detail && (
        <div className="text-[10px] mt-0.5" style={{ color: colors.text, opacity: 0.7 }}>{data.detail}</div>
      )}
      <Handle type="source" position={Position.Right} style={{ background: colors.border }} />
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

export function AttackFlowTab({ hack }: { hack: Web3Hack }) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const nodes: Node[] = hack.attackFlow.nodes.map((n) => ({
    id: n.id,
    type: "custom",
    position: { x: n.x, y: n.y },
    data: { label: n.label, detail: n.detail, type: n.type },
  }));

  const edges: Edge[] = hack.attackFlow.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    animated: e.animated ?? false,
    markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(0,255,255,0.6)" },
    style: {
      stroke: e.animated ? "rgba(0,255,255,0.7)" : "rgba(0,255,255,0.35)",
      strokeWidth: 1.5,
    },
    labelStyle: { fill: "rgba(180,220,255,0.8)", fontSize: 10 },
    labelBgStyle: { fill: "rgba(10,10,20,0.8)", stroke: "rgba(0,255,255,0.2)" },
    labelBgBorderRadius: 3,
    labelBgPadding: [4, 2] as [number, number],
  }));

  const selectedNodeData = hack.attackFlow.nodes.find((n) => n.id === selectedNode);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id === selectedNode ? null : node.id);
  }, [selectedNode]);

  return (
    <div className="py-6 space-y-4">
      <p className="text-xs text-muted-foreground">
        Click any node for more detail. Animated edges show the exploit path.
      </p>

      <div className="flex gap-4">
        {/* Flow diagram */}
        <div className="flex-1 rounded-lg border border-border/50 overflow-hidden" style={{ height: 400 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background color="rgba(0,255,255,0.05)" gap={30} />
            <Controls
              style={{
                background: "rgba(10,10,20,0.9)",
                border: "1px solid rgba(0,255,255,0.2)",
              }}
            />
            <MiniMap
              style={{
                background: "rgba(10,10,20,0.8)",
                border: "1px solid rgba(0,255,255,0.2)",
              }}
              nodeColor={(n: Node) => {
                const t = n.data?.type as string;
                const c = NODE_COLORS[t as keyof typeof NODE_COLORS];
                return c?.border ?? "rgba(0,255,255,0.4)";
              }}
            />
          </ReactFlow>
        </div>

        {/* Detail panel */}
        <div className="w-60 shrink-0 rounded-lg border border-border/50 bg-card p-4">
          {selectedNodeData ? (
            <>
              <div className="text-xs font-bold text-foreground mb-1">{selectedNodeData.label}</div>
              <div className="text-[10px] text-muted-foreground mb-3">{selectedNodeData.detail}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Type</div>
              <div className="text-xs text-foreground capitalize mb-3">{selectedNodeData.type}</div>
              <div className="text-[10px] text-muted-foreground border-t border-border/50 pt-2 mt-2">
                Click another node to explore, or click the same node to deselect.
              </div>
            </>
          ) : (
            <>
              <div className="text-xs font-semibold text-foreground mb-3">Node Legend</div>
              {Object.entries(NODE_COLORS).map(([type, c]) => (
                <div key={type} className="flex items-center gap-2 mb-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.border }} />
                  <span className="text-[11px] text-muted-foreground capitalize">{type}</span>
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground mt-3 border-t border-border/50 pt-2">
                Click a node to see details and prevention tips.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Edge list */}
      <div className="rounded-lg border border-border/50 bg-card p-4">
        <div className="text-xs font-semibold text-foreground mb-3">Call Sequence</div>
        <div className="space-y-2">
          {hack.attackFlow.edges.map((e, i) => {
            const src = hack.attackFlow.nodes.find((n) => n.id === e.source);
            const tgt = hack.attackFlow.nodes.find((n) => n.id === e.target);
            return (
              <div key={e.id} className="flex items-center gap-2 text-xs">
                <span className="w-4 h-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[9px] shrink-0">
                  {i + 1}
                </span>
                <span className="text-cyan-300 font-mono">{src?.label}</span>
                <span className="text-muted-foreground">→</span>
                <span className="text-green-300 font-mono">{tgt?.label}</span>
                <span className="text-muted-foreground text-[10px]">· {e.label}</span>
                {e.animated && (
                  <span className="ml-auto text-[9px] bg-red-400/10 border border-red-400/30 text-red-400 px-1.5 py-0.5 rounded">
                    EXPLOIT PATH
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
