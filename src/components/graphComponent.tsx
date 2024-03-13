import React, {useReducer, useState} from 'react';
import Graph from '../engine/graph';
import Activity from "../engine/activity";
import ActivityComponent from "./acitvityComponent";
import {Edge, Node, ReactFlow, useEdgesState, useNodesState} from "reactflow";
import 'reactflow/dist/style.css';

const initialNodes: Node[] = [
    { id: '1', data: { label: 'Node 1' }, position: { x: 5, y: 5 } },
    { id: '2', data: { label: 'Node 2' }, position: { x: 5, y: 100 } },
];

const initialEdges: Edge[] = [{ id: 'e1-2', source: '1', target: '2' }];

const GraphComponent = () => {
    const [graphState, dispatchGraph] = useReducer(graphReducer, new Graph());
    const [activityComponents, setActivityComponents] = useState([]);

    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

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

    const handleAddActivity = () => {
        const newActivity = new Activity(graphState.activities.length + 1, newActivityTask);

        //trigger action on our reducer
        dispatchGraph({ 
            type: 'addActivity', 
            payload: { task: newActivityTask } 
        });

        //update the state in some way to trigger a reload
        setNewActivityTask("");

        setActivityComponents([...activityComponents, { activity: newActivity, position: { x: 0, y: 0 } }]);
    };

    const handleConnectActivities = () => {
        dispatchGraph({ 
            type: 'connectActivities', 
            payload: { sourceId, targetId } 
        });

        setSourceId("")
        setTargetId("")
    };

    const handleDrag = (index: number, deltaX: number, deltaY: number) => {
        const updatedComponents = [...activityComponents];
        updatedComponents[index].position.x = deltaX;
        updatedComponents[index].position.y = deltaY;
        setActivityComponents(updatedComponents);
    };




    return (
        <div className="bg-gray-200 w-full h-full flex">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                minZoom={1}
                maxZoom={4}
                attributionPosition="bottom-left"
            >

            </ReactFlow>
        </div>
    );
}


export default GraphComponent;
