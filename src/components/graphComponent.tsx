import React, { DragEvent, DragEventHandler, useCallback, useEffect, useReducer, useRef, useState } from 'react';
import Graph from '../engine/graph';
import Activity from "../engine/activity";
import {
    addEdge,
    Background,
    BackgroundVariant,
    ConnectionMode, Controls,
    EdgeTypes, MarkerType,
    Node,
    NodeTypes,
    ReactFlow, ReactFlowProvider,
    useEdgesState,
    useNodesState
} from "reactflow";
import ActivityNode from "./flowgraph/acitvityNode";
import MutexNode from "./flowgraph/mutexNode";
import FloatingEdge from "./flowgraph/components/floatingEdge";
import OptionsComponent from "./optionsComponent";
import { PanelPosition } from "@reactflow/core/dist/esm/types/general";
import Mutex from "../engine/mutex";
import { Simulate, act } from "react-dom/test-utils";
import select = Simulate.select;
import acitvityNode from "./flowgraph/acitvityNode";
import activity from "../engine/activity";
import { GraphContext } from '../store/graphContext';
import { useGraph } from '../store/graphContext';
import SplitEdgeNode from "./flowgraph/components/orNode";
import { FileHandler } from '../engine/fileHandler'; 
import Semaphore from '../engine/semaphore';
import mutex from "../engine/mutex";
import semaphore from "../engine/semaphore";

const nodeTypes: NodeTypes = {
    activity: ActivityNode,
    mutex: MutexNode,
    splitEdge: SplitEdgeNode,
};

const edgeTypes: EdgeTypes = {
    floating: FloatingEdge,
};

const defaultEdgeOptions = {
    style: {
        stroke: "black"
    },
    markerEnd: {
        type: MarkerType.Arrow,
        width: 20,
        height: 20,
        color: "red",
    },
    type: "floating",
}

