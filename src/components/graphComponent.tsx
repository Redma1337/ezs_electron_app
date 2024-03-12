import React, { useReducer, useState, useEffect } from 'react';
import Graph from '../engine/graph';
import Activity from "../engine/activity";
import Mutex from "../engine/mutex";
import ActivityComponent from "./acitvityComponent";

const GraphComponent = () => {
    const [graphState, dispatchGraph] = useReducer(graphReducer, new Graph());
    const [activityComponents, setActivityComponents] = useState([]);

    //TODO: handle the input fields in a separate component
    const [newActivityTask, setNewActivityTask] = useState('');
    const [sourceId, setSourceId] = useState('');
    const [targetId, setTargetId] = useState('');

    const [newMutexName, setNewMutexName] = useState('');
    const [selectedActivityId, setSelectedActivityId] = useState('');

    useEffect(() => {
        dispatchGraph({ type: 'initializeGraph' });
    }, []); 

    //centralize the state management to this function to keep it all in place
    //don't use es6 function syntax, otherwise function won't be hoisted
    function graphReducer(graph: Graph, action: any) {
        //TODO: add the missing action types and implement their logic
        switch (action.type) {
            case 'addActivity':
                const newActivity = new Activity(graph.activities.length + 1, action.payload.task);
                graph.addActivity(newActivity);
                return graph;

            case 'addMutexToActivity': {
                const { activityId, mutexName } = action.payload;
                graph.addOrUpdateMutex(mutexName, activityId);
                return graph;
            }

            case 'initializeGraph':
                const activity1 = new Activity(1, "Task 1");
                const activity2 = new Activity(2, "Task 2");
                const activity3 = new Activity(3, "Task 3");
                const activity4 = new Activity(4, "Task 4");
                const activity5a = new Activity(5, "Task 5a");
                const activity5b = new Activity(6, "Task 5b");
                const activity6 = new Activity(7, "Task 6");
                
                graph.addActivity(activity1);
                graph.addActivity(activity2);
                graph.addActivity(activity3);
                graph.addActivity(activity4);
                graph.addActivity(activity5a);
                graph.addActivity(activity5b);
                graph.addActivity(activity6);

                graph.connect(activity1, activity2, false);
                graph.connect(activity1, activity3, false);
                graph.connect(activity2, activity4, false);
                graph.connect(activity3, activity6, false);
                graph.connect(activity4, activity6, false);
                graph.connect(activity6, activity5a, false);
                graph.connect(activity5a, activity5b, false);
                graph.connect(activity5b, activity5a, true);
                graph.connect(activity5b, activity1, true);

                graph.addOrUpdateMutex("m234", 2, 7);
                graph.addOrUpdateMutex("m234", 3, 9);
                graph.addOrUpdateMutex("m234", 4, 5);

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



    // function to add Mutex to activity
    const handleAddMutexToActivity = () => {
        if (!selectedActivityId || !newMutexName.trim()) {
            alert("Please select an activity and enter a mutex name.");
            return;
        }

        dispatchGraph({
            type: 'addMutexToActivity',
            payload: {
                activityId: selectedActivityId,
                mutexName: newMutexName,
            }
        });

        setNewMutexName("");
        setSelectedActivityId('');
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

    const handleWalk = () => {
        graphState.walk();
        //graphState.print();
        graphState.printSemaphores();
    }

    return (
        <div className="bg-gray-200 w-full h-full flex">
            <div
                className="bg-red-400 h-screen w-full"
            >
                {
                    activityComponents.map((component, index) => (
                        <ActivityComponent
                            key={index}
                            activity={component.activity}
                            position={component.position}
                            onDrag={(deltaX, deltaY) => handleDrag(index, deltaX, deltaY)}
                        />
                    ))
                }
            </div>
            <div className="h-full bg-black flex flex-col gap-5 p-4">
                <input
                    type="text"
                    value={newActivityTask}
                    onChange={e => setNewActivityTask(e.target.value)}
                    placeholder="New Activity Task"
                    className="rounded p-2 px-4 w-full shadow"
                />
                <button
                    className="text-white bg-blue-700 p-2 px-4 rounded shadow"
                    onClick={handleAddActivity}
                >
                    Add Activity
                </button>
            </div>



            {/* add Mutex to Activity */}
            <div className="h-full bg-black flex flex-col gap-5 p-4">
                <input
                    type="text"
                    value={newMutexName}
                    onChange={e => setNewMutexName(e.target.value)}
                    placeholder="Mutex Name"
                    className="rounded p-2 px-4 w-full shadow"
                />

                <select
                    className="rounded m-2 p-2 px-4 shadow"
                    value={selectedActivityId}
                    onChange={e => setSelectedActivityId(e.target.value)}
                >
                    <option value="">Choose Activity</option>
                    {activityComponents.map((component, index) => (
                        <option key={index} value={component.activity.id}>
                            {component.activity.task}
                        </option>
                    ))}
                </select>
                <button
                    className="text-white bg-blue-700 p-2 px-4 rounded shadow mt-2"
                    onClick={handleAddMutexToActivity}
                >
                    Add Mutex to Activity
                </button>
            </div>

            <div className="h-full bg-black flex flex-col gap-5 p-2">
                <button
                    className="text-white bg-blue-700 p-2 px-4 rounded shadow mt-2"
                    onClick={handleWalk}
                >
                    walk
                </button>
            </div>

        </div>
    );
}


export default GraphComponent;
