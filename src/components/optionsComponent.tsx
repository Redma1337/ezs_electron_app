import React, { useContext, useEffect, useState, useCallback } from 'react';
import { Node, NodeTypes, addEdge, useEdges, OnNodesChange } from "reactflow";
import Activity from "../engine/activity";
import { GraphContext } from './graphContext';
import Semaphore from '../engine/semaphore';
import { connect } from 'net';
import { FileHandler } from '../engine/fileHandler';
import { useGraph } from './graphContext';
import Mutex from '../engine/mutex';

type OptionsComponentProps = {
    selectedNode: Node
    nodes: Node[]
    setNodes: React.Dispatch<React.SetStateAction<Node<any, string>[]>>
    onUpdateNode: any
}

const OptionsComponent = ({ selectedNode, nodes, setNodes, onUpdateNode }: OptionsComponentProps) => {

    const { state, dispatch } = useGraph();
    const { setEdges } = useGraph();
    const [selectedOutSemaphore, setSelectedOutSemaphore] = useState('');
    const [selectedMutex, setSelectedMutex] = useState('');
    const [toggleRefresh, setToggleRefresh] = useState(false);

    useEffect(() => {
        setSelectedOutSemaphore('')
    }, [selectedNode]);

    useEffect(() => {
        setSelectedMutex('')
    }, [selectedNode]);

    // usefilepicker
    const { openFilePicker, parsedData } = FileHandler();

    const handleAddActivity = (newActivityTask: string) => {
        const nodeId = Math.floor(Math.random() * 10000);
        const newNode: Node = {
            id: nodeId.toString(),
            type: "activity",
            position: { x: 0, y: 0 },
            data: { activity: new Activity(nodeId, newActivityTask, 0), label: `activity node` },
        };
        dispatch({
            type: 'addActivity',
            payload: { task: newActivityTask, id: nodeId.toString(), priority: 0 }
        });
        setNodes((nds: Node<any, string>[]) => nds.concat(newNode));
    };

    const handleFileContent = () => {
        parsedData.forEach(row => {
            const taskName = row[0];
            if (taskName) {
                handleAddActivity(taskName);
            }
        });
    };

    useEffect(() => {
        handleFileContent();
    }, [parsedData]);

    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const addSemaphore = (targetId: string): void => {
        if (!targetId) {
            console.log("targetId is empty");
            return;
        }

        const targetNode = nodes.find(node => node.id === targetId);
        const semaphoreId = 's' + selectedNode.id + '-' + targetId;
        const semaphoreExists = selectedNode.data.activity.outSemaphores.some((semaphore: { id: string }) => semaphore.id === semaphoreId);

        if (targetNode && !semaphoreExists) {
            dispatch({ type: 'connectActivities', payload: { sourceId: selectedNode.data.activity.id, targetId: targetNode.data.activity.id } });
            newEdge(semaphoreId, selectedNode.id, targetId);
        } else {
            console.log("Target node not found or semaphore already existing");
        }
    };

    const addMutexToActivity = (mutexId: string): void => {
        const mutexNode = nodes.find(node => node.id === mutexId);
        const mutexExists = selectedNode.data.activity.mutexes.some((mutex: { id: string }) => mutex.id === mutexNode.data.mutex.id);

        if (!mutexNode || mutexExists) {
            console.log("mutex doesn't exist or already connected");
            return;
        }

        dispatch({ type: 'addMutexToActivity', payload: { activityId: selectedNode.data.activity.id, mutexName: mutexNode.data.mutex.mutexName } });
        selectedNode.data.activity.assignMutex(mutexNode.data.mutex);
        mutexNode.data.mutex.addActivity(selectedNode.data.activity);
        const edgeId = 's' + selectedNode.id + '-' + mutexNode.data.mutex.id;
        newEdge(edgeId, selectedNode.id, mutexId)
    };

    const deleteSemaphore = (semaphoreId: string) => {
        const semaphoreToRemove = selectedNode.data.activity.outSemaphores.find((semaphore: { id: string }) => semaphore.id === semaphoreId);
        const targetActivity = semaphoreToRemove.targetActivity;
        const targetNode = nodes.find(node => node.data.activity.id === targetActivity.id);
        const updatedSemaphores = selectedNode.data.activity.outSemaphores.filter((semaphore: { id: string }) => semaphore.id !== semaphoreId);

        removeEdge(selectedNode.id, targetNode.id);
        dispatch({ type: 'disconnectActivities', payload: { sourceId: selectedNode.data.activity.id, targetId: targetNode.data.activity.id, semaphoreToRemove: semaphoreToRemove } });
    };

    const toggleSemaphore = (semaphoreId: string) => {
        const semaphoreToToggle = selectedNode.data.activity.outSemaphores.find((semaphore: { id: string }) => semaphore.id === semaphoreId);
        dispatch({ type: 'toggleSemaphore', payload: { semaphoreId: semaphoreId } });
        setToggleRefresh(prev => !prev); // force rerender
    }

    const deleteMutex = (mutexId: number) => {
        const mutexToRemove = selectedNode.data.activity.mutexes.find((mutex: { id: number }) => mutex.id === mutexId);
        removeEdge(selectedNode.id, mutexId.toString());
        dispatch({ type: 'disconnectMutexFromActivity', payload: { activityId: selectedNode.data.activity.id, mutexName: mutexToRemove.mutexName } });
    };

    const newEdge = (edgeId: string, source: string, target: string) => {
        setEdges((eds) =>
            nodes
                .filter((node) => node.id === source || node.selected)
                .reduce(
                    // @ts-ignore
                    (eds, node) => addEdge({ id: edgeId, source: node.id, target }, eds),
                    eds,
                ),
        );
    }

    const removeEdge = (source: string, target: string) => {
        setEdges((currentEdges) =>
            currentEdges.filter((edge) => !(edge.source === source && edge.target === target))
        );
        console.log("removed edge from " + source + "to" + target);
    };

    const removeInvalidSemaphores = () => {
        nodes.forEach(node => {
            if (node.type === "activity") {
                const outSemaphoresToRemove = node.data.activity.outSemaphores.filter((semaphore: { targetActivity: { id: any; }; }) =>
                    !nodes.some(node => node.data.activity?.id === semaphore.targetActivity.id)
                );
                outSemaphoresToRemove.forEach((semaphore: { id: any; }) => {
                    node.data.activity.removeOutSemaphore(semaphore.id);
                })

                const inSemaphoresToRemove = node.data.activity.inSemaphores.filter((semaphore: { sourceActivity: { id: any; }; }) =>
                    !nodes.some(node => node.data.activity?.id === semaphore.sourceActivity.id)
                );
                inSemaphoresToRemove.forEach((semaphore: { id: any; }) => {
                    node.data.activity.removeInSemaphore(semaphore.id);
                })
            }
        });
    };

    const removeInvalidMutexConnections = () => {
        nodes.forEach(node => {
            if (node.type === "mutex") {
                const activityToRemove = node.data.mutex.sortedActivities.filter((activity: { id: string }) =>
                    !nodes.some(node => node.data.activity?.id === activity.id)
                );
                activityToRemove.forEach((activity: { id: string }) => {
                    node.data.mutex.removeActivityId(activity.id);
                })
            } else if (node.type === "activity") {
                const mutexesToRemove = node.data.activity.mutexes.filter((mutex: { id: string }) =>
                    !nodes.some(node => node.data.mutex?.id === mutex.id)
                );
                mutexesToRemove.forEach((mutex: { id: string }) => {
                    node.data.activity.removeMutex(mutex);
                })
            }
        });
    };

    const walkAndUpdate = async () => {
        await dispatch({ type: 'walk' });
    };

    useEffect(() => {
        removeInvalidSemaphores();
        removeInvalidMutexConnections();
    }, [nodes.length]);

    useEffect(() => {
        console.log("useEffect ---------------");
        state.graph.activities?.forEach((activity: Activity) => {
            nodes.forEach((node: Node) => {
                console.log(node.data.activity?.id);
                if (node.id === activity.id.toString()) {
                    node.data.activity = activity;
                    console.log("updated");
                }
            })
        })
    }, [state]);

    return (
        <div className="w-[300px] flex flex-col justify-between">
            {
                !selectedNode?.data.activity ?
                    <div className="h-full flex flex-col justify-between">
                        <div>
                        </div>
                        <div className="flex flex-col p-5 gap-5 border-t border-slate-200">
                            <h2 className="font-semibold">Components</h2>
                            <div className="px-2 p-1 rounded shadow border border-red-200 text-center"
                                onDragStart={(event) => onDragStart(event, 'mutex')} draggable>
                                Mutex Node
                            </div>
                            <div className="px-2 p-1 rounded shadow border border-green-200 text-center"
                                onDragStart={(event) => onDragStart(event, 'activity')} draggable>
                                Activity Node
                            </div>
                            <button
                                onClick={() => openFilePicker()}
                                className="text-white bg-blue-700 p-2 px-4 rounded shadow"
                            >Select files</button>
                            <button
                                onClick={() => dispatch({ type: 'print' })}
                                className="text-white bg-blue-700 p-2 px-4 rounded shadow"
                            >Print Graph</button>
                        </div>
                    </div>
                    :
                    <div className="h-full flex flex-col justify-between">
                        <div className="p-5 flex flex-col gap-5">
                            <div>
                                <h2 className="font-semibold">Task</h2>
                                <input
                                    className="px-2 p-1 rounded shadow border border-slate-200 w-full"
                                    type="text"
                                    placeholder="task"
                                    value={selectedNode.data.activity?.task}
                                    onChange={e => onUpdateNode('task', e.target.value)}
                                />
                            </div>
                            <div>
                                <h2 className="font-semibold">Priority</h2>
                                <input
                                    className="px-2 p-1 rounded shadow border border-slate-200 w-full"
                                    type="text"
                                    placeholder="priority"
                                    value={selectedNode.data.activity?.priority}
                                    onChange={e => onUpdateNode('priority', e.target.value)}
                                />
                            </div>
                            <div>
                                <h2 className="font-semibold">Semaphores</h2>
                                <div className="flex items-center">
                                    <select
                                        id="nodeSelector"
                                        className="border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 mr-2"
                                        onChange={(e) => setSelectedOutSemaphore(e.target.value)}
                                        value={selectedOutSemaphore}
                                    >
                                        <option value={''}></option>
                                        {nodes
                                            .filter(node => node.data.activity && node.id !== selectedNode?.id)
                                            .map((node) => (
                                                <option key={node.id} value={node.id}>{node.data.activity.id}</option>
                                            ))}
                                    </select>
                                    <button
                                        className={`px-4 py-2 rounded-lg ${selectedOutSemaphore ? 'bg-blue-500 hover:bg-blue-700 text-white' : 'bg-blue-200 text-gray-500 cursor-not-allowed'}`}
                                        onClick={() => addSemaphore(selectedOutSemaphore)}
                                        disabled={!selectedOutSemaphore}
                                    >
                                        Add
                                    </button>
                                </div>
                                {selectedNode.data.activity.outSemaphores.map(function (semaphore: Semaphore, index: number) {
                                    return (
                                        <div key={semaphore.id} className="flex items-center justify-between space-x-2 p-1 m-1 rounded shadow border border-slate-200 w-full">
                                            <button
                                                onClick={() => toggleSemaphore(semaphore.id)}
                                                className={`${semaphore.isActive() ? 'bg-green-500 hover:bg-green-700' : 'bg-red-500 hover:bg-red-700'} text-white py-1 px-2 rounded`}>
                                                {semaphore.isActive() ? 'on' : 'off'}
                                            </button>
                                            <span>{semaphore.targetActivity.id}</span>
                                            <button
                                                onClick={() => deleteSemaphore(semaphore.id)}
                                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded">
                                                Delete
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                            <div>
                                <h2 className="font-semibold">Mutexes</h2>
                                <div className="flex items-center">
                                    <select
                                        id="mutexSelector"
                                        className="border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 mr-2"
                                        onChange={(e) => setSelectedMutex(e.target.value)}
                                        value={selectedMutex}
                                    >
                                        <option value={''}></option>
                                        {nodes
                                            .filter(node => node.data.mutex && node.id !== selectedNode?.id)
                                            .map((node) => (
                                                <option key={node.id} value={node.id}>{node.data.mutex.id}</option>
                                            ))}
                                    </select>
                                    <button
                                        className={`px-4 py-2 rounded-lg ${selectedMutex ? 'bg-blue-500 hover:bg-blue-700 text-white' : 'bg-blue-200 text-gray-500 cursor-not-allowed'}`}
                                        onClick={() => addMutexToActivity(selectedMutex)}
                                        disabled={!selectedMutex}
                                    >
                                        Add
                                    </button>
                                </div>
                                {selectedNode.data.activity.mutexes.map(function (mutex: Mutex, index: number) {
                                    return (
                                        <div key={index} className="flex items-center justify-between space-x-2 p-1 m-1 rounded shadow border border-slate-200 w-full">
                                            <span>{mutex.mutexName}</span>
                                            <button
                                                onClick={() => deleteMutex(mutex.getId())}
                                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded">
                                                Delete
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex flex-col p-5 gap-5 border-t border-slate-200">
                            <h2 className="font-semibold">Components</h2>
                            <div className="px-2 p-1 rounded shadow border border-red-200 text-center"
                                onDragStart={(event) => onDragStart(event, 'mutex')} draggable>
                                Mutex Node
                            </div>
                            <div className="px-2 p-1 rounded shadow border border-green-200 text-center"
                                onDragStart={(event) => onDragStart(event, 'activity')} draggable>
                                Activity Node
                            </div>
                            <button
                                onClick={() => openFilePicker()}
                                className="text-white bg-blue-700 p-2 px-4 rounded shadow"
                            >Select files</button>
                            <button
                                onClick={() => dispatch({type: 'print'})}
                                className="text-white bg-blue-700 p-2 px-4 rounded shadow"
                            >Print Graph</button>
                            <button
                                onClick={() => walkAndUpdate()}
                                className="text-white bg-blue-700 p-2 px-4 rounded shadow"
                            >Walk</button>
                        </div>
                    </div>
            }
        </div>
    );
}

export default OptionsComponent