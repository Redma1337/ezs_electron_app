import React, {memo, useState} from 'react';
import { NodeProps, Handle, Position } from "reactflow";

type MutexNodeData = {
    label: string,
}

export default memo(({ id, selected, data }: NodeProps<MutexNodeData>) => {
    return (
        <div className="shadow bg-white min-w-40 h-fit rounded-xl">
            <Handle type="target" position={Position.Left} className="w-2 h-2"/>
            <div>
                <div className="border p-2 flex justify-center">
                    <strong>{data.label}</strong>
                    <strong>{selected}</strong>
                </div>
            </div>
            <Handle type="source" position={Position.Right} className="w-2 h-2"/>
        </div>
    );
})