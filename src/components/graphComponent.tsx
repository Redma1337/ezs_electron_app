import React, {useReducer, useState, useEffect} from 'react';
import Graph from '../engine/graph';
import Activity from "../engine/activity";
import ActivityComponent from "./acitvityComponent";

const GraphComponent = () => {
    const [graphState, dispatchGraph] = useReducer(graphReducer, new Graph());
    const [activityComponents, setActivityComponents] = useState([]);

    //TODO: handle the input fields in a separate component
    const [newActivityTask, setNewActivityTask] = useState('');
    const [sourceId, setSourceId] = useState('');
    const [targetId, setTargetId] = useState('');

    const [newMutexName, setNewMutexName] = useState('');
    const [selectedActivityId, setSelectedActivityId] = useState<number>(0);
    const [activityPriority, setActivityPriority] = useState<number>(0);

    useEffect(() => {
        dispatchGraph({ type: 'initializeGraph' });
    }, []);

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

                graph.connect(activity1.id, activity2.id, false);
                graph.connect(activity1.id, activity3.id, false);
                graph.connect(activity2.id, activity4.id, false);
                graph.connect(activity3.id, activity6.id, false);
                graph.connect(activity4.id, activity6.id, false);
                graph.connect(activity6.id, activity5a.id, false);
                graph.connect(activity5a.id, activity5b.id, false);
                graph.connect(activity5b.id, activity5a.id, true);
                graph.connect(activity5b.id, activity1.id, true);

                graph.addMutex("m23");
                graph.addMutex("m34");

                graph.connectToMutex(2, "m23");
                graph.connectToMutex(3, "m23"); 

                graph.connectToMutex(3, "m34");
                graph.connectToMutex(4, "m34"); 

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
        const newActivity = new Activity(graphState.activities.length + 1, newActivityTask, activityPriority);

        if (!newActivityTask || !activityPriority) {
            alert("Please enter a task and priority.");
            return;
        }

        if (graphState.activities.some(a => a.priority === activityPriority)) {
            alert("Activity with the same Priority already exists");
            return;
        }
        //trigger action on our reducer
        dispatchGraph({
            type: 'addActivity',
            payload: { task: newActivityTask, priority: activityPriority }
        });

        //update the state in some way to trigger a reload
        setNewActivityTask("");
        setActivityPriority(0);

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
        setSelectedActivityId(0);
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
        graphState.seeAssignedMutexes();
        console.log("Walk ende -----------------");
        console.log("");
        console.log("");
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
                <input
                    type="number"
                    value={activityPriority}
                    onChange={e => setActivityPriority(parseInt(e.target.value))}
                    placeholder="Activity Priority"
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
                    onChange={e => setSelectedActivityId(parseInt(e.target.value))}
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
                    Add Activity to Mutex
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
