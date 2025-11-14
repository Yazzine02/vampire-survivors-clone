class Weapon {
    constructor() {
        this.level = 1;
        this.timer = 0; // General purpose timer for cooldowns
    }

    update() {
        // To be implemented in subclasses
    }

    show() {
        // To be implemented in subclasses
    }

    levelUp() {
        this.level++;
        // To be implemented in subclasses
    }
}