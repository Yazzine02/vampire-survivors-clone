class Bullet {
    constructor(x, y, target) {
        this.pos = createVector(x, y);
        this.vel = createVector(0, 0);
        this.acc = createVector(0, 0);

        this.target = target; // The enemy object this bullet is hunting

        // Magic Stats
        this.maxSpeed = 10;  // Very fast
        this.maxForce = 0.2; // Turning ability (Lower = wider arcs, Higher = snappier)
        this.r = 6;          // Radius
        this.damage = 10;
        this.toDelete = false;
    }

    update() {
        // 1. Steering Logic
        if (this.target) {
            this.seek(this.target.pos);
        }

        // 2. Physics Engine
        //Euler integration e.g approximation
        // Update velocity and limit it to maxSpeed
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        //Update position based on velocity
        this.pos.add(this.vel);
        // Reset acceleration for clean slate
        this.acc.mult(0); // Reset acceleration every frame
    }

    seek(targetPos) {
        // Desired velocity = Vector from me to target
        let desired = p5.Vector.sub(targetPos, this.pos);
        desired.setMag(this.maxSpeed);

        // Steering = Desired minus Velocity
        let steer = p5.Vector.sub(desired, this.vel);
        steer.limit(this.maxForce);

        this.acc.add(steer);
    }

    show() {
        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.vel.heading()); // This rotates the image to face the target!

        // Draw Magic Missile (Adjust size multiplier as needed)
        image(bulletImg, 0, 0, this.r * 4, this.r * 4);

        pop();
    }

    // Simple circle collision check
    hits(enemy) {
        let d = dist(this.pos.x, this.pos.y, enemy.pos.x, enemy.pos.y);
        return d < this.r + enemy.r; // Assuming enemy has radius 'r'
    }
}