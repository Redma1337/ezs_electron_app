class Mutex {
    constructor(mutexName) {
        this.mutexName = mutexName;
        this.activityMap = {};
        this.status = "free";
    }

    addActivityId(activityId, priority) {
        if (!this.activityMap.hasOwnProperty(activityId)) {
            this.activityMap[activityId] = priority;
        }
    }

    // Corrected to use object property access
    getPrioOfActivity(activityId) {
        if (this.activityMap.hasOwnProperty(activityId)) {
            return this.activityMap[activityId];
        }
        return null;
    }

    // Status
    block() {
        this.status = "blocked";
    }
    unblock() {
        this.status = "free";
    }
    getStatus() {
        return this.status;
    }

    // Remove - later 
    // remove activity ID from the mutex map 
    removeActivityId(activityId) {
        delete this.activityMap[activityId];
    }
}

export default Mutex;

// Priority logic
// activityToUpdate.mutexPriority = BestimmteLogikZurPriorität();
