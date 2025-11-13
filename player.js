class Player{
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.vel = createVector(0, 0);
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
        this.damage = 10;
        this.projectileCount = 1;

        // Weapon Stats
        this.fireRate = 30; // Frames between shots (lower = faster)
        this.fireTimer = 0;
        this.range = 300;   // How far the player can "see" enemies
    }

    update() {
        this.handleMovement();
        this.handleShooting();
        // Decrease invincibility frames
        if (this.invincibilityFramesTimer > 0) {
            this.invincibilityFramesTimer--;
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
        this.xp -= this.nextLevelXp;
        this.nextLevelXp = Math.floor(this.nextLevelXp * 1.5); // Harder to reach next level

        // --- REWARDS ---
        this.maxHp += 5;        // Health Bar gets bigger
        this.hp = this.maxHp;    // Full Heal
        this.damage += 5;        // More Damage

        // Show Level Up Popup
        this.levelUpTimer = 180; // Show for 3 seconds at 60 FPS
    }

    takeDamage(amount) {
        // take damage only if not invincible
        if( this.invincibilityFramesTimer <= 0 ) {
            this.hp -= amount;
            this.invincibilityFramesTimer = 60;
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
    }

    handleShooting() {
        // 1. Decrement the timer
        if (this.fireTimer > 0) {
            this.fireTimer--;
            return; // Weapon is on cooldown
        }

        // 2. Find the nearest enemy
        let target = this.findNearestEnemy();

        // 3. If target exists and is close enough, Shoot!
        if (target) {
            this.shoot(target);
            this.fireTimer = this.fireRate; // Reset Cooldown
        }
    }

    findNearestEnemy() {
        let closestEnemy = null;
        let closestDist = Infinity;

        // 'enemies' is your global array of enemy objects
        for (let enemy of enemies) {
            let d = dist(this.pos.x, this.pos.y, enemy.pos.x, enemy.pos.y);

            // Check if it's the closest AND within range
            if (d < closestDist && d < this.range) {
                closestDist = d;
                closestEnemy = enemy;
            }
        }
        return closestEnemy;
    }

    shoot(target) {
        // Create a bullet vector pointing at the enemy
        // Since you have AI behaviors, you can make the bullet 'Seek' later.
        // For now, we just spawn a Bullet object.

        bullets.push(new Bullet(this.pos.x, this.pos.y, target));
    }
}