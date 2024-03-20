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

const initialNodes: Node[] = [
    { id: '1', data: { activity: new Activity(2, "node 1", 1) }, position: { x: 500, y: 300 }, type: "activity" },
    { id: '2', data: { activity: new Activity(1, "node 2", 2) }, position: { x: 100, y: 300 }, type: "activity" },
    { id: '3', data: { mutex: new Mutex(0, "mutex 0") }, position: { x: 300, y: 100 }, type: "mutex" },
];

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
    const [activityComponents, setActivityComponents] = useState([]);

    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [selectedNode, setSelectedNode] = useState<Node>(null);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const { state, dispatch } = useGraph();

    useEffect(() => {
        hehehehehe('2', '1');
        hehehehehe('1', '2');
        hehehehehe('2', '3');
    }, []);

    const hehehehehe = (source: string, target: string) => {
        setEdges((eds) =>
            nodes
                .filter((node) => node.id === source || node.selected)
                .reduce(
                    // @ts-ignore
                    (eds, node) => addEdge({ source: node.id, target }, eds),
                    eds,
                ),
        );
    }

    //TODO: handle the input fields in a separate component
    const [newActivityTask, setNewActivityTask] = useState('');
    const [sourceId, setSourceId] = useState('');
    const [targetId, setTargetId] = useState('');

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
            const newNode = {
                id: Math.floor(Math.random() * 10000).toString(),
                type,
                position,
                data: { activity: new Activity(3, "empty Node", 0) , label: `${type} node` },
            };

            setNodes((nds) => nds.concat(newNode));
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

    const addEdgeToGraph = (connection: { source: string; target: string; id?: string; }) => {
        setEdges((eds) => addEdge({ id: connection.id ?? `e${connection.source}-${connection.target}`, source: connection.source, target: connection.target }, eds));
    };

    return (
        <div className="w-full h-full flex shadow">
            <ReactFlowProvider>
                <GraphContext.Provider value={{ state, dispatch, addEdge: addEdgeToGraph }}>
                    <OptionsComponent
                        activity={selectedNode?.data.activity}
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
