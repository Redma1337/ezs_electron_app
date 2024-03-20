class Semaphore {
    private active_state: boolean;
    public readonly name: string;

    constructor(isActive: boolean, name: string) {
        this.active_state = isActive;
        this.name = name;
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