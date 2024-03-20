class Semaphore {
    private active_state: boolean;
    public readonly name: string;
    public readonly id: string;

    constructor(isActive: boolean, name: string, id: string) {
        this.active_state = isActive;
        this.name = name;
        this.id = id;
    }

    public isActive() {
        return this.active_state;
    }

    public off() {
        this.active_state = false;
    }

    public on() {
        this.active_state = true;
    }
}

export default Semaphore;