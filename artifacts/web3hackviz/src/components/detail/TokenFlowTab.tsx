"use client";
import { useEffect, useRef } from "react";
import { Hack } from "@/data/hacks";
import * as d3 from "d3";

const NODE_COLORS: Record<string, string> = {
  attacker: "#ef4444",
  vault: "#06b6d4",
  pool: "#22c55e",
  bridge: "#a855f7",
  multisig: "#f59e0b",
  drain: "#f87171",
};

const NODE_ICONS: Record<string, string> = {
  attacker: "⚡",
  vault: "🏦",
  pool: "💧",
  bridge: "🌉",
  multisig: "🔐",
  drain: "💸",
};

function bezierPoint(
  t: number,
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number
) {
  const mt = 1 - t;
  return {
    x: mt * mt * mt * x0 + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x3,
    y: mt * mt * mt * y0 + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y3,
  };
}

function buildLayout(
  nodes: { id: string }[],
  links: { source: string; target: string }[],
  width: number,
  height: number,
  nodeW: number
) {
  const nodeLayer: Record<string, number> = {};
  nodes.forEach((n) => { nodeLayer[n.id] = 0; });

  // Add safety check to prevent infinite loops
  let maxIterations = nodes.length * links.length + 10;
  let changed = true;
  let iterations = 0;
  
  while (changed && iterations < maxIterations) {
    changed = false;
    links.forEach((l) => {
      if ((nodeLayer[l.target] ?? 0) <= (nodeLayer[l.source] ?? 0)) {
        nodeLayer[l.target] = (nodeLayer[l.source] ?? 0) + 1;
        changed = true;
      }
    });
    iterations++;
  }

  const numLayers = Math.max(...Object.values(nodeLayer), 0) + 1;
  const layerGroups: Record<number, string[]> = {};
  nodes.forEach((n) => {
    const l = nodeLayer[n.id] ?? 0;
    if (!layerGroups[l]) layerGroups[l] = [];
    layerGroups[l].push(n.id);
  });

  const PAD = 70;
  const posMap: Record<string, { x: number; y: number }> = {};

  Object.entries(layerGroups).forEach(([layerStr, ids]) => {
    const layer = parseInt(layerStr);
    const x =
      numLayers === 1
        ? width / 2
        : PAD + layer * ((width - PAD * 2) / Math.max(numLayers - 1, 1));
    ids.forEach((id, i) => {
      posMap[id] = { x, y: (height / (ids.length + 1)) * (i + 1) };
    });
  });

  return { posMap, numLayers };
}

