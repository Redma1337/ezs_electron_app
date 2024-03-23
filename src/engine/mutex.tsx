import Activity from "./activity";

export enum MutexStatus {
    Free = "free",
    Blocked = "blocked",
}

class Mutex {
    private readonly id: number;
    public readonly mutexName: string;
    public sortedActivities: Activity[];
    public status: MutexStatus;
    private priority: number; 

    constructor(id: number, mutexName: string) {
        this.id = id;
        this.mutexName = mutexName;
        this.sortedActivities = [];
        this.priority = 0; 
        this.status = MutexStatus.Free;
    }

    getId(): number {
        return this.id;
    }

    addActivity(activity: Activity) {
        if (!this.sortedActivities.some(a => a.id === activity.id)) {
            this.sortedActivities.push(activity);
        }
        this.sortActivitiesInMutex();
        this.setMutexPriority();
    }

    updateActivityById(activityId: number, newActivity: Activity) {
        const index = this.sortedActivities.findIndex(activity => activity.id === activityId);

        if (index > -1) {
            this.sortedActivities.splice(index, 1);
            this.addActivity(newActivity);
        }
        this.recalculateMutexPriority();
    }

    recalculateMutexPriority() {
        this.sortActivitiesInMutex();
        this.setMutexPriority();
    }

    sortActivitiesInMutex() {
        this.sortedActivities.sort((a, b) => b.getPriority() - a.getPriority());
    }

    setMutexPriority() {
        this.priority = this.getFirstPriority();
    }

    getFirstPriority(): number {
        if (!this.sortedActivities[0]) {
            return 0;
        }
        return this.sortedActivities[0].getPriority();
    }

    getPriority(): number {
        return this.priority;
    }

    containsActivity(activityId: number): boolean {
        return this.sortedActivities.some(activity => activity.id === activityId);
    }

    lock() {
        this.status = MutexStatus.Blocked;
    }
    unblock() {
        this.status = MutexStatus.Free;
    }

    getStatusString(): string {
        return this.status;
    }

    removeActivityId(activityId: number) {
        this.sortedActivities = this.sortedActivities.filter(activity => activity.id !== activityId);

        this.sortActivitiesInMutex();
        this.setMutexPriority();
    }
}

export default Mutex;
