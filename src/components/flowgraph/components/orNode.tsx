import React, {memo} from 'react';
import {Handle, NodeProps, Position} from "reactflow";

type OrNodeData = {
    label: string,
}

export default memo(({ data }: NodeProps<OrNodeData>) => {
    return (
        <div className="shadow border border-slate-200 bg-white w-fit h-fit p-1 rounded-md">
            OR
            <Handle type="source" position={Position.Right}  className="absolute w-full h-full left-0 opacity-0"/>
        </div>
    );
})