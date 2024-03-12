class Activity {
    constructor(id, task) {
        this.id = id;
        this.task = task;
        this.outSemaphores = [];
        this.inSemaphores = [];
        this.mutexe = [];
    }

    // Method to add a semaphore to the activity (Marc)


    // Method to assign a mutex to this activity
    assignMutex(mutex) {
        // only add if not exists
        const exists = this.mutexe.some(m => m.mutexName === mutex.mutexName);
        if (!exists) {
            this.mutexe.push(mutex);
        }
    }




    //TODO later
    // remove a mutex from an activity      
    removeMutexe() {
        this.mutexe = [];
    }
}

export default Activity;