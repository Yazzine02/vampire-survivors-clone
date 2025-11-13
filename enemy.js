class Enemy {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.vel = createVector(0, 0);
        this.acc = createVector(0, 0);

        this.maxSpeed = 0.5;  // Slower than player (usually)
        this.maxForce = 0.1; // How fast they can change direction
        this.r = 15;        // Radius/Size
        this.hp = 30;       // Health Points
        this.isDead = false;
    }

    update(player, enemies) {
        // --- AI DECISION MAKING ---
        let seekForce = this.seek(player.pos);
        let separateForce = this.separate(enemies);

        // Weight the forces:
        // We want them to chase the player, but PRIORITY is personal space.
        seekForce.mult(1.0);
        separateForce.mult(2.0); // Stronger force to prevent overlapping

        this.applyForce(seekForce);
        this.applyForce(separateForce);

        // --- PHYSICS ENGINE (Same as Bullet) ---
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.mult(0);
    }

    applyForce(force) {
        this.acc.add(force);
    }

    // 1. SEEK: The drive to kill the player
    seek(target) {
        let desired = p5.Vector.sub(target, this.pos);
        desired.setMag(this.maxSpeed);
        let steer = p5.Vector.sub(desired, this.vel);
        steer.limit(this.maxForce);
        return steer;
    }

    // 2. SEPARATE: The drive to not crowd neighbors
    separate(enemies) {
        let desiredSeparation = this.r * 4; // Maintain a buffer zone
        let sum = createVector(0, 0);
        let count = 0;

        // Loop through every OTHER enemy
        // (Performance Warning: This is N^2. For < 100 enemies it's fine)
        for (let other of enemies) {
            let d = p5.Vector.dist(this.pos, other.pos);

            // If they are too close (and not me)
            if ((d > 0) && (d < desiredSeparation)) {
                let diff = p5.Vector.sub(this.pos, other.pos);
                diff.normalize();
                diff.div(d); // Weigh by distance: closer = stronger push
                sum.add(diff);
                count++;
            }
        }

        if (count > 0) {
            sum.div(count); // Average direction
            sum.setMag(this.maxSpeed);
            let steer = p5.Vector.sub(sum, this.vel);
            steer.limit(this.maxForce); // Don't separate TOO abruptly
            return steer;
        }
        return createVector(0, 0);
    }

    show() {
        push();
        translate(this.pos.x, this.pos.y);
        // Optional: Flip sprite if moving left
        if (this.vel.x < 0) scale(-1, 1);
        // Draw Undead Sprite
        image(enemyImg, 0, 0, this.r * 3, this.r * 3);

        pop();
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.isDead = true;
        }
    }
}