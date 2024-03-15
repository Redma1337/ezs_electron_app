import React, { useEffect, useReducer, useState } from 'react';
import Graph from '../engine/graph';
import Activity from "../engine/activity";
import ActivityComponent from "./acitvityComponent";
import { FileHandler } from '../engine/fileHandler'; 

const GraphComponent = () => {
    const [graphState, dispatchGraph] = useReducer(graphReducer, new Graph());
    const [activityComponents, setActivityComponents] = useState([]);

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

    // usefilepicker
    const { openFilePicker, parsedData } = FileHandler();

    const handleAddActivityFromFileImport = (taskName: string) => {
        dispatchGraph({
            type: 'addActivity',
            payload: { task: taskName }
        });
        setActivityComponents(prevComponents => {
            const newActivity = new Activity(graphState.activities.length + prevComponents.length + 1, taskName);
            return [...prevComponents, { activity: newActivity, position: { x: 0, y: 0 } }];
        });
    };

    const handleFileContent = () => {
        parsedData.forEach(row => {
            const taskName = row[0];
            if (taskName) {
                handleAddActivityFromFileImport(taskName);
            }
        });
    };

    useEffect(() => {
        handleFileContent();
    }, [parsedData]);

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

                <button
                    onClick={() => openFilePicker()}
                    className="text-white bg-blue-700 p-2 px-4 rounded shadow"
                >Select files</button>
                <br />
            </div>
        </div>
    );
}


export default GraphComponent;
