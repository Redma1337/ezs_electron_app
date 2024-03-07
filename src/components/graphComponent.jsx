import React, {useReducer, useState} from 'react';
import Graph from '../engine/graph';
import Activity from "../engine/activity";
import ActivityComponent from "./acitvityComponent";
import activity from "../engine/activity";
import graph from "../engine/graph";

const GraphComponent = () => {
    const [graphState, dispatchGraph] = useReducer(graphReducer, new Graph());

    //TODO: handle the input fields in a separate component
    const [newActivityTask, setNewActivityTask] = useState('');
    const [sourceId, setSourceId] = useState('');
    const [targetId, setTargetId] = useState('');

    //centralize the state management to this function to keep it all in place
    //don't use es6 function syntax, otherwise function won't be hoisted
    function graphReducer(graph, action) {
        //TODO: add the missing action types and implement their logic
        switch (action.type) {
            case 'addActivity':
                const newActivity = new Activity(graph.activities.length + 1, action.payload.task);
                graph.addActivity(newActivity);
                return graph;
            case 'connectActivities':
                const { sourceId, targetId } = action.payload;
                const sourceIdActivity = graph.activities.find(a => a.id === parseInt(sourceId));
                const targetIdActivity = graph.activities.find(a => a.id === parseInt(targetId));
                if (sourceIdActivity && targetIdActivity) {
                    graph.connect(sourceIdActivity, targetIdActivity, false);
                }
                return graph;
            default:
                return graph;
        }
    }

    const handleAddActivity = () => {
        //trigger action on our reducer
        dispatchGraph({ 
            type: 'addActivity', 
            payload: { task: newActivityTask } 
        });

        //update the state in some way to trigger a reload
        setNewActivityTask("");
    };

    const handleConnectActivities = () => {
        dispatchGraph({ 
            type: 'connectActivities', 
            payload: { sourceId, targetId } 
        });

        setSourceId("")
        setTargetId("")
    };

    return (
        <div>
            <div className="flex gap-5">
                <input
                    type="text"
                    value={newActivityTask}
                    onChange={e => setNewActivityTask(e.target.value)}
                    placeholder="New Activity Task"
                    className="rounded p-2 px-4 w-full shadow"
                />
                <button className="rounded p-2 px-4 bg-cyan-500 text-nowrap" onClick={handleAddActivity}>Add Activity</button>
            </div>
            <div className="flex flex-col gap-5 mt-2">
                <div className="flex flex-col text-nowrap">
                    Source Activity ID:
                    <input
                        type="number"
                        value={sourceId}
                        onChange={e => setSourceId(e.target.value)}
                        placeholder="Source Activity ID"
                        className="rounded p-2 px-4 shadow"
                    />
                </div>
                <div className="flex flex-col text-nowrap">
                    Target Activity ID:
                    <input
                        type="number"
                        value={targetId}
                        onChange={e => setTargetId(e.target.value)}
                        placeholder="Target Activity ID"
                        className="rounded p-2 px-4 shadow"
                    />
                </div>
                <button className="rounded p-2 px-4 bg-cyan-500" onClick={handleConnectActivities}>Connect Activities</button>
            </div>
            {
                graphState.activities.map((activity, index) => (
                    <ActivityComponent key={index} activity={activity}/>
                ))
            }
        </div>
    );
}


export default GraphComponent;
