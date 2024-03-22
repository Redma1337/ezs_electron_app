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

    private getActivityById(id: number): Activity {
        return this.activities.find(activity => activity.id === id);;
    }

    private getMutexByName(mutexName: string): Mutex | undefined {
        return this.mutexes.find(mutex => mutex.mutexName === mutexName);
    }

    private getMutexById(mutexId: number): Mutex | undefined {
        return this.mutexes.find(mutex => mutex.id === mutexId);
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

    public removeMutex(mutexName: number) {
        console.log("Mutex Name: ", mutexName);
        let mutexToRemove = this.getMutexById(mutexName);
        console.log("Mutex to remove: ", mutexToRemove);
        // remove mutex from all activities
        mutexToRemove.sortedActivities.forEach(activity => {
            this.disconnectFromMutex(activity.id, mutexToRemove.mutexName);
        });
        //remove mutex from mutexes
        this.mutexes.splice(this.mutexes.indexOf(mutexToRemove), 1);
        console.log(`Removed Mutex '${mutexName}'.`);
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

        activity.assignMutex(mutexToUpdate);
        mutexToUpdate.addActivity(activity);

        //pcp:
        mutexToUpdate.setPcpPriority(this.activities); // hier weil muss alle Activities kennen um Prio zu setzen

        console.log(`Added Activity ID ${activityId} to Mutex '${mutexName}' priority ${priority}.`);

        return;
    }

    public disconnectFromMutex(activityId: number, mutexName: string) { //TODO
        let activityToRemove = this.getActivityById(activityId);
        let mutexToUpdate = this.getMutexByName(mutexName);

        activityToRemove.mutexes = activityToRemove.mutexes.filter(mutex => mutex.mutexName !== mutexName);
        //TODO: remove activity from mutex
        //TODO: remove mutex from activity

        //TODO: //pcp:
        mutexToUpdate.setPcpPriority(this.activities);
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
        const connection = new Semaphore(isActive)

        sourceActivity.addOutSemaphore(connection);
        targetActivity.addInSemaphore(connection);
    }

    // disConnectActivities


    walk() {
        // this.activities.forEach(activity => {
        //     console.log("Activity: ", activity.task, " Mutexes: ", activity.mutexes, "Inherited Prio: ", activity.inheritedPriority);
        // });

        // Search for nodes that have only active input semaphores
        let validNodes = this.activities.filter(activity => activity.isValid());

        // sort and filter nodes by mutex priority 
        validNodes = this.mutexHandler.handleMutexe(validNodes, this.mutexes);

        // this.activities.forEach(activity => {
        //     console.log("Activity: ", activity.task, " - blocked Mutexes: ", activity.blockedMutexes)
        // });

        // trigger valid nodes if work done
        validNodes.forEach(activity => {
            console.log(`Activity ${activity.task} workload: ${activity.currentWorkload}/${activity.workload}`);
            if (!activity.work()) {
                activity.releaseLocks(); // release Mutexes
                activity.trigger();
            }
        });

        // release all mutexes that are not completely blocked 
        this.activities.forEach(activity => {
            //console.log("Activity: ", activity.task, " - hasMutexBlocked: ", activity.hasMutexBlocked());
            if (!activity.hasMutexBlocked()) {
                //console.log("Released Mutexes: ", activity.blockedMutexes);
                activity.releaseLocks();
            }
        });
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