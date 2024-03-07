import React from 'react';

const ActivityComponent = ({activity}) => {
    return (
        <div>
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