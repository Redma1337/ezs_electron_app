import Activity from "./activity";

export enum MutexStatus {
    Free = "free",
    Blocked = "blocked",
}

class Mutex {
    public readonly id: number;
    public readonly mutexName: string;
    public sortedActivities: Activity[];
    public status: MutexStatus;
    private priority: number;
    public maxPriorityCeiling: number;

    constructor(id: number, mutexName: string) {
        this.id = id;
        this.mutexName = mutexName;
        this.sortedActivities = [];
        this.priority = 0;
        this.maxPriorityCeiling = undefined;
        this.status = MutexStatus.Free;
    }

    public getId(): number {
        return this.id;
    }

    public addActivity(activity: Activity) {
        if (!this.sortedActivities.some(a => a.id === activity.id)) {
            this.sortedActivities.push(activity);
        }
        this.sortActivitiesInMutex();
        this.setMutexPriority();

        // PCP: set inherited priority
        this.inheritPriority();
    }

    private inheritPriority() {
        this.sortedActivities.forEach(activity => {
            activity.inheritedPriority = activity.setInheritedPriority();
        });
    }

    private sortActivitiesInMutex() {
        this.sortedActivities.sort((a, b) => b.getPriority() - a.getPriority());
    }

    private setMutexPriority() {
        this.priority = this.getFirstPriority();
    }

    private getFirstPriority(): number {
        return this.sortedActivities[0].getPriority();
    }

    public getPriority(): number {
        return this.priority;
    }

    public containsActivity(activityId: number): boolean {
        return this.sortedActivities.some(activity => activity.id === activityId);
    }

    public lock() {
        this.status = MutexStatus.Blocked;
    }

    public unblock() {
        this.status = MutexStatus.Free;
    }

    public getStatusString(): string {
        return this.status;
    }

    public removeActivityId(activityId: number) {
        this.sortedActivities = this.sortedActivities.filter(activity => activity.id !== activityId);

        this.sortActivitiesInMutex();
        this.setMutexPriority();

        // PCP: set inherited priority
        this.inheritPriority();
    }

    //PCP
    public setPcpPriority(activities: Activity[]) {
        let maxPriorityCeiling = 0;
        activities.forEach(activity => {
            // ... größte Priorität (P2) der Tasks, die die Ressource (BM) nicht benutzen && die höhere Priorität haben als P1.
            if ((activity.priority > maxPriorityCeiling) && (!this.sortedActivities.includes(activity)) && (activity.priority > this.getFirstPriority())) {
                maxPriorityCeiling = activity.priority;
            }
        });
        if (maxPriorityCeiling == 0) {
            this.maxPriorityCeiling = Infinity;
            return;
        }
        // Sie sollte aber kleiner sein als ... 
        this.maxPriorityCeiling = maxPriorityCeiling - 1;
    }
}

export default Mutex;
