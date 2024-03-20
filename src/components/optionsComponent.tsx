import React, { useContext, useEffect, useState } from 'react';
import { Node, NodeTypes, addEdge, useEdges } from "reactflow";
import Activity from "../engine/activity";
import { GraphContext } from './graphContext';
import Semaphore from '../engine/semaphore';
import { connect } from 'net';

type OptionsComponentProps = {
    selectedNode: Node
    nodes: Node[]
    onUpdateNode: any
}

const OptionsComponent = ({ selectedNode, nodes, onUpdateNode }: OptionsComponentProps) => {

    const { state, dispatch } = useContext(GraphContext);
    const { setEdges } = useContext(GraphContext);
    const [selectedOutSemaphore, setSelectedOutSemaphore] = useState('');

    useEffect(() => {
        setSelectedOutSemaphore('')
    }, [selectedNode]);

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
            const connection = new Semaphore(false, targetNode.data.activity.task, semaphoreId);
            selectedNode.data.activity.outSemaphores.push(connection);
            dispatch({ type: 'connectActivities', payload: { sourceId: selectedNode.data.activity.id, targetId: targetNode.data.activity.id } });
            newEdge(selectedNode.id, targetId);
        } else {
            console.log("Target node not found or semaphore already existing");
        }
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

    return (
        <div className="w-[300px] flex flex-col justify-between">
            {
                !selectedNode?.data.activity ?
                    <div className="h-full flex flex-col justify-between"> {/* Adjusted this line */}
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
                                                <option key={node.id} value={node.id}>{node.data.activity.task}</option>
                                            ))}
                                    </select>
                                    <button
                                        className={`px-4 py-2 rounded-lg ${selectedOutSemaphore ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-blue-200 text-gray-500 cursor-not-allowed'}`}
                                        onClick={() => addSemaphore(selectedOutSemaphore)}
                                        disabled={!selectedOutSemaphore} // This disables the button when selectedOutSemaphore is an empty string
                                    >
                                        Add
                                    </button>
                                </div>
                                {selectedNode.data.activity.outSemaphores.map(function (semaphore: Semaphore, index: number) {
                                    return (
                                        <div key={index} className="px-2 p-1 m-1 rounded shadow border border-slate-200 w-full">
                                            {semaphore.name}
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
                        </div>
                    </div>
            }
        </div>
    );
}

export default OptionsComponent