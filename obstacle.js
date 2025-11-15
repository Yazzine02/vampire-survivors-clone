class Obstacle {
    constructor(x, y, r) {
        this.pos = createVector(x, y);
        this.r = r; // Radius of the hitbox
    }


    // Optional: A debug function to see the hitboxes
    show() {
        /*
        push();
        noFill();
        strokeWeight(2);
        stroke(255, 0, 0, 150); // Red, semi-transparent
        circle(this.pos.x, this.pos.y, this.r * 2);
        pop();
        */
    }
}