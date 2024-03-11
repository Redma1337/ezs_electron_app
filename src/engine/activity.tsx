import Semaphore from "./semaphore";

class Activity {
    public readonly outSemaphores: Semaphore[];
    public readonly inSemaphores: Semaphore[];

    constructor(
        public readonly id: number,
        public readonly task: string
    ) {
        this.task = task;
        this.outSemaphores = [];
        this.inSemaphores = [];
    }

    public addOutSemaphore(semaphore: Semaphore) {
        if (!semaphore) {
            console.error("semaphore is null");
            return;
        }

        this.outSemaphores.push(semaphore);
    }

    public addInSemaphore(semaphore: Semaphore) {
        if (!semaphore) {
            console.error("semaphore is null");
            return;
        }

        this.inSemaphores.push(semaphore);
    }

    public trigger() {
        this.inSemaphores.forEach(semaphore => semaphore.off());
        this.outSemaphores.forEach(semaphore => semaphore.on())
    }

    public isValid() {
        return this.inSemaphores.every(semaphore => semaphore.isActive());
    }

    public print() {
        console.log(this.task);
        this.inSemaphores.forEach(semaphore => console.log(this.task, " in ", semaphore.isActive))
        this.outSemaphores.forEach(semaphore => console.log(this.task, " out ", semaphore.isActive))
    }
}

export default  Activity;