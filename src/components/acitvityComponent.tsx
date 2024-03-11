import React, { useState } from 'react';
import Activity from "../engine/activity";

type ActivityComponentProps = {
    activity: Activity;
    position: { x: number; y: number };
    onDrag: (x: number, y: number) => void;
}

const ActivityComponent = ({ activity, position, onDrag }: ActivityComponentProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        setIsDragging(true);
        setDragOffset({
            x: event.clientX - position.x,
            y: event.clientY - position.y
        });
    };

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        if (isDragging) {
            const newX = event.clientX - dragOffset.x;
            const newY = event.clientY - dragOffset.y;
            onDrag(newX, newY);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <div
            className="shadow bg-white w-fit h-fit p-4 rounded"
            style={{ position: 'absolute', left: position.x, top: position.y }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            <p>ID: {activity.id} | Task: {activity.task}</p>
            {
                activity.outSemaphores.map((value, index) => (
                    <p key={index}>out: {value.isActive.toString()}</p>
                ))
            }
            {
                activity.inSemaphores.map((value, index) => (
                    <p key={index}>in: {value.isActive.toString()}</p>
                ))
            }
        </div>
    );
}

export default ActivityComponent;
