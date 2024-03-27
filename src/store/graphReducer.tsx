import Activity from "../engine/activity";

//centralize the state management to this function to keep it all in place
//don't use es6 function syntax, otherwise function won't be hoisted
function graphReducer(state: any, action: any) {
    var sourceId, targetId;
    const { graph, version } = state;
    //TODO: add the missing action types and implement their logic
    switch (action.type) {
        case 'addActivity':
            let { task, priority } = action.payload;
            let workload = 1;
            const newActivity = new Activity(action.payload.id, task, priority, workload);
            graph.addActivity(newActivity);
            break;

        case 'removeActivity':
            const activityToRemove = action.payload.activityToRemove;
            graph.removeActivity(activityToRemove);
            graph.removeInvalidSemaphores();
            break;

        case 'changePriority': {
            const { activityId, priority } = action.payload;
            graph.changePriority(activityId, priority);
            break;
        }

        case 'changeTask': {
            const { activityId, task } = action.payload;
            graph.changeTask(activityId, task);
            break;
        }

        case 'addMutex':
            const { id, mutexName } = action.payload;
            graph.addMutex(id, mutexName);
            break;

        case 'addMutexToActivity': {
            const { activityId, mutexName } = action.payload;
            graph.connectToMutex(activityId, mutexName);
            break;
        }

        case 'disconnectMutexFromActivity': {
            const { activityId, mutexName } = action.payload;
            graph.disconnectFromMutex(activityId, mutexName);
            break;
        }

        case 'connectActivities': {
            sourceId = action.payload.sourceId;
            targetId = action.payload.targetId;
            graph.connectActivities(sourceId, targetId, false);
            break;
        }

        case 'disconnectActivities': {
            const { sourceActivityId, targetActivityId, semaphoreIdToRemove} = action.payload;
            graph.disconnectActivities(sourceActivityId, targetActivityId, semaphoreIdToRemove);
            break;
        }

        case 'toggleSemaphore': {
            const semaphoreId = action.payload.semaphoreId;
            graph.toggleSemaphore(semaphoreId);
            break;
        }

        case 'initGraph': {

            // const activity1 = new Activity(1, "Task 1", 1, 3);
            // const activity2 = new Activity(2, "Task 2", 4, 3);
            // const activity3 = new Activity(3, "Task 3", 2, 3);
            // const activity4 = new Activity(4, "Task 4", 8, 3);
            // const activity5a = new Activity(5, "Task 5a", 3, 3);
            // const activity5b = new Activity(6, "Task 5b", 5, 3);
            // const activity6 = new Activity(7, "Task 6", 6, 3);
            // const activity8 = new Activity(8, "Task 8", 9, 3);
            // const activity9 = new Activity(9, "Task 9", 10, 3);

            // graph.addActivity(activity1);
            // graph.addActivity(activity2);
            // graph.addActivity(activity3);
            // graph.addActivity(activity4);
            // graph.addActivity(activity5a);
            // graph.addActivity(activity5b);
            // graph.addActivity(activity6);
            // graph.addActivity(activity8);
            // graph.addActivity(activity9);

            // graph.connectActivities(activity1.id, activity2.id, false);
            // graph.connectActivities(activity1.id, activity3.id, false);
            // graph.connectActivities(activity2.id, activity4.id, false);
            // graph.connectActivities(activity3.id, activity6.id, false);
            // graph.connectActivities(activity4.id, activity6.id, false);
            // graph.connectActivities(activity6.id, activity5a.id, false);
            // graph.connectActivities(activity5a.id, activity5b.id, false);
            // graph.connectActivities(activity5b.id, activity5a.id, true);
            // graph.connectActivities(activity5b.id, activity1.id, true);
            // graph.connectActivities(activity1.id, activity8.id, false);
            // graph.connectActivities(activity8.id, activity4.id, false);
            // graph.connectActivities(activity1.id, activity9.id, false);
            // graph.connectActivities(activity9.id, activity6.id, false);

            // graph.addMutex(11, "m23");
            // graph.addMutex(12, "m34");

            // graph.connectToMutex(2, "m23");
            // graph.connectToMutex(3, "m23");

            // graph.connectToMutex(3, "m34");
            // graph.connectToMutex(4, "m34");
            // graph.connectToMutex(8, "m34");

            console.log('initGraph'); 
            break;
        }

        case 'print': {
            graph.print();
            graph.printSemaphores();
            graph.seeAssignedMutexes();
            break;
        }

        case 'walk': {
            graph.walk();
            break;
        }
    }

    return { graph: graph, version: version + 1 };
}

export default graphReducer;