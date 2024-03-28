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
            const newActivity = new Activity(action.payload.id, task, priority, 1);
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

        case 'changeSimultaneousTasks': {
            const simultaneousTasks = action.payload.simultaneousTasks;
            graph.changeSimultaneousTasks(simultaneousTasks);
            break;
        }

        case 'changeWorkload': {
            const { activityId, workload } = action.payload;
            graph.changeWorkload(activityId, workload);
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