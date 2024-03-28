import React, { memo } from 'react';
import Activity from "src/engine/activity";
import {NodeProps, Handle, Position, useStore, ReactFlowState} from "reactflow";

type MutexNodeData = {
    activity: Activity;
}

const connectionNodeIdSelector = (state: ReactFlowState) => state.connectionNodeId;

export default memo(({ id, selected, xPos, yPos, data }: NodeProps<MutexNodeData>) => {
    const connectionNodeId = useStore(connectionNodeIdSelector);

    const isConnecting = !!connectionNodeId;
    const isTarget = connectionNodeId && connectionNodeId !== id;

    return (
        <div className="shadow border border-slate-200 bg-white min-w-60 h-fit rounded-xl opacity-70">
            <div>
                <Handle type="target" position={Position.Right} className="opacity-0"/>
                <Handle type="source" position={Position.Left} className="opacity-0"/>

                <div
                    className="w-10 rounded-tl-xl h-10 bg-black absolute z-50"
                    style={{ backgroundColor: selected ? "red" : "black" }}
                >
                </div>

                <div className="p-2 flex justify-center">
                    <strong>{id}</strong>
                </div>
                <div className="border p-2 border-t-black flex justify-center">
                    Task: {data.activity.task}<br/>
                    Priority: {data.activity.priority}<br/>
                    Current Workload: {data.activity.currentWorkload}<br/>
                </div>
            </div>
        </div>
    );
})