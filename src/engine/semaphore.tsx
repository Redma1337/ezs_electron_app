import Activity from "./activity";

class Semaphore {
    private active_state: boolean;
    public readonly sourceActivity: Activity;
    public readonly targetActivity: Activity;
    public readonly id: string;

    constructor(isActive: boolean, id: string, sourceActivity: Activity, targetActivity: Activity) {
        this.active_state = isActive;
        this.id = id;
        this.sourceActivity = sourceActivity;
        this.targetActivity = targetActivity;
    }

    public isActive() {
        return this.active_state;
    }

    public off() {
        this.active_state = false;
    }

    public on() {
        this.active_state = true;
    }
}

export default Semaphore;