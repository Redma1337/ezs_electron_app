import Semaphore from "./semaphore";
import Activity from "./activity";
import Mutex from "./mutex";
import MutexHandler from "./mutexHandler";
import { c } from "vite/dist/node/types.d-FdqQ54oU";

class Graph {
    public readonly activities: Activity[];
    public readonly mutexe: Mutex[];
    public mutexHandler: MutexHandler;

    constructor() {
        this.activities = [];
        this.mutexe = [];
        this.mutexHandler = new MutexHandler();
    }

    public addActivity(activity: Activity) {
        this.activities.push(activity);
        this.mutexHandler.fillSortInheritedMap(this.activities, this.mutexe); // once Mutex or Activity is added -> Denkfehler TODO
        console.log("Inherited Map: ", this.mutexHandler.inheritMap);
    }

    private getActivityById(id: number) {
        return this.activities.find(a => a.id === id);
    }

    private getMutexByName(mutexName: string): Mutex | undefined {
        return this.mutexe.find(mutex => mutex.mutexName === mutexName);
    }

    private createMutex(id: number, mutexName: string, activityId: number, priority: number): Mutex {
        const newMutex = new Mutex(id, mutexName);
        newMutex.addActivityId(activityId, priority);
        this.mutexe.push(newMutex);
        return newMutex;
    }

    public addOrUpdateMutex(mutexName: string, activityId: number, priority: number) {
        let mutexToUpdate = this.getMutexByName(mutexName);

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
            let id = this.mutexe.length + 1;
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
            mutex.sortActivityMap();
            console.log("Sorted Mutex:", mutex.activityMap);
            let firstPrio = mutex.getFirstPriority();
            console.log("First Priority: ", firstPrio);
        });
    }


    handleMutexe(validNodes: Activity[]): Activity[] {


        

        this.mutexHandler.fillSortMutexMap(this.activities, this.mutexe); // once Mutex or Activity is added -> Denkfehler TODO
        console.log("Mutex Map: ", this.mutexHandler.mutexMap);

        return this.mutexHandler.handleMutex(validNodes, this.mutexe);; // = validNodes 
    }

    walk() {
        // Search for nodes that have only active input semaphores
        let validNodes = this.activities.filter(activity => activity.isValid());

        // sort and filter nodes by mutex priority 
        validNodes = this.handleMutexe(validNodes);

        validNodes.forEach(activity => activity.trigger());
        console.log("Walk ende");
        console.log("");
        console.log("");
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