import Semaphore from "./semaphore";
import Activity from "./activity";
import Mutex from "./mutex";
//import MutexHandler from "./mutexHandler";
import { c } from "vite/dist/node/types.d-FdqQ54oU";

class Graph {
    public readonly activities: Activity[];
    public readonly mutexe: Mutex[];

    constructor() {
        this.activities = [];
        this.mutexe = [];
    }

    public addActivity(activity: Activity) {
        this.activities.push(activity);
    }

    private getActivityById(id: number) {
        return this.activities.find(a => a.id === id);
    }

    private getMutexID(id: number): Mutex | undefined {
        return this.mutexe.find(mutex => mutex.id === id);
    }

    private createMutex(id: number, mutexName: string, activityId: number, priority: number): Mutex {
        const newMutex = new Mutex(id, mutexName);
        newMutex.addActivityId(activityId, priority);
        this.mutexe.push(newMutex);
        return newMutex;
    }

    public addOrUpdateMutex(id: number, mutexName: string, activityId: number, priority: number) {
        let mutexToUpdate = this.getMutexID(id);

        // Mutex exists
        if (mutexToUpdate && (!mutexToUpdate.containsActivity(activityId))) {
            mutexToUpdate.addActivityId(activityId, priority);
            console.log(`Added Activity ID ${activityId} to existing Mutex '${mutexName}'.`);
            return;
        }

        // Mutex exists and activity ID already exists
        if (mutexToUpdate && mutexToUpdate.containsActivity(activityId)) {
            console.error(`Activity ID ${activityId} already exists in Mutex '${mutexName}'.`);
            return;
        }

        // Mutex does not exist
        if (!mutexToUpdate) {
            let newMutex = this.createMutex(id, mutexName, activityId, priority);
            newMutex.addActivityId(activityId, priority);
            console.log(`New Mutex: '${mutexName}' - Activity ID: ${activityId}.`);
            return;
        }
    }

    public connect(sourceActivityId: number, targetActivityId: number, isActive: boolean) {
        if (sourceActivityId === targetActivityId) {
            console.error("Cannot connect an activity to itself");
            return;
        }

        const sourceActivity = this.getActivityById(sourceActivityId);
        const targetActivity = this.getActivityById(targetActivityId);

        if (!sourceActivity || !targetActivity) {
            console.error("Activity not found");
            return;
        }

        //this shares a reference of the semaphore to both activities which makes controlling bot easy
        const connection = new Semaphore(isActive)

        sourceActivity.addOutSemaphore(connection);
        targetActivity.addInSemaphore(connection);
    }

    // Only for debugging
    seeAssignedMutexes() {
        console.log("");
        console.log("-- Activities --");
        this.activities.forEach(a => {
            const assignedMutexes = a.mutexe.map(m => m.mutexName).join(", ") || '-';
            console.log(`Activity ${a.id}, (${a.task}): Mutexes: ${assignedMutexes}`);
        });
        console.log("");
        console.log("-- Mutexes --");
        this.mutexe.forEach(mutex => {
            console.log(`Mutex '${mutex.mutexName}': Status - ${mutex.getStatus()}`);
            if (mutex.activityMap.size > 0) {
                console.log("Activities:");
                // Iterate over the Map object directly
                mutex.activityMap.forEach((priority, activityId) => {
                    console.log(`- ID ${activityId} (Prio: ${priority})`);
                });
            } else {
                console.log("- No activities");
            }
            
        });
    }


    getHighestMutexPriority(nodes: Activity[]): { node: Activity; highestPriority: string | number }[] {
        return nodes.map(node => {
            let highestPriority: number = -Infinity;

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
    }



    sortNodes(nodes: Activity[]): Activity[] {
        let nodePriorities = this.getHighestMutexPriority(nodes);

        // Unsorted Nodes
        console.log("Unsorted Nodes:");
        nodePriorities.forEach(np => console.log(`- ${np.node.task} - Prio: ${np.highestPriority}`));

        // Sort nodes based on mutex priority
        nodePriorities.sort((a, b) => {
            return (typeof b.highestPriority === 'number' ? b.highestPriority : -Infinity) - (typeof a.highestPriority === 'number' ? a.highestPriority : -Infinity);
        });

        // Sorted nodes
        console.log("Sorted nodes:");
        nodePriorities.forEach(np => console.log(`- ${np.node.task} - Prio: ${np.highestPriority}`));

        return nodePriorities.map(np => np.node);
    }
    
    walk() {
        // Unlock mutex after processing 
        this.mutexe.forEach(mutex => mutex.unblock());

        // Remove mutex from activity
        this.activities.forEach(activity => activity.removeMutexe());

        // Search for nodes that have only active input semaphores
        let validNodes = this.activities.filter(activity => activity.isValid());

        
        // sort nodes by mutex priority
        validNodes = this.sortNodes(validNodes);

        // valid Notes filter only the one that need to be triggered -> sort, filter, has mutex! 

        validNodes.forEach(activity => {
            // each mutex related to the activity
            this.mutexe.forEach(mutex => {
                const currentMutex = this.getMutexID(mutex.id);

                // check for activity ID mutex's activityMap
                if (currentMutex && currentMutex.containsActivity(activity.id) && currentMutex.getStatus() === "free") {
                    currentMutex.block();
                    activity.assignMutex(currentMutex);
                    activity.trigger();
                    return;
                }

                // activity ID in mutex and blocked
                if (currentMutex && currentMutex.containsActivity(activity.id) && currentMutex.getStatus() === "blocked") {
                    console.log("");
                    console.log(`Mutex ${currentMutex.mutexName} is blocked.`);
                    console.log(`Activity ${activity.task} is waiting for Mutex ${currentMutex.mutexName}.`);
                    console.log("");
                    return;
                } 

                // no muted related node 
                if (!currentMutex.containsActivity(activity.id)) {
                    activity.trigger();
                    return;
                }
            });
        });
    }

    public print() {
        this.activities.forEach(activity => {
            activity.print();
            console.log();
        })
    }

    printSemaphores() {
        console.log("-- Active Semaphores --");
    
        this.activities.forEach(activity => {
            // outgoing semaphore of the activity
            activity.outSemaphores.forEach(semaphore => {
                // get target activity for this semaphore
                const targetActivity = this.activities.find(a => a.inSemaphores.includes(semaphore));
    
                if (targetActivity) {
                    const status = semaphore.isActive() ? "Active" : "-";
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