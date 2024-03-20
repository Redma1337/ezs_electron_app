import React from 'react';
import {Node, NodeTypes} from "reactflow";
import Activity from "../engine/activity";
import { useGraph } from './graphContext';

type OptionsComponentProps = {
    activity: Activity
    nodes: Node[]
    onUpdateNode: any
}

const OptionsComponent = ({ activity, nodes, onUpdateNode } : OptionsComponentProps) => {
    const { state, dispatch } = useGraph();

    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const updateSemaphore = (targetId: string) : void => {
      dispatch({type: 'connectActivities', payload: {sourceId: activity.id, targetId: targetId}})
    };

    return (
        <div className="w-[300px] flex flex-col justify-between">
            {
                !activity ?
                    <div></div>
                    :
                    <div className="h-full flex flex-col justify-between">
                        <div className="p-5 flex flex-col gap-5">
                            <div>
                                <h2 className="font-semibold">Task</h2>
                                <input
                                    className="px-2 p-1 rounded shadow border border-slate-200 w-full"
                                    type="text"
                                    placeholder="task"
                                    value={activity?.task}
                                    onChange={e => onUpdateNode('task', e.target.value)}
                                />
                            </div>
                            <div>
                                <h2 className="font-semibold">Priority</h2>
                                <input
                                    className="px-2 p-1 rounded shadow border border-slate-200 w-full"
                                    type="text"
                                    placeholder="priority"
                                    value={activity?.priority}
                                    onChange={e => onUpdateNode('priority', e.target.value)}
                                />
                            </div>
                            <div>
                                <h2 className="font-semibold">Semaphores</h2>
                                <div>
                                    <label htmlFor="nodeSelector"
                                           className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Select
                                        a node</label>
                                    <select
                                        id="nodeSelector"
                                        className="border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                        onChange={(e) => updateSemaphore(e.target.value)}
                                    >
                                        {nodes.filter(node => node.data.activity).map((node) => (
                                            <option key={node.id} value={node.id}>{node.data.activity.task}</option>
                                        ))}
                                    </select>
                                </div>
                                {activity.outSemaphores.map(function (semaphore) {
                                    return (
                                        <div>
                                            <p
                                                className="px-2 p-1 rounded shadow border border-slate-200 w-full"
                                            >{semaphore.name}</p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        <div className="flex flex-col p-5 gap-5 border-t border-slate-200">
                            <h2 className="font-semibold">Components</h2>
                            <div className="px-2 p-1 rounded shadow border border-red-200 text-center"
                                 onDragStart={(event) => onDragStart(event, 'mytest data')} draggable>
                                Mutex Node
                            </div>
                            <div className="px-2 p-1 rounded shadow border border-green-200 text-center"
                                 onDragStart={(event) => onDragStart(event, 'mytest data')} draggable>
                                Activity Node
                            </div>
                        </div>
                    </div>
            }
        </div>
    );
}

export default OptionsComponent