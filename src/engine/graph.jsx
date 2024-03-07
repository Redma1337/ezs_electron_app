import Semaphore from "./semaphore";

class Graph {
    constructor() {
        this.activities = [];
    }

    addActivity(activity) {
        this.activities.push(activity);
    }


    connect(sourceActivity, targetActivity, isActive) {
        //this shares a reference of the semaphore to both activities which makes controlling bot easy
        const connection = new Semaphore(isActive)

        sourceActivity.outSemaphores.push(connection);
        targetActivity.inSemaphores.push(connection);
    }

    walk() {
        //search for nodes that have only active semaphores
        const validNodes = this.activities.filter(activity => activity.inSemaphores.every(semaphore => semaphore.isActive));

        validNodes.forEach(activity => {
            //all semaphores pointing to the node (which are active) are disabled
            activity.inSemaphores.forEach(inSemaphore => {
                inSemaphore.isActive = false;
            });

            //outgoing semaphores become active, effectively passing the state of the in semaphores to the out semaphores
            activity.outSemaphores.forEach(outSemaphore => {
                outSemaphore.isActive = true;
            });
        });
    }

    print() {
        this.activities.forEach(activity => {
            console.log(activity.task);
            activity.inSemaphores.forEach(semaphore => {
                console.log(activity.task, " in ", semaphore.isActive)
            })

            activity.outSemaphores.forEach(semaphore => {
                console.log(activity.task, " out ", semaphore.isActive)
            })
            console.log();
        })
    }
}

export default Graph;