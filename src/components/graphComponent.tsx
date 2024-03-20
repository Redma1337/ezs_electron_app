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
import { Simulate } from "react-dom/test-utils";
import select = Simulate.select;
import acitvityNode from "./flowgraph/acitvityNode";
import activity from "../engine/activity";
import { GraphContext } from './graphContext';
import { useGraph } from './graphContext';
import SplitEdgeNode from "./flowgraph/components/orNode";

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
        color: "black"
    },
    type: "floating"
}

const GraphComponent = () => {
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [selectedNode, setSelectedNode] = useState<Node>(null);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const { state, dispatch } = useGraph();

    const onNodeDragStart = useCallback((event: React.MouseEvent, node: Node, nodes: Node[]) => {
        if (!selectedNode || selectedNode.id !== node.id) {
            setSelectedNode(node);
        }
    }, []);

    const onDragOver = useCallback((event: DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: DragEvent) => {
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
                    data: { activity: new Activity(nodeId, "empty Node", 0), label: `${type} node` },
                };
            } else if (type === 'mutex') {
                newNode = {
                    id: nodeId.toString(),
                    type,
                    position,
                    data: { mutex: new Mutex(nodeId, "empty mutex"), label: `${type} node` },
                };
            }
            

            setNodes((nds) => nds.concat(newNode));
            dispatch({ type: 'addActivity', payload: { id: nodeId, task: "emptyNode", priority: 0 } })
        },
        [reactFlowInstance],
    );

    const updateSelectedNodeData = useCallback((key: any, value: any) => {
        if (!selectedNode) return;

        let updatedNode = { ...selectedNode };

        if (selectedNode.data.activity) {
            updatedNode = {
                ...selectedNode,
                data: {
                    ...selectedNode.data,
                    activity: {
                        ...selectedNode.data.activity,
                        [key]: value
                    }
                }
            };
        }

        setSelectedNode(updatedNode);

        setNodes(currentNodes =>
            currentNodes.map(node => node.id === updatedNode.id ? updatedNode : node)
        );
    }, [selectedNode, setSelectedNode, setNodes]);

    return (
        <div className="w-full h-full flex shadow">
            <ReactFlowProvider>
                <GraphContext.Provider value={{ state, dispatch, edges, setEdges }}>
                    <OptionsComponent
                        selectedNode={selectedNode}
                        nodes={nodes}
                        onUpdateNode={updateSelectedNodeData}
                    />
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
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
