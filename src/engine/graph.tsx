import Semaphore from "./semaphore";
import Activity from "./activity";

class Graph {
    public readonly activities: Activity[];

    constructor() {
        this.activities = [];
    }

    public addActivity(activity: Activity) {
        this.activities.push(activity);
    }

    private getActivityById(id: number) {
        return this.activities.find(a => a.id === id);
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

    public walk() {
        //search for nodes that have only active semaphores
        const validNodes = this.activities.filter(activity => activity.isValid());
        validNodes.forEach(activity => activity.trigger());
    }

    public print() {
        this.activities.forEach(activity => {
            activity.print();
            console.log();
        })
    }
}

export default Graph;