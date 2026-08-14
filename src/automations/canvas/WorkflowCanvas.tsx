/**
 * WorkflowCanvas — the react-flow surface: palette | canvas | config panel.
 *
 * TWO ARCHITECTURAL DECISIONS THIS FILE ENFORCES
 * ----------------------------------------------
 * 1. LOCAL-FIRST EDITING. react-flow owns node/edge state locally
 *    (`useNodesState`/`useEdgesState`), seeded ONCE from the graph store. The
 *    store is written only when the user hits Save. Driving `nodes` straight
 *    from `useWorkflowGraphs()` would hand react-flow fresh object identities
 *    on every store emit and force a full re-diff of the canvas.
 *
 * 2. RUN STATUS OUT-OF-BAND. Status reaches nodes through RunStatusContext,
 *    never by rewriting `node.data` — see runStatusContext.tsx for why that
 *    matters at a 500ms tick. This component holds the ONE runs-store
 *    subscription for the whole canvas.
 *
 * 3. BELOW `2xl` THE TWO SIDE PANELS OVERLAY THE CANVAS; THEY NEVER SHRINK IT.
 *    The palette (224px) and the inspector (320px) are `shrink-0`, so as a
 *    plain three-column row they take 544px off the content column before the
 *    canvas gets a pixel. With the app shell's rails that left the canvas at a
 *    MEASURED 0px wide at a 771px viewport — nodes invisible, the run log the
 *    only proof the workflow existed. The canvas is the entire point of this
 *    screen, so the panels are the ones that yield: from `2xl` up the layout is
 *    the unchanged three-column row, and below it both panels become absolute
 *    overlays inside this container (`absolute inset-y-0` + `z-20`) so the
 *    canvas keeps the full width at every viewport the app renders at.
 *
 *    The breakpoint is `2xl` (1536px), NOT `xl`. At `xl` the three-column
 *    layout survived down to exactly 1280 — the most common demo-laptop width —
 *    and there the two app rails (64 + 200) plus palette (224) plus inspector
 *    (320) left the canvas a MEASURED 471px, which `fitView` could only fill by
 *    zooming the chain to `scale(0.35)`: present, fitted, and completely
 *    illegible. Not a crash, so it survived the first pass; a projector would
 *    have found it. Overlays from 1536 down mean the canvas gets roughly a
 *    thousand pixels at 1280 and the chain reads at a normal zoom.
 *    Chosen over the repo's other narrow-viewport move — `flex-col lg:flex-row`
 *    stacking (`ConnectorPanel.tsx` L229, `FeedbackPanel.tsx` L489) — because
 *    stacking only converts a width collapse into a height collapse here: this
 *    screen already spends vertical space on a header, the auto-run row, the
 *    checks strip and the run log, and a canvas is the one pane that needs
 *    BOTH dimensions. Same principle as those files (the fixed-width pane
 *    yields), different mechanism for a pane that can't be stacked.
 *
 * `nodeTypes`/`edgeTypes` are module-level constants. Defining them inline
 * would give react-flow a new object identity every render and remount every
 * node on every keystroke — the single best-known react-flow footgun.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { PanelLeftOpen } from "lucide-react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import { useTheme } from "next-themes";

import "@xyflow/react/dist/style.css";
// MUST come after react-flow's own stylesheet — see the file's header.
import "@/automations/canvas/flowTheme.css";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  checkConnection,
  defaultDataForKind,
  canAddKind,
  type WorkflowEdgeModel,
  type WorkflowGraph,
  type WorkflowNode,
  type WorkflowNodeData,
  type WorkflowNodeKind,
} from "@/automations/model";
import { useWorkflowRuns } from "@/automations/runsStore";
import type { RunStepStatus } from "@/automations/runModel";
import { RunStatusContext, type RunStatusValue } from "@/automations/canvas/runStatusContext";
import { NodePalette, PALETTE_DND_MIME } from "@/automations/canvas/NodePalette";
import { NodeConfigPanel } from "@/automations/canvas/NodeConfigPanel";
import { SourceNode } from "@/automations/canvas/nodes/SourceNode";
import { ConditionNode } from "@/automations/canvas/nodes/ConditionNode";
import { ActionNode } from "@/automations/canvas/nodes/ActionNode";
import { NoteNode } from "@/automations/canvas/nodes/NoteNode";
import { PulseEdge } from "@/automations/canvas/edges/PulseEdge";

/** Module-level — see header. All four action kinds share ActionNode. */
const nodeTypes = {
  source: SourceNode,
  condition: ConditionNode,
  markStatus: ActionNode,
  generateVariation: ActionNode,
  addToFolder: ActionNode,
  syncFolderToAccounts: ActionNode,
  note: NoteNode,
} as const;

const edgeTypes = { pulse: PulseEdge } as const;

/* ------------------------------------------------------------------ */
/*  Store <-> react-flow adapters                                      */
/* ------------------------------------------------------------------ */

function toFlowNodes(nodes: WorkflowNode[]): Node[] {
  return nodes.map((n) => ({
    id: n.id,
    type: n.kind,
    position: n.position,
    data: n.data as unknown as Record<string, unknown>,
  }));
}

