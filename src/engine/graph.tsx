import Semaphore from "./semaphore";
import Activity from "./activity";
import Mutex from "./mutex";

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

    private getMutexByName(mutexName: string): Mutex | undefined {
        return this.mutexe.find(mutex => mutex.mutexName === mutexName);
    }

    private createMutex(mutexName: string, activityId: number, priority: number): void {
        const newMutex = new Mutex(mutexName);
        newMutex.addActivityId(activityId, priority);
        this.mutexe.push(newMutex);
    }

    public addOrUpdateMutex(mutexName: string, activityId: number, priority: number): void {
        let mutexToUpdate = this.getMutexByName(mutexName);

        if (mutexToUpdate && !Object.hasOwnProperty.call(mutexToUpdate.activityMap, activityId)) {
            mutexToUpdate.addActivityId(activityId, priority);
            console.log(`Added Activity ID ${activityId} to existing Mutex '${mutexName}'.`);
            return;
        }

        if (mutexToUpdate && Object.hasOwnProperty.call(mutexToUpdate.activityMap, activityId)) {
            console.error(`Activity ID ${activityId} already exists in Mutex '${mutexName}'.`);
            return;
        }

        if (!mutexToUpdate) {
            this.createMutex(mutexName, activityId, priority);
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
    seeAssignedMutexes(): void {
        console.log("");
        console.log("-- Activities --");
        this.activities.forEach(a => {
            const assignedMutexes = a.mutexe.map(m => m.mutexName).join(", ") || '-';
            console.log(`Activity ${a.id}, (${a.task}): Mutexes: ${assignedMutexes}`);
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

    sortNodesByMutexPriority(nodes: Activity[]): Activity[] {
        const nodePriorities = nodes.map(node => {
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

        // Unsorted Nodes
        console.log("Unsorted Nodes:");
        nodePriorities.forEach(np => console.log(`- ${np.node.task} - Prio: ${np.highestPriority}`));

        // Sorting nodes based on mutex priority
        nodePriorities.sort((a, b) => (b.highestPriority as number) - (a.highestPriority as number));

        // Sorted nodes
        console.log("Sorted nodes:");
        nodePriorities.forEach(np => console.log(`- ${np.node.task} - Prio: ${np.highestPriority}`));
        console.log("");

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
        validNodes = this.sortNodesByMutexPriority(validNodes);

        validNodes.forEach(activity => {
            // each mutex related to the activity
            this.mutexe.forEach(mutex => {
                const currentMutex = this.getMutexByName(mutex.mutexName);

                // check for activity ID mutex's activityMap
                if (currentMutex && currentMutex.activityMap.hasOwnProperty(activity.id) && currentMutex.getStatus() === "free") {
                    currentMutex.block();
                    activity.assignMutex(currentMutex);
                    activity.trigger()
                    return;
                }

                // activity ID in mutex and blocked
                if (currentMutex && currentMutex.activityMap.hasOwnProperty(activity.id) && currentMutex.getStatus() === "blocked") {

                    console.log(`Mutex ${currentMutex.mutexName} is blocked.`);
                    console.log(`Activity ${activity.task} is waiting for Mutex ${currentMutex.mutexName}.`);
                    console.log("");
                    return;
                } 

                // no muted related node 
                if (!currentMutex.activityMap.hasOwnProperty(activity.id)) {
                    activity.trigger()
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