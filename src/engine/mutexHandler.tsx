import Mutex from "./mutex";
import Activity from "./activity";

//weiß welche Aktivität welche Prio geerbt hat und welcher Mutex die höchste Prio hat
class MutexHandler {

    // muss der MutexHandler haben
    public inheritMap: Map<Activity, number>; //<activity, inheritedPriority>
    public mutexMap: Map<Mutex, number>; // <mutex, priority>

    constructor() {
        this.inheritMap = new Map<Activity, number>();
        this.mutexMap = new Map<Mutex, number>();
    }

    addToMutexMap(mutex: Mutex) {
        let priority = mutex.getFirstPriority();
        this.mutexMap.set(mutex, priority);
    }

    addToInheritMap(activity: Activity, inheritedPriority: number) {
        this.inheritMap.set(activity, inheritedPriority);
    }

    sortInheritedMap() {
        // Convert the Map to an array of [key, value] pairs
        let sortedArray = Array.from(this.inheritMap.entries()).sort((a, b) => b[1] - a[1]);
        this.inheritMap = new Map(sortedArray);
    }

    sortMutexMap() {
        // Convert the Map to an array of [key, value] pairs
        let sortedArray = Array.from(this.mutexMap.entries()).sort((a, b) => b[1] - a[1]);
        this.mutexMap = new Map(sortedArray);
    }

    //ja das sind generics -> can return the correct type based on the map's key type 
    getFirst<ActivityOrMutex>(map: Map<ActivityOrMutex, number>): ActivityOrMutex | undefined {
        return map.keys().next().value;
    }

    checkPriorities(validMutexMap: Map<Mutex, number>, validInheritMap: Map<Activity, number>): string {
        // Hole die erste (höchste) Priorität
        const highestPriority = [...validMutexMap.values()][0];

        // Zähle, wie viele valid Nodes diese höchste Priorität haben
        const countOfHighestPriority = [...validInheritMap.values()].filter(priority => priority === highestPriority).length;

        if (countOfHighestPriority > 1) {
            return "multiplePrios";
        } else {
            return "oneprio";
        }
    }

    // fill inheritedMap 
    fillSortInheritedMap(activities: Activity[], mutexe: Mutex[]) {
        activities.forEach(activity => {
            mutexe.forEach(mutex => {
                if (mutex.containsActivity(activity.id)) {
                    this.addToInheritMap(activity, mutex.getFirstPriority());
                }
            });
        });
        //sort nodes based on mutex priority
        this.sortInheritedMap();
    }

    // fill and sort MutexMap
    fillSortMutexMap(activities: Activity[], mutexe: Mutex[]) {
        activities.forEach(activity => {
            mutexe.forEach(mutex => {
                if (mutex.containsActivity(activity.id)) {
                    this.addToMutexMap(mutex);
                }
            });
        });
        //sort mutexMap based on mutex priority
        this.sortMutexMap();
    }


    handleMutex(validNodes: Activity[], mutexe: Mutex[]): Activity[] {

        // get valid nodes without mutex
        let validNodesWithoutMutex = validNodes.filter(activity => activity.isValid() && !mutexe.some(mutex => mutex.containsActivity(activity.id)));
        console.log("Valid Nodes without Mutex: ", validNodesWithoutMutex);

        // get valid nodes with mutex
        let validNodesWithMutex = validNodes.filter(activity => activity.isValid() && mutexe.some(mutex => mutex.containsActivity(activity.id)));

        console.log("Valid Nodes with Mutex: ", validNodesWithMutex);
        if (validNodesWithMutex.length < 1) {
            return validNodesWithoutMutex;
        }

        // valid nodes with inherit priority
        let validInheritMap = new Map([...this.inheritMap].filter(([activity]) => activity.isValid()));
        console.log("Valid Inherit Map: ", validInheritMap);

        // valid mutexes
        let validActivityIds = validNodesWithMutex.map(activity => activity.id);

        let validMutexMap = new Map([...this.mutexMap].filter(([mutex]) => validActivityIds.some(id => mutex.containsActivity(id))));
        console.log("Valid Mutex Map: ", validMutexMap);

        //one mutex
        //check if all valid nodes have the same mutex
        if (validMutexMap.size === 1) {
            return [...validNodesWithMutex, ...validNodesWithoutMutex]; //+ validNodes without mutex
        }

        //multiple mutexes
        // mutex with highest priority
        let highestmutex: Mutex = this.getFirst(this.mutexMap);
        console.log("Highest Mutex: ", highestmutex);

        // mehrere Mutex prio's vergleichen -> mutexHandler
        switch (this.checkPriorities(validMutexMap, validInheritMap)) {
            case "multiplePrios":
                //case1: 8 8 8 
                //case2: 8 8 4 
                // return validNodes with own highest prio + validNodes without mutex
                return validNodesWithMutex = [...highestmutex.oneMutexPriority(validNodesWithMutex, highestmutex), ...validNodesWithoutMutex];
            case "oneprio":
                //case3: 8 4 2

                // return validNode connected to mutex with highest priority + validNodes without mutex
                return validNodesWithMutex = [...validNodesWithMutex.filter(activity => highestmutex.containsActivity(activity.id)), ...validNodesWithoutMutex];
        }
    }


}

export default MutexHandler;
