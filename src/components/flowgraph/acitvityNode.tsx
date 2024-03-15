import React, {memo, useState} from 'react';
import Activity from "src/engine/activity";
import {NodeProps, Handle, Position, useStore, ReactFlowState} from "reactflow";

type MutexNodeData = {
    label: string,
    activity: Activity;
}

const connectionNodeIdSelector = (state: ReactFlowState) => state.connectionNodeId;

export default memo(({ id, selected, data }: NodeProps<MutexNodeData>) => {
    const connectionNodeId = useStore(connectionNodeIdSelector);

    const isConnecting = !!connectionNodeId;
    const isTarget = connectionNodeId && connectionNodeId !== id;
    const label = isTarget ? 'Drop here' : 'Drag to connect';

    //
    return (
        <div className="shadow border border-slate-200 bg-white min-w-60 h-fit rounded-xl">
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
                    {data.label}<br/>
                    Selected: {JSON.stringify(selected)}<br/>
                    IsTarget: {JSON.stringify(isTarget)}<br/>
                    IsConnected: {JSON.stringify(isConnecting)}<br/>
                    Activity: {JSON.stringify(data.activity)}<br/>
                    Status: {label}
                </div>
            </div>
        </div>
    );
})