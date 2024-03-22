import Semaphore from "./semaphore";
import Activity from "./activity";
import Mutex from "./mutex";
import MutexHandler from "./mutexHandler";

class Graph {
    public readonly activities: Activity[];
    public readonly mutexes: Mutex[];
    public mutexHandler: MutexHandler;

    constructor() {
        this.activities = [];
        this.mutexes = [];
        this.mutexHandler = new MutexHandler();
    }

    public addActivity(activity: Activity) {
        this.activities.push(activity);
        console.log(`Added Activity: ${activity.task} id ${activity.id} prio ${activity.priority}`);
    }

    public removeActivity(activityToRemove: Activity) {
        const index = this.activities.findIndex(activity => activity.id === activityToRemove.id);
        if (index > -1) {
            this.activities.splice(index, 1);
            console.log(`Removed Activity: ${activityToRemove.task} id ${activityToRemove.id} prio ${activityToRemove.priority}`);
        } else {
            console.log(`Activity not found: id ${activityToRemove.id}`);
        }
    }

    private getActivityById(id: number): Activity {
        return this.activities.find(activity => activity.id === id);;
    }

    private getMutexByName(mutexName: string): Mutex | undefined {
        return this.mutexes.find(mutex => mutex.mutexName === mutexName);
    }

    private getPriorityById(activityId: number): number | undefined {
        const activity = this.getActivityById(activityId);
        return activity.getPriority();
    }

    public addMutex(mutexName: string): Mutex {
        let mutexToUpdate = this.getMutexByName(mutexName);
        if (mutexToUpdate) {
            alert(`Mutex '${mutexName}' already exists.`);
            return;
        }
        let id = this.mutexes.length + 1;
        const newMutex = new Mutex(id, mutexName);
        this.mutexes.push(newMutex);
        return newMutex;
    }

    public connectToMutex(activityId: number, mutexName: string) {
        let mutexToUpdate = this.getMutexByName(mutexName);

        // activity ID already exists
        if (mutexToUpdate.containsActivity(activityId)) {
            alert(`Activity ID ${activityId} already exists in Mutex '${mutexName}'.`);
            return;
        }

        let activity = this.getActivityById(activityId);
        let priority = this.getPriorityById(activityId);

        mutexToUpdate.addActivity(activity);
        activity.assignMutex(mutexToUpdate);

        console.log(`Added Activity ID ${activityId} to Mutex '${mutexName}' priority ${priority}.`);

        return;
    }

    public deconnectFromMutex(activityId: number, mutexName: string) { //TODO

    }

    // maybe connectActivities
    public connectActivities(sourceActivityId: number, targetActivityId: number, isActive: boolean) {
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
        const connection = new Semaphore(isActive, 's' + sourceActivity.id + '-' + targetActivity.id, sourceActivity, targetActivity)

        sourceActivity.addOutSemaphore(connection);
        targetActivity.addInSemaphore(connection);
        console.log(`Added connection between activity with id: ${sourceActivityId} and ${targetActivityId}.`);
    }

    // disconnectActivities
    public disconnectActivities(sourceActivityId: number, targetActivityId: number, semaphoreIdToRemove: string) {
        if (sourceActivityId === targetActivityId) {
            console.error("Cannot disconnect an activity from itself");
            return;
        }

        if (!semaphoreIdToRemove) {
            console.error("Semaphore is null");
        }

        const sourceActivity = this.getActivityById(sourceActivityId);
        const targetActivity = this.getActivityById(targetActivityId);

        if (!sourceActivity && !targetActivity) {
            console.error("Activity not found");
            return;
        }
        if (!(sourceActivity == undefined)) {
            sourceActivity.removeOutSemaphore(semaphoreIdToRemove);
        }
        if (!(targetActivity == undefined)) {
            targetActivity.removeInSemaphore(semaphoreIdToRemove);
        }

        console.log(`disconnected activity with id: ${sourceActivityId} and ${targetActivityId}.`);
    }

    public removeInvalidSemaphores() {
        // remove semaphores with non-existing source/target-activites
        this.activities.forEach(activity => {
            const outSemaphoresToRemove = activity.outSemaphores.filter(semaphore =>
                !this.activities.some(act => act.id === semaphore.targetActivity.id)
            );
            outSemaphoresToRemove.forEach(semaphore => {
                activity.removeOutSemaphore(semaphore.id);
            })

            const inSemaphoresToRemove = activity.inSemaphores.filter(semaphore =>
                !this.activities.some(act => act.id === semaphore.sourceActivity.id)
            );
            inSemaphoresToRemove.forEach(semaphore => {
                activity.removeInSemaphore(semaphore.id);
            })
        });
    }



    walk() {
        // Search for nodes that have only active input semaphores
        let validNodes = this.activities.filter(activity => activity.isValid()); // bruach ich hier nicht mehr? eiegntlich 

        // sort and filter nodes by mutex priority 
        validNodes = this.mutexHandler.handleMutexe(validNodes, this.mutexes);

        validNodes.forEach(activity => activity.trigger());
    }

    public print() {
        this.activities.forEach(activity => {
            activity.print();
            console.log();
        })
    }

    printSemaphores() {
        console.log("");
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

        console.log("--------------------------");
        console.log("");
    }

    // Only for debugging
    seeAssignedMutexes() {
        console.log("");
        console.log("-- Activities --");
        this.activities.forEach(a => {
            // Assuming each activity knows its assigned mutexes directly
            const assignedMutexes = a.mutexes.map(m => m.mutexName).join(", ") || '-';
            console.log(`Activity ${a.id}, (${a.task}): Mutexes: ${assignedMutexes}`);
        });

        console.log("");
        console.log("-- Mutexes --");
        this.mutexes.forEach(mutex => {
            console.log(`Mutex '${mutex.mutexName}': Status - ${mutex.getStatusString()}`);

            if (mutex.sortedActivities.length > 0) {
                console.log("Activities:");
                mutex.sortedActivities.forEach(activity => {
                    console.log(`- ID ${activity.id} (Task: ${activity.task}, Prio: ${activity.priority})`);
                });
            } else {
                console.log("- No activities");
            }

            console.log("Sorted Activities:", mutex.sortedActivities.map(a => `ID ${a.id} (Prio: ${a.priority})`).join(", "));

            console.log("Mutex Priority: ", mutex.getPriority());
            console.log("");
        });
    }
}

export default Graph;