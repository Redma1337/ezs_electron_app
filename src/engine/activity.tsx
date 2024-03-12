import Semaphore from "./semaphore";
import Mutex from "./mutex";

class Activity {
    public readonly outSemaphores: Semaphore[];
    public readonly inSemaphores: Semaphore[];
    public mutexe: Mutex[];

    constructor(
        public readonly id: number,
        public readonly task: string
    ) {
        this.task = task;
        this.outSemaphores = [];
        this.inSemaphores = [];
        this.mutexe = [];
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
        this.outSemaphores.forEach(semaphore => semaphore.on());
    }

    public isValid() {
        return this.inSemaphores.every(semaphore => semaphore.isActive());
    }

    // assign a mutex to this activity
    assignMutex(mutex: Mutex) {
        // only add if not exists
        const exists = this.mutexe.some(m => m.mutexName === mutex.mutexName);
        if (!exists) {
            this.mutexe.push(mutex);
        }
    }

    // remove a mutex from an activity      
    public removeMutexe() {
        this.mutexe = [];
    }

    public print() {
        console.log(this.task);
        this.inSemaphores.forEach(semaphore => console.log(this.task, " in ", semaphore.isActive()))
        this.outSemaphores.forEach(semaphore => console.log(this.task, " out ", semaphore.isActive()))
    }
}

export default Activity;