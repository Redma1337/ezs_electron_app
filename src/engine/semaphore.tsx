class Semaphore {
    private active_state: boolean;

    constructor(isActive: boolean) {
        this.active_state = isActive;
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