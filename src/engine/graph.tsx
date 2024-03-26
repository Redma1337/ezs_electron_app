import Semaphore from "./semaphore";
import Activity from "./activity";
import Mutex from "./mutex";
import MutexHandler from "./mutexHandler";

class Graph {
    public readonly activities: Activity[];
    public readonly mutexes: Mutex[];
    public mutexHandler: MutexHandler;
    public validNodes: Activity[];

    constructor() {
        this.activities = [];
        this.mutexes = [];
        this.validNodes = [];
        this.mutexHandler = new MutexHandler();
    }

    public addActivity(activity: Activity) {
        this.activities.push(activity);
        console.log(`Added Activity: ${activity.task} id ${activity.id} prio ${activity.priority}`);
    }

    public changePriority(activityId: number, newPriority: number) {
        const activity = this.getActivityById(activityId);
        if (!activity) {
            console.error(`Activity with id ${activityId} not found`);
            return;
        }

        activity.priority = newPriority;
        console.log(`Changed priority of Activity: ${activity.task} id ${activity.id} to new priority ${newPriority}`);

        activity.mutexes.forEach(mutex => {
            mutex.recalculateMutexPriority();
            console.log(`Recalculated priorities for Mutex: ${mutex.mutexName}`);
        });
    }

    public changeTask(activityId: number, newTask: string) {
        const activity = this.getActivityById(activityId);
        if (!activity) {
            console.error(`Activity with id ${activityId} not found`);
            return;
        }

        activity.task = newTask;
        console.log(`Changed name of Activity: id ${activity.id} to new name ${activity.task}`);

        activity.mutexes.forEach(mutex => {
            mutex.updateActivityById(activity.id, activity);
            console.log(`Recalculated priorities for Mutex: ${mutex.mutexName}`);
        });
    }

    public removeActivity(activityToRemove: Activity) {
        // TODO: remove activity from all mutexes
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

    private getMutexById(mutexId: number): Mutex | undefined {
        return this.mutexes.find(mutex => mutex.getId() === mutexId);
    }

    private getPriorityById(activityId: number): number | undefined {
        const activity = this.getActivityById(activityId);
        return activity.getPriority();
    }

    public addMutex(mutexId: number, mutexName: string): Mutex {
        let mutexToUpdate = this.getMutexByName(mutexName);
        //if (mutexToUpdate) {
        //    alert(`Mutex '${mutexName}' already exists.`);
        //    return;
        //}
        const newMutex = new Mutex(mutexId, mutexName);
        this.mutexes.push(newMutex);
        console.log(`Added Mutex: ${mutexName} id ${mutexId}`);
        return newMutex;
    }

    // TODO: delete Mutex - in that function delete mutex from all activities

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

        activityToRemove.removeMutex(mutexToUpdate);
        mutexToUpdate.removeActivityId(activityId);

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
        const connection = new Semaphore(isActive, 's' + sourceActivity.id + '-' + targetActivity.id, sourceActivity, targetActivity)

        sourceActivity.addOutSemaphore(connection);
        targetActivity.addInSemaphore(connection);
    }

    public toggleSemaphore(semaphoreId: string) {
        this.activities.forEach(activity => {

            activity.outSemaphores.forEach(semaphore => {
                if (semaphore.id === semaphoreId) {
                    semaphore.isActive() ? semaphore.off() : semaphore.on();
                    console.log(`Toggled Semaphore: ${semaphoreId} to ${semaphore.isActive()}`);
                }
            });
        });
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

        sourceActivity.removeOutSemaphore(semaphoreIdToRemove);
        targetActivity.removeInSemaphore(semaphoreIdToRemove);

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
        this.validNodes = this.activities.filter(activity => activity.isValid()); // bruach ich hier nicht mehr? eiegntlich

        // sort and filter nodes by mutex priority
        this.validNodes = this.mutexHandler.handleMutexe(this.validNodes, this.mutexes);

        this.validNodes.forEach(activity => activity.trigger());
        // this.activities.forEach(activity => {
        //     console.log("Activity: ", activity.task, " - blocked Mutexes: ", activity.blockedMutexes)
        // });

        // trigger valid nodes if work done
        this.validNodes.forEach(activity => {
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