import Semaphore from "./semaphore";
import Mutex from "./mutex";

class Graph {
    constructor() {
        this.activities = [];
        this.mutexe = [];
    }

    addActivity(activity) {
        this.activities.push(activity);
    }


    //1.
    addMutexToActivity(mutexName, activityId) {
        // Find the mutex by name. If it doesn't exist, undefined will be returned
        let mutexToUpdate = this.mutexe.find(m => m.mutexName === mutexName);

        // Mutex exists
        if (mutexToUpdate) {
            if (!mutexToUpdate.activityList.includes(activityId)) { // Find activity ID in mutex

                mutexToUpdate.addActivityId(activityId);  // Add new activity ID to existing mutex
                console.log(`Added Activity ID ${activityId} to existing Mutex '${mutexName}'.`);
            } else {
                console.log(`Activity ID ${activityId} already exists in Mutex '${mutexName}'.`);
            }

            // Mutex does not exist
        } else {
            this.addMutex(mutexName, [activityId]); // Add the new mutex
            console.log(`New Mutex: '${mutexName}' - Activity ID: [${activityId}].`);
        }

        // Update the activity with the mutex reference
        this.updateActivityWithMutex(mutexName, activityId);

        // For debugging: log the updated mutexe list
        console.log("-- Summary --");
        console.log("Updated Mutexe:", this.mutexe.map(m => `${m.mutexName}: [${m.activityList}]`));
        // Activities with their referenced mutexes
        console.log("Updated Activities:", this.activities.map(a => `${a.id}: ${a.task} - Mutexe: ${
            a.mutexe && a.mutexe.length > 0 
            ? a.mutexe.map(m => `${m.mutexName} (Activities: [${m.activityList.join(", ")}])`).join("; ") 
            : 'None'
        }`));
    }

    //2. create Mutex -> private???
    addMutex(mutexName, activityId) {
        const mutex = new Mutex(mutexName, [activityId]);
        this.mutexe.push(mutex);
    }

    //3. add Mutex Reference to Activity -> private???
    updateActivityWithMutex(mutexName, activityId) {
        // Find the mutex by name -> again beacuse could be new mutex 
        const mutex = this.mutexe.find(m => m.mutexName === mutexName);

        // Find the activity by ID and assign the mutex to it
        const activityToUpdate = this.activities.find(a => a.id === parseInt(activityId));
        if (activityToUpdate) {
            activityToUpdate.assignMutex(mutex); // Pass the Mutex object
            console.log(`Assigned mutex '${mutexName}' to activity with ID ${activityId}.`);
        } else {
            alert(`Activity with ID ${activityId} not found.`);
        }
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