import Semaphore from "./semaphore";
import Mutex from "./mutex";
import { MutexStatus } from "./mutex";

class Activity {
    public outSemaphores: Semaphore[];
    public inSemaphores: Semaphore[];
    public mutexes: Mutex[];
    constructor(
        public readonly id: number,
        public task: string,
        public priority: number
    ) {
        this.outSemaphores = [];
        this.inSemaphores = [];
        this.mutexes = [];
        this.priority = priority;
    }

    public requestLocks(): boolean {
        for (const mutex of this.mutexes) {
            if (mutex.status === MutexStatus.Blocked) {
                return false;
            }
            mutex.lock();
        }
        return true;
    }

    public addOutSemaphore(semaphore: Semaphore) {
        if (!semaphore) {
            console.error("semaphore is null");
            return;
        }

        this.outSemaphores.push(semaphore);
    }

    public removeOutSemaphore(semaphoreIdToRemove: string) {
        if (!semaphoreIdToRemove) {
            console.error("semaphore is null");
            return;
        }

        const index = this.outSemaphores.findIndex(semaphore => semaphore.id === semaphoreIdToRemove);
        if (index > -1) {
            this.outSemaphores.splice(index, 1);
        }
    }

    public addInSemaphore(semaphore: Semaphore) {
        if (!semaphore) {
            console.error("semaphore is null");
            return;
        }

        this.inSemaphores.push(semaphore);
    }

    public removeInSemaphore(semaphoreIdToRemove: string) {
        if (!semaphoreIdToRemove) {
            console.error("semaphore is null");
            return;
        }

        const index = this.inSemaphores.findIndex(semaphore => semaphore.id === semaphoreIdToRemove);
        if (index > -1) {
            this.inSemaphores.splice(index, 1);
        }
    }

    public trigger() {
        this.inSemaphores.forEach(semaphore => semaphore.off());
        this.outSemaphores.forEach(semaphore => semaphore.on());
    }

    public isValid() {
        if (this.inSemaphores.length === 0) {
            return false; // Or any value you consider appropriate for an empty array
        }
        return this.inSemaphores.every(semaphore => semaphore.isActive());
    }

    assignMutex(mutex: Mutex) {
        // only add if not exists
        const exists = this.mutexes.some(m => m.mutexName === mutex.mutexName);
        if (!exists) {
            this.mutexes.push(mutex);
        }
    }

    public getPriority(): number {
        return this.priority
    }
   
    public removeMutex(mutex: Mutex) {
        this.mutexes = this.mutexes.filter(m => m.mutexName !== mutex.mutexName);
    }

    public print() {
        console.log(this.id);
        this.inSemaphores.forEach(semaphore => console.log(this.id, " in ", semaphore.isActive()))
        this.outSemaphores.forEach(semaphore => console.log(this.id, " out ", semaphore.isActive()))
    }
}

export default Activity;