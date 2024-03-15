import React, {useCallback, useReducer, useRef, useState} from 'react';
import Graph from '../engine/graph';
import Activity from "../engine/activity";
import {
    addEdge, Connection, ConnectionMode,
    Edge, EdgeTypes,
    MarkerType,
    Node,
    NodeTypes,
    OnConnect,
    ReactFlow, updateEdge,
    useEdgesState,
    useNodesState
} from "reactflow";
import ActivityNode from "./flowgraph/acitvityNode";
import MutexNode from "./flowgraph/mutexNode";
import FloatingEdge from "./flowgraph/components/floatingEdge";
import CustomConnectLine from "./flowgraph/components/customConnectLine";

const initialNodes: Node[] = [
    { id: '1', data: { label: 'Node 1' }, position: { x: 5, y: 5 }, type: "activity"},
    { id: '2', data: { label: 'Node 2' }, position: { x: 5, y: 100 }, type: "activity"},
    { id: '3', data: { label: 'Mutex' }, position: { x: 5, y: 100 }, type: "mutex"},
];

const initialEdges: Edge[] = [

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

    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const edgeUpdateSuccessful = useRef(true);

    const onConnect: OnConnect = useCallback(
        (connection) => setEdges((eds) => addEdge(connection, eds)),
        [setEdges],
    );

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

    const onEdgeUpdateStart = useCallback(() => {
        edgeUpdateSuccessful.current = false;
    }, []);

    const onEdgeUpdate = useCallback((oldEdge: Edge, newConnection: Connection) => {
        edgeUpdateSuccessful.current = true;
        setEdges((els) => updateEdge(oldEdge, newConnection, els));
    }, []);

    const onEdgeUpdateEnd = useCallback((_: any, edge: Edge) => {
        if (!edgeUpdateSuccessful.current) {
            setEdges((eds) => eds.filter((e) => e.id !== edge.id));
        }

        edgeUpdateSuccessful.current = true;
    }, []);

    return (
        <div className="bg-gray-200 w-full h-full flex">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onEdgeUpdate={onEdgeUpdate}
                onEdgeUpdateStart={onEdgeUpdateStart}
                onEdgeUpdateEnd={onEdgeUpdateEnd}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                connectionMode={ConnectionMode.Loose}
                minZoom={1}
                maxZoom={4}
                defaultEdgeOptions={defaultEdgeOptions}
                attributionPosition="bottom-left"
                connectionLineComponent={CustomConnectLine}
            >
            </ReactFlow>
        </div>
    );
}


export default GraphComponent;