function toFlowEdges(edges: WorkflowEdgeModel[]): Edge[] {
  return edges.map((e) => ({ id: e.id, source: e.source, target: e.target, type: "pulse" }));
}

function fromFlowNodes(nodes: Node[]): WorkflowNode[] {
  return nodes.map((n) => {
    const data = n.data as unknown as WorkflowNodeData;
    return {
      id: n.id,
      kind: data.kind,
      position: { x: n.position.x, y: n.position.y },
      data,
    };
  });
}

function fromFlowEdges(edges: Edge[]): WorkflowEdgeModel[] {
  return edges.map((e) => ({ id: e.id, source: e.source, target: e.target }));
}

/* ------------------------------------------------------------------ */

export interface WorkflowCanvasHandle {
  getNodes: () => WorkflowNode[];
  getEdges: () => WorkflowEdgeModel[];
}

interface WorkflowCanvasProps {
  graph: WorkflowGraph;
  /** Called on every local edit so the parent can show an unsaved-changes hint
   *  and hand the current graph to Save. */
  onDirtyChange?: (dirty: boolean) => void;
  /** Registers an accessor the parent's Save button reads. */
  onReady?: (handle: WorkflowCanvasHandle) => void;
}

function CanvasInner({ graph, onDirtyChange, onReady }: WorkflowCanvasProps) {
  // Seeded ONCE from the graph (see header decision 1). Remounting on a
  // different workflow is handled by the `key` the parent passes.
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(toFlowNodes(graph.nodes));
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(toFlowEdges(graph.edges));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Only consulted below `2xl`, where the palette is an overlay (header note 3);
  // from `2xl` up the palette is a static column and renders regardless of this.
  // Starts closed so the canvas is what a narrow viewport opens onto.
  const [paletteOpen, setPaletteOpen] = useState(false);

  const { screenToFlowPosition } = useReactFlow();
  const { resolvedTheme } = useTheme();
  const idCounter = useRef(0);

  const markDirty = useCallback(() => onDirtyChange?.(true), [onDirtyChange]);

  // The parent reads current state through this instead of us pushing every
  // keystroke upward (which would re-render the whole builder per character).
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const edgesRef = useRef(edges);
  edgesRef.current = edges;
  const readyRef = useRef(false);
  if (!readyRef.current && onReady) {
    readyRef.current = true;
    onReady({
      getNodes: () => fromFlowNodes(nodesRef.current),
      getEdges: () => fromFlowEdges(edgesRef.current),
    });
  }

  /* ---------------- run status (ONE subscription per canvas) --------- */

  const runs = useWorkflowRuns();
  const runStatus: RunStatusValue = useMemo(() => {
    // Newest run for THIS workflow — a finished run keeps its checkmarks
    // visible, which is what you want right after a demo.
    const run = runs.find((r) => r.workflowId === graph.id);
    if (!run) return { statusByNodeId: {}, activeEdgeIds: new Set(), isRunning: false };

    const statusByNodeId: Record<string, RunStepStatus> = {};
    for (const step of run.steps) statusByNodeId[step.nodeId] = step.status;

    // An edge is "active" when its SOURCE step has completed and its target is
    // running or queued — that's the segment the signal is travelling along.
    const activeEdgeIds = new Set<string>();
    if (run.status === "running") {
      for (const e of edgesRef.current) {
        if (statusByNodeId[e.source] === "done" && statusByNodeId[e.target] === "running") {
          activeEdgeIds.add(e.id);
        }
      }
    }

    return { statusByNodeId, activeEdgeIds, isRunning: run.status === "running" };
  }, [runs, graph.id]);

  // Edges carry `active` in data; the edge component itself stays dumb.
  const decoratedEdges = useMemo(
    () =>
      edges.map((e) =>
        runStatus.activeEdgeIds.has(e.id)
          ? { ...e, data: { ...e.data, active: true } }
          : e.data?.active
            ? { ...e, data: { ...e.data, active: false } }
            : e,
      ),
    [edges, runStatus.activeEdgeIds],
  );

  /* ---------------- editing handlers -------------------------------- */

  const handleNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
      onNodesChange(changes);
      // Selection and dimension changes aren't user edits — treating them as
      // dirty would light the unsaved badge just from clicking around.
      if (changes.some((c) => c.type !== "select" && c.type !== "dimensions")) markDirty();
    },
    [onNodesChange, markDirty],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const domainNodes = fromFlowNodes(nodesRef.current);
      const domainEdges = fromFlowEdges(edgesRef.current);
      const verdict = checkConnection(
        { source: connection.source, target: connection.target },
        domainNodes,
        domainEdges,
      );
      if (!verdict.ok) {
        // react-flow already refuses the snap via isValidConnection; the toast
        // explains WHY, which a silently-failing drag never does.
        toast({ title: "Can't connect those steps", description: verdict.reason });
        return;
      }
      idCounter.current += 1;
      setEdges((eds) =>
        addEdge({ ...connection, id: `wfe-${Date.now()}-${idCounter.current}`, type: "pulse" }, eds),
      );
      markDirty();
    },
    [setEdges, markDirty],
  );

  const isValidConnection = useCallback(
    (connection: Connection | Edge) =>
      checkConnection(
        { source: connection.source, target: connection.target },
        fromFlowNodes(nodesRef.current),
        fromFlowEdges(edgesRef.current),
      ).ok,
    [],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const kind = event.dataTransfer.getData(PALETTE_DND_MIME) as WorkflowNodeKind;
      if (!kind) return; // not one of our palette drags

      const domainNodes = fromFlowNodes(nodesRef.current);
      if (!canAddKind(kind, domainNodes)) {
        toast({
          title: "Only one trigger per workflow",
          description: "This workflow already starts from the Creative Report.",
        });
        return;
      }

      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      idCounter.current += 1;
      const id = `wfn-${Date.now()}-${idCounter.current}`;
      setNodes((nds) =>
        nds.concat({
          id,
          type: kind,
          position,
          data: defaultDataForKind(kind) as unknown as Record<string, unknown>,
        }),
      );
      setSelectedId(id); // drop straight into configuring what you just added
      // Below `2xl` both panels are overlays and together are wider than the
      // canvas they float over, so the one the user is finished with gets out
      // of the way. A no-op at `2xl` and up, where the palette is a column.
      setPaletteOpen(false);
      markDirty();
    },
    [screenToFlowPosition, setNodes, markDirty],
  );

  const handleNodeDataChange = useCallback(
    (nodeId: string, data: WorkflowNodeData) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: data as unknown as Record<string, unknown> } : n,
        ),
      );
      markDirty();
    },
    [setNodes, markDirty],
  );

  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      // Drop the node's edges too — a dangling edge would survive sanitisation
      // only to disappear on reload, which reads as data loss.
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedId(null);
      markDirty();
    },
    [setNodes, setEdges, markDirty],
  );

  const selectedNode = useMemo(() => {
    if (!selectedId) return null;
    const flow = nodes.find((n) => n.id === selectedId);
    if (!flow) return null;
    const data = flow.data as unknown as WorkflowNodeData;
    return {
      id: flow.id,
      kind: data.kind,
      position: { x: flow.position.x, y: flow.position.y },
      data,
    } satisfies WorkflowNode;
  }, [nodes, selectedId]);

  return (
    <RunStatusContext.Provider value={runStatus}>
      {/* `relative` is what the two overlays anchor to below `2xl` — see header
          note 3. It changes nothing at `2xl` and up, where both panels are
          ordinary in-flow columns. */}
      <div className="relative flex h-full min-h-0">
        <NodePalette
          nodes={fromFlowNodes(nodes)}
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
        />

        {/* Opens the palette overlay below `2xl`. Top-LEFT because react-flow's
            own Controls sit bottom-left and the MiniMap bottom-right; this is
            the one corner nothing else claims. */}
        {!paletteOpen && (
          <Button
            variant="outline"
            size="sm"
            className="absolute left-3 top-3 z-10 h-8 gap-1.5 bg-card text-xs shadow-sm 2xl:hidden"
            onClick={() => setPaletteOpen(true)}
          >
            <PanelLeftOpen className="h-3.5 w-3.5" />
            Steps
          </Button>
        )}

        <div className="min-w-0 flex-1">
          <ReactFlow
            nodes={nodes}
            edges={decoratedEdges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={handleNodesChange}
            onEdgesChange={(changes) => {
              onEdgesChange(changes);
              if (changes.some((c) => c.type !== "select")) markDirty();
            }}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={(_, node) => {
              setSelectedId(node.id);
              setPaletteOpen(false); // see `onDrop` — one overlay at a time.
            }}
            onPaneClick={() => setSelectedId(null)}
            colorMode={resolvedTheme === "dark" ? "dark" : "light"}
            fitView
            // react-flow's default `minZoom` is 0.5, and `fitView` is clamped by
            // it: a five-step chain is ~1300px wide, so at every width this
            // screen actually renders at (the canvas is ~470px at 1280 and
            // ~506px at 771) the "fitted" view was still clipped at both ends.
            // A fitView that doesn't fit is the same failure as a 0px canvas,
            // one zoom level up — so the floor drops far enough that the fit is
            // a real fit. Zooming back in is one click of Controls.
            minZoom={0.25}
            proOptions={{ hideAttribution: false }}
          >
            <Background variant={BackgroundVariant.Dots} gap={18} size={1} />
            <Controls showInteractive={false} />
            {/* The minimap is an overview of a canvas you can already see whole
                at narrow widths, and it eats ~200x150 of the little room there
                is — the first thing to drop below `2xl`. `hidden` beats
                react-flow's own `.react-flow__minimap` rule, which sets
                position/margin but never `display`. */}
            <MiniMap pannable zoomable className="hidden 2xl:block" />
          </ReactFlow>
        </div>

        <NodeConfigPanel
          node={selectedNode}
          onChange={handleNodeDataChange}
          onDelete={handleNodeDelete}
          onClose={() => setSelectedId(null)}
        />
      </div>
    </RunStatusContext.Provider>
  );
}

/** `useReactFlow` (for screenToFlowPosition) requires a provider above it. */
export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
