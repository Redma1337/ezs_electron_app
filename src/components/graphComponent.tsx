import React, {DragEvent, DragEventHandler, useCallback, useEffect, useReducer, useRef, useState} from 'react';
import Graph from '../engine/graph';
import Activity from "../engine/activity";
import {
    addEdge,
    Background,
    BackgroundVariant,
    Connection,
    ConnectionLineType,
    ConnectionMode, Controls,
    Edge,
    EdgeTypes,
    MarkerType, MiniMap,
    Node,
    NodeTypes,
    OnConnect, Position,
    ReactFlow, ReactFlowProvider,
    updateEdge,
    useEdgesState,
    useNodesState, useUpdateNodeInternals
} from "reactflow";
import ActivityNode from "./flowgraph/acitvityNode";
import MutexNode from "./flowgraph/mutexNode";
import FloatingEdge from "./flowgraph/components/floatingEdge";
import OptionsComponent from "./optionsComponent";
import {PanelPosition} from "@reactflow/core/dist/esm/types/general";

const initialNodes: Node[] = [
    { id: '1', data: { label: 'Node 1' }, position: { x: 500, y: 300 }, type: "activity"},
    { id: '2', data: { label: 'Node 2' }, position: { x: 100, y: 300 }, type: "activity"},
    { id: '3', data: { label: 'Mutex' }, position: { x: 300, y: 100 }, type: "mutex"},
];

const nodeTypes: NodeTypes = {
    activity: ActivityNode,
    mutex: MutexNode,
};

const edgeTypes: EdgeTypes = {
    floating: FloatingEdge,
};

const defaultEdgeOptions = {
    markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 30,
        height: 30,
        color: "black"
    },
    style: {
        stroke: "black"
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
        let connection = {
            id: 'e1-2',
            source: '1',
            target: '2'
        };
        setEdges((eds) => addEdge(connection, eds));
        connection = {
            id: 'e2-1',
            source: '2',
            target: '1'
        };
        setEdges((eds) => addEdge(connection, eds));
    }, [])

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
                const newActivity = new Activity(graph.activities.length + 1, action.payload.task, action.payload.priority);
                graph.addActivity(newActivity);
                return graph;

            case 'addMutexToActivity': {
                const { activityId, mutexName } = action.payload;
                graph.addMutex(mutexName);
                graph.connectToMutex(activityId, mutexName);
                return graph;
            }

            case 'initializeGraph':
                const activity1 = new Activity(1, "Task 1", 1);
                const activity2 = new Activity(2, "Task 2", 4);
                const activity3 = new Activity(3, "Task 3", 2);
                const activity4 = new Activity(4, "Task 4", 8);
                const activity5a = new Activity(5, "Task 5a", 3);
                const activity5b = new Activity(6, "Task 5b", 5);
                const activity6 = new Activity(7, "Task 6",6);

                graph.addActivity(activity1);
                graph.addActivity(activity2);
                graph.addActivity(activity3);
                graph.addActivity(activity4);
                graph.addActivity(activity5a);
                graph.addActivity(activity5b);
                graph.addActivity(activity6);

                graph.connectActivities(activity1.id, activity2.id, false);
                graph.connectActivities(activity1.id, activity3.id, false);
                graph.connectActivities(activity2.id, activity4.id, false);
                graph.connectActivities(activity3.id, activity6.id, false);
                graph.connectActivities(activity4.id, activity6.id, false);
                graph.connectActivities(activity6.id, activity5a.id, false);
                graph.connectActivities(activity5a.id, activity5b.id, false);
                graph.connectActivities(activity5b.id, activity5a.id, true);
                graph.connectActivities(activity5b.id, activity1.id, true);

                graph.addMutex("m23");
                graph.addMutex("m34");

                graph.connectToMutex(2, "m23");
                graph.connectToMutex(3, "m23");

                graph.connectToMutex(3, "m34");
                graph.connectToMutex(4, "m34");

                return graph;

                case 'connectActivities':
                    const { sourceId, targetId } = action.payload;
                    graph.connectActivities(sourceId, targetId, false);
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

    // Inside GraphComponent
    const updateSelectedNodeData = useCallback((key: any, value: any) => {
        if (!selectedNode) return;

        const updatedNode = { ...selectedNode, id: value };
        setSelectedNode(updatedNode);

        // Also update the nodes state to reflect the change in the UI
        setNodes(currentNodes =>
            currentNodes.map(node => node.id === updatedNode.id ? updatedNode : node)
        );
    }, [selectedNode, setNodes]);

    return (
        <div className="w-full h-full flex shadow">
            <ReactFlowProvider>
                <OptionsComponent
                    targetNode={selectedNode}
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
                    <Background variant={BackgroundVariant.Lines}/>
                    <Controls position={"bottom-right"}/>
                </ReactFlow>
            </ReactFlowProvider>
        </div>
    );
}


export default GraphComponent;
