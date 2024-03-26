import Semaphore from "./semaphore";
import Mutex from "./mutex";
import { MutexStatus } from "./mutex";
import semaphore from "./semaphore";

class Activity {
    public outSemaphores: Semaphore[];
    public inSemaphores: Semaphore[];
    public mutexes: Mutex[];
    public currentWorkload: number;
    public inheritedPriority: number;
    public blockedMutexes: Mutex[];

    constructor(
        public readonly id: number,
        public task: string,
        public priority: number,
        public workload: number
    ) {
        this.outSemaphores = [];
        this.inSemaphores = [];
        this.mutexes = [];
        this.blockedMutexes = [];
        this.priority = priority;
        this.inheritedPriority = undefined;
        this.currentWorkload = workload;
        this.workload = workload;
    }

    public work(): boolean {
        if (this.currentWorkload > 1) {
            this.currentWorkload--;
            return true;
        }
        this.resetWorkload();
        return false;
    }

    public resetWorkload() {
        this.currentWorkload = this.workload;
    }

    // Check if every mutex in this.mutexes is also in this.blockedMutexes
    public hasMutexBlocked(): boolean {
        if (this.mutexes.length === 0) {
            return false;
        }
        return this.mutexes.every(mutex =>
            this.blockedMutexes.some(blockedMutex =>
                blockedMutex.mutexName === mutex.mutexName
            )
        );
    }

    public requestLocks(): boolean {
        for (const mutex of this.mutexes) {
            if (mutex.status === MutexStatus.Blocked) {
                return false;
            }
            mutex.lock();
            this.blockedMutexes.push(mutex);
            // console.log("Mutex: ", mutex.mutexName, " Status: ", mutex.status);
        }
        return true;
    }

    public releaseLocks() {
        this.blockedMutexes.forEach(mutex => mutex.unblock());
        this.blockedMutexes = [];
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

    public assignMutex(mutex: Mutex) {
        // only add if not exists
        const exists = this.mutexes.some(m => m.mutexName === mutex.mutexName);
        if (!exists) {
            this.mutexes.push(mutex);
        }
        // sort mutexes by prio
        this.sortMutexes();
        // set inherited prio
        //this.setInheritedPriority();
    }

    public getPriority(): number {
        return this.priority
    }

    // Sort Mutexes by Prio for inherited Prio for PCP
    private sortMutexes() {
        this.mutexes = [...this.mutexes].sort((a, b) => b.getPriority() - a.getPriority());
    }

    public setInheritedPriority(): number {
        if (this.mutexes.length === 0) {
            this.inheritedPriority = undefined;
            return;
        }
        return this.getFirstPriority();
    }

    private getFirstPriority(): number {
        return this.mutexes[0].getPriority();
    }

    public getInheritedPriority(): number {
        return this.inheritedPriority;
    }

    public getWorkload(): number {
        return this.workload;
    }

    public getCurrentWorkload(): number {
        return this.currentWorkload;
    }

    public removeMutex(mutex: Mutex) {
        this.mutexes = this.mutexes.filter(m => m.mutexName !== mutex.mutexName);
        this.sortMutexes();
        this.setInheritedPriority();
    }

    public print() {
        console.log(this.id);
        this.inSemaphores.forEach(semaphore => console.log(this.id, " in ", semaphore.isActive()))
        this.outSemaphores.forEach(semaphore => console.log(this.id, " out ", semaphore.isActive()))
    }
}

export default Activity;