class Player{
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.vel = createVector(0, 0);
        this.knockbackVel = createVector(0, 0);
        this.speed = 2.5;
        this.size = 20;

        //RPG Stats
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 100;
        this.currency = 0;

        //timer popup for level up
        this.levelUpTimer = 0;

        // Combat Stats
        this.hp = 100;
        this.maxHp = 100;
        this.invincibilityFramesTimer = 0;

        // Weapons
        this.weapons = [];
    }

    update() {
        this.handleMovement();
        // Decrease invincibility frames
        if (this.invincibilityFramesTimer > 0) {
            this.invincibilityFramesTimer--;
        }
        if(this.levelUpTimer > 0){
            this.levelUpTimer--;
        }
        // Apply knockback velocity (decays over time)
        this.knockbackVel.mult(0.9); // Friction
    }

    updateWeapons(enemies, bullets) {
        for (let weapon of this.weapons) {
            weapon.update(this, enemies, bullets);
        }
    }

    drawWeapons() {
        for (let weapon of this.weapons) {
            weapon.show(this);
        }
    }

    show() {
        push();
        // Flash blue if invincible
        if (this.invincibilityFramesTimer > 0) {
            tint("red");
        } else {
            noTint();
        }
        translate(this.pos.x, this.pos.y);
        if (this.vel.x < 0) scale(-1, 1);
        // Draw image at 0,0 because we already translated there
        image(playerImg, 0, 0, this.size * 3, this.size * 3);
        pop();
    }

    gainXP(amount) {
        this.xp += amount;
        // Level Up Check
        while (this.xp >= this.xpToNextLevel) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.xp -= this.xpToNextLevel;
        this.xpToNextLevel += 20; // Increase XP needed for next level

        // --- REWARDS ---
        this.maxHp += 5;        // Health Bar gets bigger
        this.hp = this.maxHp;    // Full Heal
        this.damage += 5;        // More Damage

        // Show Level Up Popup
        this.levelUpTimer = 180; // Show for 3 seconds at 60 FPS

        // tell weapons to level up
        for (let weapon of this.weapons) {
            weapon.levelUp();
        }
    }

    takeDamage(enemy) {
        // take damage only if not invincible
        if( this.invincibilityFramesTimer <= 0 ) {
            this.hp -= enemy.damage;
            this.invincibilityFramesTimer = 60;
            // Apply knockback velocity
            let knockbackDir = p5.Vector.sub(this.pos, enemy.pos);
            knockbackDir.normalize();
            this.knockbackVel.set(knockbackDir.mult(10));
        }
    }

    handleMovement() {
        // Reset velocity
        this.vel.set(0, 0);
        // WASD or Arrow Inputs
        if (keyIsDown(81) || keyIsDown(LEFT_ARROW))  this.vel.x = -1;
        if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) this.vel.x = 1;
        if (keyIsDown(90) || keyIsDown(UP_ARROW))    this.vel.y = -1;
        if (keyIsDown(83) || keyIsDown(DOWN_ARROW))  this.vel.y = 1;
        // Normalize so diagonal movement isn't faster
        this.vel.setMag(this.speed);
        this.pos.add(this.vel);
        //add knockback velocity
        this.pos.add(this.knockbackVel);
        //Check for obstacle collisions
        this.checkObstacleCollisions(terrain);
    }

    checkObstacleCollisions(terrain){
        for (let obs of terrain) {
            let d = dist(this.pos.x, this.pos.y, obs.pos.x, obs.pos.y);
            let playerRadius = this.size / 2;

            // Check if we are overlapping
            if (d < playerRadius + obs.r) {
                // --- Collision! ---
                // 1. Get the vector pointing FROM the obstacle TO the player
                let pushback = p5.Vector.sub(this.pos, obs.pos);
                // 2. Set its magnitude to be the "correct" distance
                let correctDistance = playerRadius + obs.r;
                pushback.setMag(correctDistance);
                // 3. Set the player's new position
                // (Obstacle's center + the pushback vector)
                this.pos = p5.Vector.add(obs.pos, pushback);
            }
        }
    }

    handleShooting() {
        // 1. Decrement the timer
        if (this.fireTimer > 0) {
            this.fireTimer--;
            return; // Weapon is on cooldown
        }

        // 2. Find the nearest enemy
        let targets = this.findNearestEnemy(this.projectileCount);
        // 3. If an enemy is found within range, shoot
        if(targets.length > 0){
            for(let t of targets){
                this.shoot(t);
            }
            this.fireTimer = this.fireRate;
        }
    }

    findNearestEnemy(count) {
        //Sort ennemies by distance
        let sortedEnemies = [...enemies].sort((a, b) => {
            let dA = p5.Vector.dist(this.pos, a.pos);
            let dB = p5.Vector.dist(this.pos, b.pos);
            return dA - dB;
        });
        //Filter enemies within range
        let validTargets = sortedEnemies.filter(e => {
            let d = p5.Vector.dist(this.pos, e.pos);
            return d <= this.range;
        });
        //Return up to 'count' nearest enemies
        return validTargets.slice(0, count);
    }

    shoot(target) {
        // Create a bullet vector pointing at the enemy
        // Since you have AI behaviors, you can make the bullet 'Seek' later.
        // For now, we just spawn a Bullet object.
        let b = new Bullet(this.pos.x, this.pos.y, target, this.damage);
        bullets.push(b);
    }
}