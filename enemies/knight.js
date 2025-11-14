class Knight extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.img = knightImg; // Use knight-specific image
        this.damage = 15;
        this.maxSpeed = 0.6; // Slightly slower than monks
        this.hp = 20;
    }
}