class Enemy {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.vel = createVector(0, 0);
        this.acc = createVector(0, 0);

        this.damage = 15;

        this.maxSpeed = 0.5;  // Slower than player (usually)
        this.maxForce = 0.1; // How fast they can change direction
        this.r = 15;        // Radius/Size
        this.hp = 30;       // Health Points
        this.isDead = false;

        this.img = enemyImg; // Default enemy image
    }

    update(player, enemies, terrain) {
        // --- AI DECISION MAKING ---
        let seekForce = this.seek(player.pos);
        let separateForce = this.separate(enemies);
        let avoidForce = this.avoid(terrain, player.pos);

        // Weight the forces:
        // We want them to chase the player, but PRIORITY is personal space.
        seekForce.mult(1.0);
        separateForce.mult(2.0); // Stronger force to prevent overlapping
        avoidForce.mult(3.0);    // Strongly avoid obstacles

        this.applyForce(seekForce);
        this.applyForce(separateForce);
        this.applyForce(avoidForce)

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
        let desiredSeparation = this.r * 2; // Maintain a buffer zone
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
    /*
    // This is just like the avoid function we have seen in class, that i believe is not good enough
    // basically because the enemy can get stuck on corners
    // 3. AVOID: The drive to not hit obstacles (terrain)
    avoid(obstacles) {
        // This perception radius should be larger than separation
        // It's how far ahead the enemy "looks" for obstacles
        let perceptionRadius = this.r * 3;
        let sum = createVector(0, 0);
        let count = 0;
        for (let obs of obstacles) {
            let d = p5.Vector.dist(this.pos, obs.pos);

            // If the obstacle is within our perception radius
            if ((d > 0) && (d < perceptionRadius + obs.r)) {
                // Calculate a repulsion force, stronger the closer we are
                let diff = p5.Vector.sub(this.pos, obs.pos);
                diff.normalize();
                diff.div(d); // Weigh by distance to get stronger avoidance when closer
                sum.add(diff);
                count++;
            }
        }
        if (count > 0) {
            sum.div(count); // Average direction
            sum.setMag(this.maxSpeed);
            let steer = p5.Vector.sub(sum, this.vel);
            steer.limit(this.maxForce * 2.0); // Allow for strong turns
            return steer;
        }
        return createVector(0, 0);
    }
     */
    // An improved AVOID function that uses tangent method to prevent getting stuck on corners
    // attempts to steer "around" obstacles by choosing a tangent force aligned with the target
    avoid(obstacles, target) {
        // How far ahead the enemy "looks" for obstacles
        let perceptionRadius = this.r * 5; // Increased perception
        let sum = createVector(0, 0);
        let count = 0;

        // The "goal" direction, for reference
        let seekDirection = p5.Vector.sub(target, this.pos);
        seekDirection.normalize();

        for (let obs of obstacles) {
            let d = p5.Vector.dist(this.pos, obs.pos);

            // If the obstacle is within our perception radius
            if ((d > 0) && (d < perceptionRadius + obs.r)) {

                // 1. Base Repulsion Force (points directly away from obstacle)
                let repel = p5.Vector.sub(this.pos, obs.pos);
                repel.normalize();

                // 2. Calculate the two perpendicular "sliding" forces
                let tangent1 = createVector(-repel.y, repel.x);
                let tangent2 = createVector(repel.y, -repel.x);

                // 3. Find which tangent is "better" (more aligned with seek direction)
                // We use the dot product for this.
                let tangentToUse;
                if (tangent1.dot(seekDirection) > tangent2.dot(seekDirection)) {
                    tangentToUse = tangent1;
                } else {
                    tangentToUse = tangent2;
                }

                // 4. Combine Repulsion + Tangent
                // The tangent force "slides" us, the repel force "pushes" us.
                tangentToUse.setMag(1.0); // Weight for tangent
                repel.setMag(0.5);        // Weight for repulsion
                let combinedForce = p5.Vector.add(tangentToUse, repel);

                // 5. Weight by distance (stronger avoidance when closer)
                let weight = (perceptionRadius - d) / perceptionRadius;
                combinedForce.mult(weight * this.maxSpeed);

                sum.add(combinedForce);
                count++;
            }
        }

        if (count > 0) {
            sum.div(count); // Average all avoidance forces
            sum.setMag(this.maxSpeed); // Desired *velocity*
            let steer = p5.Vector.sub(sum, this.vel);
            steer.limit(this.maxForce * 2.5); // *Very* strong steering
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
        image(this.img, 0, 0, this.r * 3, this.r * 3);

        pop();
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.isDead = true;
        }
    }
}