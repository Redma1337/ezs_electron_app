import React from 'react';
import {Node, NodeTypes} from "reactflow";

type GraphComponentProps = {
    targetNode: Node
}

const GraphComponent = ({ targetNode } : GraphComponentProps) => {
    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="w-[300px] flex flex-col justify-between">
            <div className="p-5 flex flex-col gap-5">
                <div>
                    <h2 className="font-semibold">Id</h2>
                    <input className="px-2 p-1 rounded shadow border border-slate-200 w-full" type="text" placeholder="id" value={targetNode?.id}/>
                </div>
                <div>
                    <h2 className="font-semibold">Task</h2>
                    <input  className="px-2 p-1 rounded shadow border border-slate-200 w-full" type="text" placeholder="task" value={targetNode?.id}/>
                </div>
                <div>
                    <h2 className="font-semibold">Priority</h2>
                    <input  className="px-2 p-1 rounded shadow border border-slate-200 w-full" type="text" placeholder="task" value={targetNode?.id}/>
                </div>
            </div>
            <div className="flex flex-col p-5 gap-5 border-t border-slate-200">
                <h2 className="font-semibold">Components</h2>
                <div className="px-2 p-1 rounded shadow border border-red-200 text-center" onDragStart={(event) => onDragStart(event, 'mytest data')} draggable>
                    Mutex Node
                </div>
                <div className="px-2 p-1 rounded shadow border border-green-200 text-center" onDragStart={(event) => onDragStart(event, 'mytest data')} draggable>
                    Activity Node
                </div>
            </div>
        </div>
    );
}

export default GraphComponent