export function TokenFlowTab({ hack }: { hack: Hack }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const timerRef = useRef<d3.Timer | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    if (timerRef.current) timerRef.current.stop();

    try {
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      const container = svgRef.current.parentElement;
      const width = container ? Math.max(container.clientWidth - 4, 500) : 700;
      const height = 420;
      const NODE_W = 134;
      const NODE_H = 54;

      svg.attr("width", width).attr("height", height);

      const nodes = hack.tokenFlowNodes.map((n) => ({ ...n }));
      const links = hack.tokenFlowLinks.map((l) => ({ ...l }));

      // Validate data
      if (!nodes.length || !links.length) {
        svg.append("text")
          .attr("x", width / 2)
          .attr("y", height / 2)
          .attr("text-anchor", "middle")
          .attr("fill", "#666")
          .text("No token flow data available");
        return;
      }

      const { posMap } = buildLayout(nodes, links, width, height, NODE_W);

    const defs = svg.append("defs");

    const glowF = defs
      .append("filter")
      .attr("id", "tfglow")
      .attr("x", "-40%")
      .attr("y", "-40%")
      .attr("width", "180%")
      .attr("height", "180%");
    glowF
      .append("feGaussianBlur")
      .attr("in", "SourceGraphic")
      .attr("stdDeviation", "4")
      .attr("result", "blur");
    const feMerge = glowF.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "blur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    const mainG = svg.append("g").attr("class", "zoom-layer");
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        mainG.attr("transform", event.transform);
      });
    svg.call(zoom);

    const maxVal = Math.max(...links.map((l) => l.value), 1);

    type BezierEntry = {
      link: (typeof links)[0];
      sx: number; sy: number;
      tx: number; ty: number;
      cx1: number; cy1: number;
      cx2: number; cy2: number;
      color: string;
      strokeW: number;
    };

    const bezierData: BezierEntry[] = links
      .map((link) => {
        const src = posMap[link.source];
        const tgt = posMap[link.target];
        if (!src || !tgt) return null;

        const sx = src.x + NODE_W / 2;
        const sy = src.y;
        const tx = tgt.x - NODE_W / 2;
        const ty = tgt.y;
        const dx = tx - sx;

        const srcNode = nodes.find((n) => n.id === link.source);
        const color = NODE_COLORS[srcNode?.type ?? "vault"] ?? "#06b6d4";

        return {
          link,
          sx, sy, tx, ty,
          cx1: sx + dx * 0.45, cy1: sy,
          cx2: tx - dx * 0.45, cy2: ty,
          color,
          strokeW: Math.max(2, (link.value / maxVal) * 14),
        };
      })
      .filter(Boolean) as BezierEntry[];

    let hoveredId: string | null = null;
    let hoveredType: "node" | "edge" | null = null;
    let hoveredSrc: string | null = null;
    let hoveredTgt: string | null = null;

    const updateHighlighting = () => {
      if (!hoveredType) {
        svg.selectAll(".flow-node").transition().duration(200).attr("opacity", 1);
        svg.selectAll(".flow-edge").transition().duration(200).attr("opacity", 1);
        svg.selectAll(".flow-particle").transition().duration(200).attr("opacity", 0.95);
        return;
      }

      svg.selectAll(".flow-node").transition().duration(200).attr("opacity", 0.3);
      svg.selectAll(".flow-edge").transition().duration(200).attr("opacity", 0.15);
      svg.selectAll(".flow-particle").transition().duration(200).attr("opacity", 0);

      if (hoveredType === "node" && hoveredId) {
        // Highlight hovered node
        svg.select(`.node-${hoveredId}`).transition().duration(200).attr("opacity", 1);
        // Highlight connected edges and their opposite nodes
        svg.selectAll(`.edge-src-${hoveredId}, .edge-tgt-${hoveredId}`)
          .transition().duration(200).attr("opacity", 1)
          .each(function() {
            const classList = Array.from((this as Element).classList);
            classList.forEach(c => {
              if (c.startsWith("edge-src-")) svg.select(`.node-${c.replace("edge-src-", "")}`).transition().duration(200).attr("opacity", 1);
              if (c.startsWith("edge-tgt-")) svg.select(`.node-${c.replace("edge-tgt-", "")}`).transition().duration(200).attr("opacity", 1);
            });
          });
        svg.selectAll(`.particle-src-${hoveredId}, .particle-tgt-${hoveredId}`).transition().duration(200).attr("opacity", 0.95);
      } else if (hoveredType === "edge" && hoveredSrc && hoveredTgt) {
        svg.select(`.edge-src-${hoveredSrc}.edge-tgt-${hoveredTgt}`).transition().duration(200).attr("opacity", 1);
        svg.select(`.node-${hoveredSrc}`).transition().duration(200).attr("opacity", 1);
        svg.select(`.node-${hoveredTgt}`).transition().duration(200).attr("opacity", 1);
        svg.selectAll(`.particle-src-${hoveredSrc}.particle-tgt-${hoveredTgt}`).transition().duration(200).attr("opacity", 0.95);
      }
    };

    bezierData.forEach((b, i) => {
      const pathD = `M ${b.sx} ${b.sy} C ${b.cx1} ${b.cy1}, ${b.cx2} ${b.cy2}, ${b.tx} ${b.ty}`;

      const edgeG = mainG.append("g")
        .attr("class", `flow-edge edge-src-${b.link.source} edge-tgt-${b.link.target}`)
        .style("cursor", "pointer")
        .on("mouseenter", () => {
          hoveredType = "edge";
          hoveredSrc = b.link.source;
          hoveredTgt = b.link.target;
          updateHighlighting();
        })
        .on("mouseleave", () => {
          hoveredType = null;
          hoveredSrc = null;
          hoveredTgt = null;
          updateHighlighting();
        });

      // Hit area
      edgeG.append("path")
        .attr("d", pathD)
        .attr("fill", "none")
        .attr("stroke", "transparent")
        .attr("stroke-width", b.strokeW + 20);

      edgeG
        .append("path")
        .attr("d", pathD)
        .attr("fill", "none")
        .attr("stroke", b.color)
        .attr("stroke-width", b.strokeW + 8)
        .attr("opacity", 0.1);

      const markerId = `arr${hack.id}${i}`;
      const marker = defs
        .append("marker")
        .attr("id", markerId)
        .attr("markerWidth", 10)
        .attr("markerHeight", 8)
        .attr("refX", 8)
        .attr("refY", 4)
        .attr("orient", "auto");
      marker.append("polygon").attr("points", "0 0, 10 4, 0 8").attr("fill", b.color);

      edgeG
        .append("path")
        .attr("d", pathD)
        .attr("fill", "none")
        .attr("stroke", b.color)
        .attr("stroke-width", b.strokeW)
        .attr("opacity", 0.7)
        .attr("stroke-linecap", "round")
        .attr("marker-end", `url(#${markerId})`);

      const midP = bezierPoint(0.5, b.sx, b.sy, b.cx1, b.cy1, b.cx2, b.cy2, b.tx, b.ty);
      const amtStr =
        b.link.value >= 1000
          ? `$${(b.link.value / 1000).toFixed(2)}B`
          : `$${b.link.value}M`;

      const labelG = edgeG.append("g");
      labelG
        .append("rect")
        .attr("x", midP.x - 42)
        .attr("y", midP.y - 25)
        .attr("width", 84)
        .attr("height", 34)
        .attr("rx", 5)
        .attr("fill", "rgba(0,0,0,0.85)")
        .attr("stroke", b.color)
        .attr("stroke-width", 0.8);
      labelG
        .append("text")
        .attr("x", midP.x)
        .attr("y", midP.y - 12)
        .attr("text-anchor", "middle")
        .attr("fill", "rgba(170,205,235,0.85)")
        .attr("font-size", 9)
        .text(b.link.label);
      labelG
        .append("text")
        .attr("x", midP.x)
        .attr("y", midP.y + 4)
        .attr("text-anchor", "middle")
        .attr("fill", b.color)
        .attr("font-size", 11)
        .attr("font-weight", "bold")
        .text(amtStr);
    });

    const particles = bezierData.map((b) =>
      mainG
        .append("circle")
        .attr("class", `flow-particle particle-src-${b.link.source} particle-tgt-${b.link.target}`)
        .attr("r", Math.max(4, b.strokeW * 0.55))
        .attr("fill", b.color)
        .attr("opacity", 0.95)
        .attr("filter", "url(#tfglow)")
        .attr("cx", b.sx)
        .attr("cy", b.sy)
    );

    const startTime = Date.now();
    const PERIOD = bezierData.map((_, i) => 2200 + i * 350);

    timerRef.current = d3.timer(() => {
      const now = Date.now();
      bezierData.forEach((b, i) => {
        const t = ((now - startTime) % PERIOD[i]) / PERIOD[i];
        const p = bezierPoint(t, b.sx, b.sy, b.cx1, b.cy1, b.cx2, b.cy2, b.tx, b.ty);
        particles[i].attr("cx", p.x).attr("cy", p.y);
      });
    });

    nodes.forEach((node) => {
      const pos = posMap[node.id];
      if (!pos) return;
      const color = NODE_COLORS[node.type] ?? "#06b6d4";
      const icon = NODE_ICONS[node.type] ?? "●";

      const g = mainG
        .append("g")
        .attr("class", `flow-node node-${node.id}`)
        .style("cursor", "pointer")
        .attr("transform", `translate(${pos.x - NODE_W / 2}, ${pos.y - NODE_H / 2})`)
        .on("mouseenter", () => {
          hoveredType = "node";
          hoveredId = node.id;
          updateHighlighting();
        })
        .on("mouseleave", () => {
          hoveredType = null;
          hoveredId = null;
          updateHighlighting();
        });

      g.append("rect")
        .attr("x", -4).attr("y", -4)
        .attr("width", NODE_W + 8).attr("height", NODE_H + 8)
        .attr("rx", 12)
        .attr("fill", color)
        .attr("opacity", 0.08)
        .attr("filter", "url(#tfglow)");

      g.append("rect")
        .attr("width", NODE_W).attr("height", NODE_H)
        .attr("rx", 8)
        .attr("fill", "rgba(4, 8, 18, 0.92)")
        .attr("stroke", color)
        .attr("stroke-width", 1.5);

      g.append("rect")
        .attr("width", 36).attr("height", NODE_H)
        .attr("rx", 8)
        .attr("fill", `${color}20`);
      g.append("rect")
        .attr("x", 28).attr("width", 8).attr("height", NODE_H)
        .attr("fill", `${color}20`);

      g.append("text")
        .attr("x", 18).attr("y", NODE_H / 2 + 1)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", 16)
        .text(icon);

      const lines = node.label.split("\n");
      const startY = lines.length === 1 ? NODE_H / 2 + 1 : NODE_H / 2 - 6;
      lines.forEach((line, li) => {
        g.append("text")
          .attr("x", NODE_W / 2 + 12)
          .attr("y", startY + li * 14)
          .attr("text-anchor", "middle")
          .attr(
            "dominant-baseline",
            li === 0 && lines.length === 1 ? "middle" : "auto"
          )
          .attr("fill", li === 0 ? color : "rgba(150,195,225,0.8)")
          .attr("font-size", li === 0 ? 10 : 9)
          .attr("font-weight", li === 0 ? "bold" : "normal")
          .text(line);
      });
    });

    return () => {
      if (timerRef.current) timerRef.current.stop();
    };
    } catch (error) {
      console.error("TokenFlowTab error:", error);
      if (svgRef.current) {
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();
        svg.append("text")
          .attr("x", 350)
          .attr("y", 210)
          .attr("text-anchor", "middle")
          .attr("fill", "#666")
          .text("Error loading token flow visualization");
      }
      return () => {
        if (timerRef.current) timerRef.current.stop();
      };
    }
  }, [hack]);

  return (
    <div className="py-6 space-y-4">
      <p className="text-xs text-muted-foreground">
        Left-to-right fund flow — edge width reflects relative value; glowing particles animate along each attack path in real-time.
      </p>

      <div className="rounded-lg border border-border/50 bg-black/40 overflow-x-auto">
        <svg
          ref={svgRef}
          style={{ display: "block", minHeight: 420, width: "100%" }}
        />
      </div>

      <div className="flex flex-wrap gap-4">
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ background: color }} />
            <span className="text-[11px] text-muted-foreground capitalize">
              {NODE_ICONS[type]} {type}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/50">
              <th className="px-3 py-2 text-left text-muted-foreground font-medium">From</th>
              <th className="px-3 py-2 text-left text-muted-foreground font-medium">To</th>
              <th className="px-3 py-2 text-left text-muted-foreground font-medium">Action</th>
              <th className="px-3 py-2 text-right text-muted-foreground font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {hack.tokenFlowLinks.map((link, i) => {
              const src = hack.tokenFlowNodes.find((n) => n.id === link.source);
              const tgt = hack.tokenFlowNodes.find((n) => n.id === link.target);
              return (
                <tr
                  key={i}
                  className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-3 py-2">
                    <span style={{ color: NODE_COLORS[src?.type ?? "vault"] }}>
                      {src?.label.split("\n")[0]}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span style={{ color: NODE_COLORS[tgt?.type ?? "drain"] }}>
                      {tgt?.label.split("\n")[0]}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{link.label}</td>
                  <td className="px-3 py-2 text-right font-mono text-red-400">
                    {link.value >= 1000
                      ? `$${(link.value / 1000).toFixed(2)}B`
                      : `$${link.value}M`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
