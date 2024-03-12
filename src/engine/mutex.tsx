type ActivityPriorityMap = Record<string, number>;

enum MutexStatus {
    Free = "free",
    Blocked = "blocked",
}

class Mutex {
    public readonly mutexName: string;
    public activityMap: ActivityPriorityMap;
    public status: MutexStatus;

    constructor(mutexName: string) {
        this.mutexName = mutexName;
        this.activityMap = {};
        this.status = MutexStatus.Free;
    }

    addActivityId(activityId: number, priority: number): void {
        if (!Object.hasOwnProperty.call(this.activityMap, activityId)) {
            this.activityMap[activityId] = priority;
        }
    }

    getPrioOfActivity(activityId: number): number | null {
        if (Object.hasOwnProperty.call(this.activityMap, activityId)) {
            return this.activityMap[activityId];
        }
        return null;
    }

    // Status
    block(): void {
        this.status = MutexStatus.Blocked;
    }
    unblock(): void {
        this.status = MutexStatus.Free;
    }
    getStatus(): MutexStatus {
        return this.status;
    }

    removeActivityId(activityId: number): void {
        delete this.activityMap[activityId];
    }
}

export default Mutex;
