"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  Edge,
  Node,
  OnConnect,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import {
  WorkflowDefinition,
  WorkflowInstance,
  WorkflowStepExecution,
  deployWorkflowDefinition,
  getInstanceSteps,
  rollbackWorkflow,
  saveWorkflowGraph,
} from "./actions";

type BuilderProps = {
  definitions: WorkflowDefinition[];
  instances: WorkflowInstance[];
};

type StepConfig = {
  key: string;
  type: string;
  retry?: number;
  timeoutMs?: number;
  payload?: Record<string, any>;
};

export function WorkflowBuilder({ definitions, instances }: BuilderProps) {
  const activeDefs = useMemo(() => {
    const byKey = new Map<string, WorkflowDefinition>();
    definitions.forEach((def) => {
      if (!byKey.has(def.key) || (def.isActive && !byKey.get(def.key)?.isActive)) {
        byKey.set(def.key, def);
      }
    });
    return Array.from(byKey.values());
  }, [definitions]);

  const [selectedKey, setSelectedKey] = useState<string>(activeDefs[0]?.key ?? "workflow");
  const selectedDefinition = useMemo(
    () => definitions.find((d) => d.key === selectedKey && d.isActive) ?? definitions.find((d) => d.key === selectedKey),
    [definitions, selectedKey],
  );

  const initialGraph = useMemo(() => {
    const graph = (selectedDefinition?.steps as any)?.graph;
    if (graph?.nodes && graph?.edges) return graph;
    return {
      nodes: [
        { id: "start", position: { x: 0, y: 0 }, data: { label: "Start" }, type: "input" },
        { id: "end", position: { x: 250, y: 100 }, data: { label: "End" }, type: "output" },
      ],
      edges: [{ id: "e1-2", source: "start", target: "end", label: "then" }],
    };
  }, [selectedDefinition]);

  const [nodes, setNodes] = useState<Node[]>(initialGraph.nodes);
  const [edges, setEdges] = useState<Edge[]>(initialGraph.edges);
  const [stepConfig, setStepConfig] = useState<Record<string, StepConfig>>({});
  const [triggers, setTriggers] = useState<string[]>(Array.isArray(selectedDefinition?.triggers) ? selectedDefinition?.triggers : []);
  const [name, setName] = useState<string>(selectedDefinition?.name ?? selectedKey);
  const [versionLabel, setVersionLabel] = useState<string>("");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [instanceSteps, setInstanceSteps] = useState<Record<number, WorkflowStepExecution[]>>({});
  const [selectedInstance, setSelectedInstance] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setNodes(initialGraph.nodes);
    setEdges(initialGraph.edges);
    setTriggers(Array.isArray(selectedDefinition?.triggers) ? selectedDefinition?.triggers : []);
    setName(selectedDefinition?.name ?? selectedKey);
    const configs: Record<string, StepConfig> = {};
    const steps = (selectedDefinition?.steps as any)?.steps ?? [];
    steps.forEach((s: any) => (configs[s.key] = s));
    setStepConfig(configs);
  }, [initialGraph, selectedDefinition, selectedKey]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({ ...connection, type: "smoothstep" }, eds)),
    [],
  );

  const addStep = () => {
    const id = `step-${nodes.length + 1}`;
    setNodes((prev) => [...prev, { id, position: { x: Math.random() * 400, y: Math.random() * 200 }, data: { label: id } }]);
    setStepConfig((prev) => ({ ...prev, [id]: { key: id, type: "action" } }));
  };

  const saveVersion = () => {
    const steps = Object.values(stepConfig).map((s) => ({
      ...s,
      payload: s.payload ?? {},
    }));
    startTransition(async () => {
      await saveWorkflowGraph({
        key: selectedKey,
        name,
        description: versionLabel,
        triggers,
        graph: { nodes, edges },
        steps,
        versionLabel: versionLabel || undefined,
        deploy: true,
      });
      toast({ title: "Workflow saved" });
    });
  };

  const deploy = (id: number) => {
    startTransition(async () => {
      await deployWorkflowDefinition(id);
      toast({ title: "Deployed" });
    });
  };

  const rollback = () => {
    startTransition(async () => {
      await rollbackWorkflow(selectedKey);
      toast({ title: "Rolled back" });
    });
  };

  const loadInstanceSteps = (id: number) => {
    setSelectedInstance(id);
    if (instanceSteps[id]) return;
    startTransition(async () => {
      const steps = await getInstanceSteps(id);
      setInstanceSteps((prev) => ({ ...prev, [id]: steps }));
    });
  };

  const selectedSteps = selectedInstance ? instanceSteps[selectedInstance] ?? [] : [];

  const selectedNodeConfig = selectedNode ? stepConfig[selectedNode] : null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <Card className="xl:col-span-2">
        <CardHeader className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} className="w-64" placeholder="Workflow name" />
            <Input
              value={triggers.join(",")}
              onChange={(e) => setTriggers(e.target.value.split(",").map((v) => v.trim()).filter(Boolean))}
              className="w-56"
              placeholder="Triggers (comma separated)"
            />
            <Input value={versionLabel} onChange={(e) => setVersionLabel(e.target.value)} className="w-48" placeholder="Version label" />
            <Button onClick={addStep} type="button" variant="secondary">
              Add Step
            </Button>
            <Button onClick={saveVersion} disabled={isPending} type="button">
              {isPending ? "Saving..." : "Save & Deploy"}
            </Button>
            <Button variant="outline" onClick={rollback} type="button">
              Rollback
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeDefs.map((def) => (
              <Button
                key={def.id}
                size="sm"
                variant={def.key === selectedKey ? "default" : "outline"}
                onClick={() => setSelectedKey(def.key)}
              >
                {def.key} {def.isActive ? <Badge className="ml-2">active</Badge> : null}
              </Button>
            ))}
            {selectedDefinition ? (
              <Button size="sm" variant="outline" onClick={() => deploy(selectedDefinition.id)}>
                Deploy current
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="h-[520px]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNode(node.id)}
            fitView
          >
            <MiniMap />
            <Controls />
            <Background gap={12} size={1} />
          </ReactFlow>
        </CardContent>
      </Card>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Step Properties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedNodeConfig ? (
              <>
                <Input
                  value={selectedNodeConfig.key}
                  onChange={(e) =>
                    setStepConfig((prev) => ({
                      ...prev,
                      [selectedNode!]: { ...selectedNodeConfig, key: e.target.value },
                    }))
                  }
                  placeholder="Key"
                />
                <Input
                  value={selectedNodeConfig.type}
                  onChange={(e) =>
                    setStepConfig((prev) => ({
                      ...prev,
                      [selectedNode!]: { ...selectedNodeConfig, type: e.target.value },
                    }))
                  }
                  placeholder="Type"
                />
                <Input
                  type="number"
                  value={selectedNodeConfig.retry ?? 0}
                  onChange={(e) =>
                    setStepConfig((prev) => ({
                      ...prev,
                      [selectedNode!]: { ...selectedNodeConfig, retry: Number(e.target.value) },
                    }))
                  }
                  placeholder="Retries"
                />
                <Input
                  type="number"
                  value={selectedNodeConfig.timeoutMs ?? 0}
                  onChange={(e) =>
                    setStepConfig((prev) => ({
                      ...prev,
                      [selectedNode!]: { ...selectedNodeConfig, timeoutMs: Number(e.target.value) },
                    }))
                  }
                  placeholder="Timeout ms"
                />
                <Textarea
                  value={JSON.stringify(selectedNodeConfig.payload ?? {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value || "{}");
                      setStepConfig((prev) => ({
                        ...prev,
                        [selectedNode!]: { ...selectedNodeConfig, payload: parsed },
                      }));
                    } catch {
                      // ignore
                    }
                  }}
                  className="min-h-[120px]"
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Select a node to edit properties.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Instances</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-2 max-h-60 overflow-auto">
              {instances.map((inst) => (
                <div
                  key={inst.id}
                  className="flex items-center justify-between rounded border px-2 py-1 hover:bg-muted cursor-pointer"
                  onClick={() => loadInstanceSteps(inst.id)}
                >
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">
                      {inst.workflow?.key ?? inst.workflowId} · {inst.status}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Started {new Date(inst.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <Badge variant={inst.status === "failed" ? "destructive" : "secondary"}>{inst.status}</Badge>
                </div>
              ))}
            </div>
            {selectedInstance ? (
              <div className="space-y-2">
                <div className="text-sm font-semibold">Steps for #{selectedInstance}</div>
                <div className="max-h-48 overflow-auto space-y-2">
                  {selectedSteps.map((step) => (
                    <div key={step.id} className="rounded border px-2 py-1">
                      <div className="flex justify-between text-sm">
                        <span>{step.stepKey}</span>
                        <Badge variant={step.status === "failed" ? "destructive" : "secondary"}>{step.status}</Badge>
                      </div>
                      {step.errorMessage ? (
                        <div className="text-xs text-destructive mt-1">{step.errorMessage}</div>
                      ) : null}
                    </div>
                  ))}
                  {selectedSteps.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No step data</div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
