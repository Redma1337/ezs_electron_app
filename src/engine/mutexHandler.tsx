import Mutex from "./mutex";
import Activity from "./activity";

class MutexHandler {
    private sortedMutexes: Mutex[];
    private activitiesMutexprio: Activity[];

    constructor() {
        this.sortedMutexes = [];
        this.activitiesMutexprio = [];
    }

    // Sort Mutexes by Prio
    fillSortedMutexes(mutexes: Mutex[]) {
        this.sortedMutexes = [...mutexes].sort((a, b) => b.getPriority() - a.getPriority());
        console.log("Mutexes nach Prio: ", this.sortedMutexes);
    }

    // Sort activities by Mutex Main Prio (activities are already sorted by their own prio)
    fillActivitiesMutexprio() {
        this.sortedMutexes.forEach(mutex => {
            mutex.sortedActivities.forEach(activity => {
                this.addToActivitiesMutexprio(activity);
            });
        });
    }

    addToActivitiesMutexprio(activity: Activity) {
        //if not exists!
        const activityExists = this.activitiesMutexprio.some(a => a.id === activity.id);
        if (!activityExists) {
            this.activitiesMutexprio.push(activity);
        }
    }

    handleMutexe(validNodes: Activity[], mutexes: Mutex[]): Activity[] {

        // fill sortedMutexes -> mutex Handler muss irgendwie alle Mutexes bekommen 
        this.fillSortedMutexes(mutexes);
        this.fillActivitiesMutexprio();

        // get valid nodes without mutex
        let validNodesWithoutMutex = validNodes.filter(activity => activity.mutexes.length === 0);
        console.log("Valid Activities ohne Mutex: ", validNodesWithoutMutex);

        // valid and has mutex and locked mutex
        let validNodesWithMutex = this.activitiesMutexprio.filter(activity => activity.isValid() && activity.mutexes.length > 0 && activity.requestLocks());
        console.log("Valid Activities mit Mutex: ", validNodesWithMutex);
        console.log("Valid Activities mit Mutex und gelocktem Mutex: ", validNodesWithMutex);

        // unblock all mutexes
        mutexes.forEach(mutex => {
            mutex.unblock();
        });

        this.sortedMutexes = [];
        this.activitiesMutexprio = [];

        // return validNode connected to mutex and locked mutex + validNodes without mutex
        return validNodes = validNodesWithMutex.concat(validNodesWithoutMutex);
    }
}

export default MutexHandler;
