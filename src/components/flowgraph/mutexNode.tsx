import React, {memo, useState} from 'react';
import { NodeProps, Handle, Position } from "reactflow";

type MutexNodeData = {
    label: string,
}

export default memo(({ id, selected, data }: NodeProps<MutexNodeData>) => {
    return (
        <div className="shadow border border-slate-200 bg-white min-w-60 h-fit rounded-xl">
            <Handle type="target" position={Position.Left} className="w-2 h-2"/>
            <div>
                <div className="p-2 flex justify-center">
                    <strong>{data.label}</strong>
                    <strong>{selected}</strong>
                </div>
            </div>
            <Handle type="source" position={Position.Right} className="w-2 h-2"/>
        </div>
    );
})