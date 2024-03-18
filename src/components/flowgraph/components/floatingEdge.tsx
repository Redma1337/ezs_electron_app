import React, {memo, useCallback} from 'react';
import {BaseEdge, EdgeProps, getBezierPath, Position, ReactFlowState, useStore} from 'reactflow';
import {getEdgeParams} from "../../../utils/mathUtils";

export type GetSpecialPathParams = {
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
};

const FloatingEdge = memo(({ id, source, target, markerEnd, style } : EdgeProps) => {
    const sourceNode = useStore(useCallback((store) => store.nodeInternals.get(source), [source]));
    const targetNode = useStore(useCallback((store) => store.nodeInternals.get(target), [target]));

    if (!sourceNode || !targetNode) {
        return null;
    }

    const isBiDirectionEdge = useStore((s: ReactFlowState) => {
        const edgeExists = s.edges.some(
            (e) =>
                (e.source === target && e.target === source) || (e.target === source && e.source === target)
        );

        return edgeExists;
    });

    const getSpecialPath = (
        { sourceX, sourceY, targetX, targetY }: GetSpecialPathParams,
        offsetX: number,
        offsetY: number
    ) => {
        const centerX = (sourceX + targetX) / 2;
        const centerY = (sourceY + targetY) / 2;

        return `M ${sourceX} ${sourceY} Q ${centerX + offsetX} ${centerY + offsetY} ${targetX} ${targetY}`;
    };


    const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode, targetNode);

    let path = "";
    if (isBiDirectionEdge) {
        path = getSpecialPath({
                        sourceX: sx,
                        sourceY: sy,
                        targetX: tx,
                        targetY: ty,
                    },
            sourcePos == Position.Bottom ? 45 : (sourcePos == Position.Top ? -45 : 0),
            sourcePos == Position.Left ? 45 : (sourcePos == Position.Right ? -45 : 0)
                );
    } else {
        [path] = getBezierPath({
            sourceX: sx,
            sourceY: sy,
            sourcePosition: sourcePos,
            targetPosition: targetPos,
            targetX: tx,
            targetY: ty,
        });
    }

    return (
        <BaseEdge
            id={id}
            path={path}
            markerEnd={markerEnd}
            style={style}
        />
    );
})

export default FloatingEdge;