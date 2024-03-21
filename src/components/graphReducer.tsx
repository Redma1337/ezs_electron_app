import Graph from "../engine/graph";
import Activity from "../engine/activity";
import Semaphore from "../engine/semaphore";
import { act } from "react-dom/test-utils";


//centralize the state management to this function to keep it all in place
//don't use es6 function syntax, otherwise function won't be hoisted
function graphReducer(graph: Graph, action: any) {
    var sourceId, targetId;
    //TODO: add the missing action types and implement their logic
    switch (action.type) {
        case 'addActivity':
            const newActivity = new Activity(action.payload.id, action.payload.task, action.payload.priority);
            graph.addActivity(newActivity);
            return graph;

        case 'addMutexToActivity': {
            const { activityId, mutexName } = action.payload;
            graph.addMutex(mutexName);
            graph.connectToMutex(activityId, mutexName);
            return graph;
        }

        case 'initializeGraph':
            const activity1 = new Activity(1, "Task 1", 1);
            const activity2 = new Activity(2, "Task 2", 4);
            const activity3 = new Activity(3, "Task 3", 2);
            const activity4 = new Activity(4, "Task 4", 8);
            const activity5a = new Activity(5, "Task 5a", 3);
            const activity5b = new Activity(6, "Task 5b", 5);
            const activity6 = new Activity(7, "Task 6",6);

            graph.addActivity(activity1);
            graph.addActivity(activity2);
            graph.addActivity(activity3);
            graph.addActivity(activity4);
            graph.addActivity(activity5a);
            graph.addActivity(activity5b);
            graph.addActivity(activity6);

            graph.connectActivities(activity1.id, activity2.id, false);
            graph.connectActivities(activity1.id, activity3.id, false);
            graph.connectActivities(activity2.id, activity4.id, false);
            graph.connectActivities(activity3.id, activity6.id, false);
            graph.connectActivities(activity4.id, activity6.id, false);
            graph.connectActivities(activity6.id, activity5a.id, false);
            graph.connectActivities(activity5a.id, activity5b.id, false);
            graph.connectActivities(activity5b.id, activity5a.id, true);
            graph.connectActivities(activity5b.id, activity1.id, true);

            graph.addMutex("m23");
            graph.addMutex("m34");

            graph.connectToMutex(2, "m23");
            graph.connectToMutex(3, "m23");

            graph.connectToMutex(3, "m34");
            graph.connectToMutex(4, "m34");

            return graph;

        case 'connectActivities':
            sourceId = action.payload.sourceId;
            targetId = action.payload.targetId;
            graph.connectActivities(sourceId, targetId, false);
            return graph;

        case 'disconnectActivities':
            sourceId = action.payload.sourceId;
            targetId = action.payload.targetId;
            const semaphoreToRemove: Semaphore = action.payload.semaphoreToRemove;
            graph.disconnectActivities(sourceId, targetId, semaphoreToRemove);
            return graph;

        default:
            return graph;
    }
}

export default graphReducer;