const GraphComponent = () => {
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [selectedNode, setSelectedNode] = useState<Node>(null);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const { state, dispatch } = useGraph();

    useEffect(() => {
        console.log("graph state update");

        const backendNodeIds = new Set();
        const backendEdgeIds = new Set();

        state.graph.activities.forEach(activity => {
            backendNodeIds.add(activity.id.toString()); // Track backend node IDs

            const existingNode = nodes.find(node => node.id === activity.id.toString());
            if (existingNode) {
                existingNode.data = { activity: activity };
            } else {
                const aNode = {
                    id: activity.id.toString(),
                    type: "activity",
                    position: { x: 100, y: 100 },
                    data: { activity: activity },
                };
                setNodes((nds) => nds.concat(aNode));
            }

            activity.outSemaphores.forEach(semaphore => {
                backendEdgeIds.add(semaphore.id); // Track backend edge IDs
                const existingEdge = edges.find(edge => edge.id === semaphore.id);
                if (!existingEdge) {
                    newEdge(semaphore.id, semaphore.sourceActivity.id.toString(), semaphore.targetActivity.id.toString(), false);
                } else {
                    const activeState = semaphore.isActive();
                    existingEdge.data.isActive = activeState;

                    existingEdge.markerEnd = {
                        type: MarkerType.Arrow,
                        width: 20,
                        height: 20,
                        color: activeState ? "green" : "red",
                    }

                }
            });

            activity.mutexes.forEach(mutex => {
                const edgeId = 'e' + activity.id + '-' + mutex.getId().toString();
                backendEdgeIds.add(edgeId); // Track backend edge IDs
                const existingEdge = edges.find(edge => edge.id === edgeId);
                if (!existingEdge) {
                    newEdge(edgeId, activity.id.toString(), mutex.getId().toString(), true);
                }
            });
        });

        // Process mutex nodes
        state.graph.mutexes.forEach(mutex => {
            backendNodeIds.add(mutex.getId().toString()); // Track backend mutex node IDs

            const existingNode = nodes.find(node => node.id === mutex.getId().toString());
            if (!existingNode) {
                const mNode = {
                    id: mutex.getId().toString(),
                    type: "mutex",
                    position: { x: 100, y: 100 },
                    data: { mutex },
                };
                setNodes((nds) => nds.concat(mNode));
            }
            // Note: If mutex nodes can have edges, add processing here
        });

        // Remove nodes not in the backend state
        setNodes((currentNodes) => currentNodes.filter(node => backendNodeIds.has(node.id)));

        // Remove edges not in the backend state
        setEdges((currentEdges) => currentEdges.filter(edge => backendEdgeIds.has(edge.id)));
    }, [state]);

    const newEdge = (edgeId: string, source: string, target: string, isAnimated: boolean) => {
        console.log(source, target)
        setEdges((eds) =>
            nodes
                .filter((node) => node.id === source || node.selected)
                .reduce(
                    (eds, node) => addEdge({ id: edgeId, source: node.id, target: target, data: {isActive: false}, animated: isAnimated }, eds),
                    eds,
                ),
        );
    }

    const handleNodesChange = useCallback((changes: any) => {
        changes.forEach((change: any) => {
            if (change.type === 'remove') {
                const nodeToRemove = nodes.find(node => node.id === change.id);
                if (nodeToRemove && nodeToRemove.data.activity) {
                    const activityToRemove = nodeToRemove.data.activity;
                    dispatch({
                        type: 'removeActivity',
                        payload: { activityToRemove }
                    });
                }
                else if (nodeToRemove && nodeToRemove.data.mutex) {
                    const mutexToRemove = nodeToRemove.data.mutex;
                    dispatch({
                        type: 'removeMutex',
                        payload: { mutexToRemove }
                    });
                    console.log("remove mutex called");
                }
                setSelectedNode(null);
            }
        });
        onNodesChange(changes);
    }, [nodes, dispatch, onNodesChange]);

    const onNodeDragStart = useCallback((event: React.MouseEvent, node: Node, nodes: Node[]) => {
        if (!selectedNode || selectedNode.id !== node.id) {
            setSelectedNode(node);
        }
    }, []);

    const onDragOver = useCallback((event: DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback((event: DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');

            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const nodeId = Math.floor(Math.random() * 10000);
            var newNode: any;
            if (type === 'activity') {
                newNode = {
                    id: nodeId.toString(),
                    type,
                    position,
                    data: { activity: new Activity(nodeId, "empty Node", 0, 1), label: `${type} node` },
                };
                dispatch({ type: 'addActivity', payload: { id: nodeId, task: "emptyNode", priority: 0 } })
            } else if (type === 'mutex') {
                newNode = {
                    id: nodeId.toString(),
                    type,
                    position,
                    data: { mutex: new Mutex(nodeId, "Mutex"+nodeId), label: `${type} node` },
                };
                dispatch({ type: 'addMutex', payload: { id: nodeId, mutexName: "Mutex"+nodeId } })
            }

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance],
    );

    const updateSelectedNodeData = useCallback((action: string, activityId: string, value: any) => {
        if (!selectedNode || !selectedNode.data.activity) return;
        /*
        const activity = selectedNode.data.activity;
        const updatedActivity = new Activity(
            activity.id,
            key === 'task' ? value : activity.task, 
            key === 'priority' ? parseInt(value, 10) : activity.priority
        );

        activity.outSemaphores.forEach((semaphore: Semaphore) => {
            updatedActivity.addOutSemaphore(semaphore);
        })

        activity.inSemaphores.forEach((semaphore: Semaphore) => {
            updatedActivity.addInSemaphore(semaphore);
        })

        activity.mutexes.forEach((mutex: Mutex) => {
            updatedActivity.assignMutex(mutex);
            mutex.updateActivityById(updatedActivity.id, updatedActivity);
        })

        const updatedNode = {
            ...selectedNode,
            data: {
                ...selectedNode.data,
                activity: updatedActivity,
            },
        };

        if (key === 'task') {
            dispatch({ type: 'changeTask', payload: { activityId: updatedActivity.id, priority: updatedActivity.priority } });
        } else if (key === 'priority') {
            dispatch({ type: 'changePriority', payload: { activityId: updatedActivity.id, priority: updatedActivity.priority } });
        }
        setSelectedNode(updatedNode);
        setNodes(currentNodes => currentNodes.map(node => node.id === updatedNode.id ? updatedNode : node));
        */
    }, [selectedNode, setSelectedNode, setNodes]);

    return (
        <div className="w-full h-full flex shadow">
            <ReactFlowProvider>
                <GraphContext.Provider value={{ state, dispatch }}>
                    <OptionsComponent
                        selectedNode={selectedNode}
                        nodes={nodes}
                        onUpdateNode={updateSelectedNodeData}
                    />
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={handleNodesChange}
                        onEdgesChange={onEdgesChange}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        onInit={setReactFlowInstance}
                        onNodeDragStart={onNodeDragStart}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        connectionMode={ConnectionMode.Loose}
                        defaultEdgeOptions={defaultEdgeOptions}
                        attributionPosition="bottom-left"
                        className="border-l border-l-slate-300 shadow"
                    >
                        <Background variant={BackgroundVariant.Lines} />
                        <Controls position={"bottom-right"} />
                    </ReactFlow>
                </GraphContext.Provider>
            </ReactFlowProvider>
        </div>
    );
}


export default GraphComponent;