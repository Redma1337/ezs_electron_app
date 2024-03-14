import Activity from "./activity";

enum MutexStatus {
    Free = "free",
    Blocked = "blocked",
}

class Mutex {
    private readonly id: number;
    public readonly mutexName: string;
    public activityMap: Map<number, number>; // Todo: private readonly 
    private status: MutexStatus;

    constructor(id: number, mutexName: string) {
        this.id = id;
        this.mutexName = mutexName;
        this.activityMap = new Map<number, number>();
        this.status = MutexStatus.Free;
    }

    getId(): number {
        return this.id;
    }
    
    addActivityId(activityId: number, priority: number) {
        if (!this.activityMap.has(activityId)) {
            this.activityMap.set(activityId, priority);
        }
    }

    getPrioOfActivity(activityId: number): number | null {
        if (this.activityMap.has(activityId)) {
            return this.activityMap.get(activityId);
        }
        return null;
    }

    containsActivity(activityId: number): boolean {
        if (this.activityMap.has(activityId)) {
            return true;
        }
        return false;
    }

    sortActivityMap() {
        // Convert the Map to an array of [key, value] pairs
        const sortedArray = Array.from(this.activityMap.entries()).sort((a, b) => b[1] - a[1]);
        this.activityMap = new Map(sortedArray);
    }

    //fraglich?? nimmt next sicher die erste priority??
    getFirstPriority(): number | undefined {
        this.sortActivityMap(); // weiß noch nicht wo ich die aufrufe - kommt später TODO!
        const iterator = this.activityMap.values();
        const firstPriority: number = iterator.next().value;
        return firstPriority;
    }

    // Methode zum Abrufen der Priorität jeder Aktivität für einen bestimmten Mutex -> gehört in Mutex 
    getHighestMutexPriority(validNodes: Activity[], mutex: Mutex): { validNode: Activity; highestPriority: number }[] {
        return validNodes.map(validNode => ({
            validNode,
            highestPriority: mutex.getPrioOfActivity(validNode.id)
        }));
    }

    // Methode zum Abrufen der Aktivität mit der höchsten Mutexpriorität bei nur einem Mutex -> gehört in Mutex 
    oneMutexPriority(nodes: Activity[], mutex: Mutex): Activity[] {
        let nodePriorities = this.getHighestMutexPriority(nodes, mutex);

        //sort nodes based on mutex priority
        nodePriorities.sort((a, b) => b.highestPriority - a.highestPriority);

        //get highest node (first element in array)
        let highestNode: Activity[] = []
        highestNode.push(nodePriorities[0].validNode);
        return highestNode;
    }



    // Status
    block() {
        this.status = MutexStatus.Blocked;
    }
    unblock() {
        this.status = MutexStatus.Free;
    }
    getStatus(): MutexStatus {
        return this.status;
    }

    removeActivityId(activityId: number) {
        this.activityMap.delete(activityId);
    }

}

export default Mutex;
