import React, {DragEvent, DragEventHandler, useCallback, useEffect, useReducer, useRef, useState} from 'react';
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
import SplitEdgeNode from "./flowgraph/components/orNode";

const initialNodes: Node[] = [
    { id: '1', data: { label: 'Node 1' }, position: { x: 500, y: 300 }, type: "activity"},
    { id: '2', data: { label: 'Node 2' }, position: { x: 100, y: 300 }, type: "activity"},
    { id: '3', data: { label: 'Node 3' }, position: { x: 10, y: 10 }, type: "activity"},
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
    const [graphState, dispatchGraph] = useReducer(graphReducer, new Graph());
    const [activityComponents, setActivityComponents] = useState([]);

    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [selectedNode, setSelectedNode] = useState<Node>(null);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);

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

    //centralize the state management to this function to keep it all in place
    //don't use es6 function syntax, otherwise function won't be hoisted
    function graphReducer(graph: Graph, action: any) {
        //TODO: add the missing action types and implement their logic
        switch (action.type) {
            case 'addActivity':
                const newActivity = new Activity(graph.activities.length + 1, action.payload.task);
                graph.addActivity(newActivity);
                return graph;
            case 'connectActivities':
                const { sourceId, targetId } = action.payload;
                graph.connect(sourceId, targetId, false);
                return graph;
            default:
                return graph;
        }
    }

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
                data: { label: `${type} node` },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance],
    );

    return (
        <div className="w-full h-full flex shadow">
            <ReactFlowProvider>
                <OptionsComponent
                    targetNode={selectedNode}
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
                    <Background variant={BackgroundVariant.Lines}/>
                    <Controls position={"bottom-right"}/>
                </ReactFlow>
            </ReactFlowProvider>
        </div>
    );
}


export default GraphComponent;
