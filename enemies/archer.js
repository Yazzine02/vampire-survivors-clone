class Archer extends Enemy {
    constructor(x, y) {
        super(x, y);
        
        // Archer-specific stats
        this.img = archerImg;
        this.hp = 25;
        this.damage = 3; // Low contact damage
        this.maxSpeed = 1.5; // Slower
        
        // AI Stats
        this.shootingRange = 250;
        this.keepAwayRange = 200; // Stop and shoot, but flee if player gets closer
        this.fireRate = 180; // Shoots every 1.5 seconds
        this.fireTimer = this.fireRate;
    }

    // OVERRIDE the update method for special AI
    update(player, enemies, terrain) {
        this.fireTimer--;
        
        // --- AI Decision Making ---
        let d = dist(this.pos.x, this.pos.y, player.pos.x, player.pos.y);

        // --- 1. SEPARATION (Always do this) ---
        let separateForce = this.separate(enemies);
        separateForce.mult(2.0);
        this.applyForce(separateForce);

        // --- 2. AVOIDANCE (Always do this) ---
        // Use the INHERITED avoid function
        let avoidForce = this.avoid(terrain, player.pos);
        avoidForce.mult(3.0); // Give it high priority
        this.applyForce(avoidForce);

        // --- 3. ACTION (Seek, Flee, or Shoot) ---
        if (d > this.shootingRange) {
            // 1. TOO FAR: Seek the player
            let seekForce = this.seek(player.pos);
            this.applyForce(seekForce);
            
        } else if (d < this.keepAwayRange) {
            // 2. TOO CLOSE: Flee from the player
            let fleeForce = this.flee(player.pos);
            this.applyForce(fleeForce);
            
        } else {
            // 3. JUST RIGHT: Stop and shoot
            this.vel.mult(0.9); // Slow to a stop
            
            if (this.fireTimer <= 0) {
                this.shoot(player);
                this.fireTimer = this.fireRate;
            }
        }

        // --- Standard Physics (from base Enemy) ---
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.mult(0);
    }

    // Flee is the opposite of Seek
    flee(target) {
        let desired = p5.Vector.sub(this.pos, target); // Note: this.pos - target
        desired.setMag(this.maxSpeed);
        let steer = p5.Vector.sub(desired, this.vel);
        steer.limit(this.maxForce);
        return steer;
    }

    shoot(player) {
        // Create a new arrow.
        // It's added to the global 'bullets' array, which is a bit messy.
        // A better system would pass 'bullets' into the update loop.
        // For now, let's just add it to 'bullets' (the global array)
        arrows.push(new Arrow(this.pos.x, this.pos.y, player.pos));
    }
}