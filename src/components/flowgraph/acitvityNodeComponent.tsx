import React, {memo, useState} from 'react';
import Activity from "src/engine/activity";
import { NodeProps, Handle, Position } from "reactflow";

type MutexNodeData = {
    label: string,
    activity: Activity;
}

export default memo(({ id, selected, data }: NodeProps<MutexNodeData>) => {
    return (
        <div className="shadow bg-white min-w-40 h-fit rounded-xl">
            <Handle type="source" id="1" position={Position.Left} className="w-2 h-2"/>
            <Handle type="source" position={Position.Top} id="a" />
            <div>
                <div className="p-2 flex justify-center">
                    <strong>{id}</strong>
                </div>
                <div className="border p-2 border-t-black flex justify-center">
                    <strong>{data.label}</strong>
                    <strong>{selected}</strong>
                </div>
            </div>
            <Handle type="source" id="2" position={Position.Right} className="w-2 h-2"/>
            <Handle type="source" position={Position.Bottom} id="c" />
        </div>
    );
})