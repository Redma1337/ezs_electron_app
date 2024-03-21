import React, { useContext, useEffect, useState } from 'react';
import { Node, NodeTypes, addEdge, useEdges } from "reactflow";
import Activity from "../engine/activity";
import { GraphContext } from './graphContext';
import Semaphore from '../engine/semaphore';
import { connect } from 'net';
import { FileHandler } from '../engine/fileHandler';

type OptionsComponentProps = {
    selectedNode: Node
    nodes: Node[]
    setNodes: React.Dispatch<React.SetStateAction<Node<any, string>[]>>
    onUpdateNode: any
}

const OptionsComponent = ({ selectedNode, nodes, setNodes, onUpdateNode }: OptionsComponentProps) => {

    const { state, dispatch } = useContext(GraphContext);
    const { setEdges } = useContext(GraphContext);
    const [selectedOutSemaphore, setSelectedOutSemaphore] = useState('');

    useEffect(() => {
        setSelectedOutSemaphore('')
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
            const connection = new Semaphore(false, semaphoreId, targetNode.data.activity);
            selectedNode.data.activity.outSemaphores.push(connection);
            dispatch({ type: 'connectActivities', payload: { sourceId: selectedNode.data.activity.id, targetId: targetNode.data.activity.id } });
            newEdge(selectedNode.id, targetId);
        } else {
            console.log("Target node not found or semaphore already existing");
        }
    };

    const deleteSemaphore = (semaphoreId: string) => {
        const semaphoreToRemove = selectedNode.data.activity.outSemaphores.find((semaphore: { id: string }) => semaphore.id === semaphoreId);
        const targetActivity = semaphoreToRemove.targetActivity;
        const targetNode = nodes.find(node => node.data.activity === targetActivity);
        const updatedSemaphores = selectedNode.data.activity.outSemaphores.filter((semaphore: { id: string }) => semaphore.id !== semaphoreId);

        selectedNode.data.activity.outSemaphores = updatedSemaphores;
        removeEdge(selectedNode.id, targetNode.id);
        dispatch({ type: 'disconnectActivities', payload: { sourceId: selectedNode.data.activity.id, targetId: targetNode.data.activity.id, semaphoreToRemove: semaphoreToRemove }});

    };

    const newEdge = (source: string, target: string) => {
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

    const removeEdge = (source: string, target: string) => {
        setEdges((currentEdges) =>
            currentEdges.filter((edge) => !(edge.source === source && edge.target === target))
        );
    };

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
                        </div>
                    </div>
            }
        </div>
    );
}

export default OptionsComponent