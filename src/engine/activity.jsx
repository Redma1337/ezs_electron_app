class Activity {
    constructor(id, task) {
        this.id = id;
        this.task = task;
        this.outSemaphores = [];
        this.inSemaphores = [];
    }
}

export default  Activity;