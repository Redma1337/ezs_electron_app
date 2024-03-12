enum MutexStatus {
    Free = "free",
    Blocked = "blocked",
}

class Mutex {
    public readonly id: number;
    public readonly mutexName: string;
    public readonly activityMap: Map<number, number>;
    private status: MutexStatus;

    constructor(id: number, mutexName: string) {
        this.id = id;
        this.mutexName = mutexName;
        this.activityMap = new Map<number, number>();
        this.status = MutexStatus.Free;
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
        if(this.activityMap.has(activityId)) {
            return true;
        }
        return false;
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
