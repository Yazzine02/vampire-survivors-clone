class Monk extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.img = monkImg; // Use monk-specific image
        this.damage = 10;
        this.maxSpeed = 0.7; // Faster than regular enemies
        this.hp = 20;
    }
}