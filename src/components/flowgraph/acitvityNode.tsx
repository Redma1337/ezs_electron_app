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

    //                    className="w-full h-full bg-blue-400 absolute left-0 rounded-xl opacity-0"
    return (
        <div className="shadow bg-white min-w-60 h-fit rounded-xl">
            <div>
                <div
                    className="w-10 rounded-tl-xl h-10 bg-black absolute z-50"
                    style={{ backgroundColor: selected ? "red" : "black" }}
                >
                </div>

                {!isConnecting && (
                    <Handle
                        position={Position.Right}
                        type="source"
                    />
                )}

                <Handle
                    position={Position.Left}
                    type="target"
                    isConnectableStart={false}
                />

                <div className="p-2 flex justify-center">
                    <strong>{id}</strong>
                </div>
                <div className="border p-2 border-t-black flex justify-center">
                    {data.label}<br/>
                    Selected: {JSON.stringify(selected)}<br/>
                    IsTarget: {JSON.stringify(isTarget)}<br/>
                    IsConnected: {JSON.stringify(isConnecting)}<br/>
                    Status: {label}
                </div>
            </div>
        </div>
    );
})