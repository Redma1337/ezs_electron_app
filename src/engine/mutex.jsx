class Mutex {
    constructor(mutexName, activityList = []) {
        this.mutexName = mutexName;
        this.activityList = activityList;
        //this.priority = priority;
    }

    // Method to add an activity ID to the mutex list
    addActivityId(activityId) {
        if (!this.activityList.includes(activityId)) {
            this.activityList.push(activityId);
        }
    }

    // Get Priority of Mutex

}

export default Mutex;

// Priority logic
// activityToUpdate.mutexPriority = BestimmteLogikZurPriorität();
