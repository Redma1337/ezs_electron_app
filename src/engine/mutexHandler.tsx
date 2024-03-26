import Mutex from "./mutex";
import Activity from "./activity";

class MutexHandler {
    private sortedMutexes: Mutex[];
    private activitiesMutexprio: Activity[];
    pcp: boolean;
    simultaneousTasks: number;

    constructor() {
        this.sortedMutexes = [];
        this.activitiesMutexprio = [];
        this.pcp = false;
        this.simultaneousTasks = 5; // TODO: in graphComponent
    }

    public enablePCP() {
        this.pcp = true;
    }

    public enableInheritance() {
        this.pcp = false;
    }

    public setSimultaneousTasks(amount: number) {
        this.simultaneousTasks = amount;
    }

    // Sort Mutexes by Prio
    private fillSortedMutexes(mutexes: Mutex[]) {
        this.sortedMutexes = [...mutexes].sort((a, b) => b.getPriority() - a.getPriority());
        console.log("Mutexes nach Prio: ", this.sortedMutexes);
    }

    // Sort activities by Mutex Main Prio (activities are already sorted by their own prio)
    private fillActivitiesMutexprio() {
        this.sortedMutexes.forEach(mutex => {
            mutex.sortedActivities.forEach(activity => {
                this.addToActivitiesMutexprio(activity);
            });
        });
    }

    private addToActivitiesMutexprio(activity: Activity) {
        //if not exists!
        const activityExists = this.activitiesMutexprio.some(a => a.id === activity.id);
        if (!activityExists) {
            this.activitiesMutexprio.push(activity);
        }
    }

    private sortAllPrios(nodes: Activity[]): Activity[]{
        nodes.sort((a, b) => {
            let priorityA = a.getInheritedPriority() !== undefined ? a.getInheritedPriority() : a.getPriority();
            let priorityB = b.getInheritedPriority() !== undefined ? b.getInheritedPriority() : b.getPriority();
    
            return priorityB - priorityA;
        });

        return nodes;
    }


    public handleMutexe(validNodes: Activity[], mutexes: Mutex[]): Activity[] {

        // fill sortedMutexes -> mutex Handler muss alle Mutexes bekommen 
        this.fillSortedMutexes(mutexes);
        this.fillActivitiesMutexprio();

        // get valid nodes without mutex
        let validNodesWithoutMutex = validNodes.filter(activity => activity.mutexes.length === 0);
        console.log("Activities mit Mutex: ", this.activitiesMutexprio);

        let validNodesWithMutex = this.activitiesMutexprio.filter(activity => (activity.isValid()) && (activity.mutexes.length > 0)); //KEEP! only valid nodes should request locks! 
        console.log("Valid Activities mit Mutex: ", validNodesWithMutex);

        if (!this.pcp) {
            // valid and has mutex and locked all mutexes or has blocked already
            validNodesWithMutex = validNodesWithMutex.filter(activity => (activity.requestLocks() || activity.hasMutexBlocked()));

            validNodes = validNodesWithMutex.concat(validNodesWithoutMutex);

            // Inheritation -> mit Unterbrechung (Task mit höherer Prio (ohne Mutex) muss ausgeführt werden können)
            // sort validNodes by activity prio and mutex prio! -> for single task execution 
            validNodes = this.sortAllPrios(validNodes);
        }

        if (this.pcp) {
            // valid and has mutex and has blocked already
            let validNodesWithBlockedMutex = validNodesWithMutex.filter(activity => activity.hasMutexBlocked());

            // valid and locked mutex 
            let validNodesWithRequestedMutex = validNodesWithMutex.filter(activity => activity.requestLocks());

            let validNodesWithRequestdWithoutMutex = this.sortAllPrios([...validNodesWithRequestedMutex, ...validNodesWithoutMutex]);

            // valid nodes with blocked mutex first, then all others sorted by prio
            validNodes = [...validNodesWithBlockedMutex, ...validNodesWithRequestdWithoutMutex];
        }

        // keep amount that can run at same time in validNodes (cut all others off)
        validNodes = validNodes.slice(0, this.simultaneousTasks);

        console.log("Valid Nodes after Mutexhandler: ", validNodes);

        this.sortedMutexes = [];
        this.activitiesMutexprio = [];

        // return validNode connected to mutex and locked mutex + validNodes without mutex
        return validNodes;
    }
}

export default MutexHandler;
