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

    addOrUpdateMutex(mutexName, activityId, priority) {
        // Find the mutex by name. If it doesn't exist, undefined will be returned
        let mutexToUpdate = this.getMutexByName(mutexName);

        // Mutex exists
        if (mutexToUpdate && !mutexToUpdate.activityMap.hasOwnProperty(activityId)) {
            mutexToUpdate.addActivityId(activityId, priority);  // Add new activity ID to existing mutex
            console.log(`Added Activity ID ${activityId} to existing Mutex '${mutexName}'.`);
            return;
        }

        // Mutex exists and activity ID already exists
        if (mutexToUpdate && mutexToUpdate.activityMap.hasOwnProperty(activityId)) {
            console.error(`Activity ID ${activityId} already exists in Mutex '${mutexName}'.`);
            return;
        }

        // Mutex does not exist
        if (!mutexToUpdate) {
            this.createMutex(mutexName, [activityId], priority); // Add the new mutex
            console.log(`New Mutex: '${mutexName}' - Activity ID: [${activityId}].`);
            return;
        }
    }

    createMutex(mutexName, activityId, priority) {
        const mutex = new Mutex(mutexName);
        mutex.addActivityId(activityId, priority);
        this.mutexe.push(mutex);
    }


    getMutexByName(mutexName) {
        return this.mutexe.find(m => m.mutexName === mutexName);
    }

    connect(sourceActivity, targetActivity, isActive) {
        //this shares a reference of the semaphore to both activities which makes controlling bot easy
        const connection = new Semaphore(isActive)

        sourceActivity.outSemaphores.push(connection);
        targetActivity.inSemaphores.push(connection);
    }

    // Only for debugging
    seeAssignedMutexes() {
        console.log("");
        console.log("-- Activities --");
        this.activities.forEach(a => {
            const assignedMutexes = a.mutexe.map(m => m.mutexName).join(", ") || 'None';
            console.log(`Activity ${a.id} (${a.task}): Mutexes - ${assignedMutexes}`);
        });
        console.log("");
        console.log("-- Mutexes --");
        this.mutexe.forEach(mutex => {
            console.log(`Mutex '${mutex.mutexName}': Status - ${mutex.status}`);
            if (Object.keys(mutex.activityMap).length > 0) {
                console.log("Activities:");
                Object.entries(mutex.activityMap).forEach(([activityId, priority]) => {
                    console.log(`- ID ${activityId} (Prio: ${priority})`);
                });
            } else {
                console.log("- No activities");
            }
        });

    }

    sortNodesByMutexPriority(nodes) {
        const nodePriorities = nodes.map(node => {
            let highestPriority = -Infinity;

            this.mutexe.forEach(mutex => {
                const nodePriority = mutex.getPrioOfActivity(node.id);
                if (nodePriority !== null && nodePriority > highestPriority) {
                    highestPriority = nodePriority;
                }
            });

            return {
                node,
                highestPriority: highestPriority === -Infinity ? "No priority" : highestPriority
            };
        });

        // Unsorted Nodes
        console.log("Unsorted Nodes:");
        nodePriorities.forEach(np => console.log(`- ${np.node.task} - Prio: ${np.highestPriority}`));

        // Sorting nodes based on mutex priority
        nodePriorities.sort((a, b) => b.highestPriority - a.highestPriority);

        // Sorted nodes
        console.log("Sorted nodes:");
        nodePriorities.forEach(np => console.log(`- ${np.node.task} - Prio: ${np.highestPriority}`));
        console.log("");

        return nodePriorities.map(np => np.node);
    }

    walk() {
        // Search for nodes that have only active input semaphores
        let validNodes = this.activities.filter(activity => activity.inSemaphores.every(semaphore => semaphore.isActive));

        // Unlock mutex after processing 
        this.mutexe.forEach(mutex => mutex.unblock());

        // Remove mutex from activity
        this.activities.forEach(activity => activity.removeMutexe());

        // Sort nodes by their priority in each mutex they're part of.
        validNodes = this.sortNodesByMutexPriority(validNodes);

        validNodes.forEach(activity => {
            // each mutex related to the activity
            this.mutexe.forEach(mutex => {
                const currentMutex = this.getMutexByName(mutex.mutexName);

                // check for activity ID mutex's activityMap
                if (currentMutex && currentMutex.activityMap.hasOwnProperty(activity.id)) {

                    // Check status 
                    if (currentMutex.getStatus() === "free") {
                        // Lock the mutex and update semaphore states

                        currentMutex.block();
                        activity.assignMutex(currentMutex);

                        //walk()
                        activity.inSemaphores.forEach(inSemaphore => {
                            inSemaphore.isActive = false;
                        });

                        activity.outSemaphores.forEach(outSemaphore => {
                            outSemaphore.isActive = true;
                        });
                    } else {
                        console.log(`Mutex ${currentMutex.mutexName} is blocked.`);
                    }
                } else {
                    activity.inSemaphores.forEach(inSemaphore => {
                        inSemaphore.isActive = false;
                    });

                    activity.outSemaphores.forEach(outSemaphore => {
                        outSemaphore.isActive = true;
                    });
                }
            });
        });
        //mutex.grantPermission();
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
        console.log("--------------------------");
    }


    printSemaphores() {
        console.log("-- Active Semaphores --");

        // in all activities
        this.activities.forEach(activity => {
            activity.outSemaphores.forEach(semaphore => { // For each outsemaphore in the activity
                // get target activity for this semaphore
                const targetActivity = this.activities.find(a => a.inSemaphores.includes(semaphore));

                if (targetActivity) {
                    // Determine the status of the connection based on the semaphore's active state
                    const status = semaphore.isActive ? "Active" : " - ";
                    console.log(`${activity.task} -> ${targetActivity.task}: ${status}`);
                }
            });
        });
        this.seeAssignedMutexes();
        console.log("--------------------------");
        console.log("");
    }



}

export default Graph;