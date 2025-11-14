class MagicMissileWeapon extends Weapon {
    constructor() {
        super(); // Call the base Weapon constructor
        
        // All stats moved from Player to here
        this.fireRate = 30;
        this.damage = 10;
        this.projectileCount = 1;
        this.range = 300;
        
        this.timer = this.fireRate; // Start ready to fire
    }

    update(player, enemies, bullets) {
        this.timer--;
        if (this.timer <= 0) {
            let targets = this.findNearestEnemies(player, enemies, this.projectileCount);
            
            if (targets.length > 0) {
                for (let t of targets) {
                    this.shoot(player, t, bullets);
                }
                this.timer = this.fireRate; // Reset cooldown
            }
        }
    }

    findNearestEnemies(player, enemies, count) {
        // This is the logic from your player.js, slightly modified
        let sortedEnemies = [...enemies].sort((a, b) => {
            let dA = p5.Vector.dist(player.pos, a.pos);
            let dB = p5.Vector.dist(player.pos, b.pos);
            return dA - dB;
        });
        
        let validTargets = sortedEnemies.filter(e => {
            let d = p5.Vector.dist(player.pos, e.pos);
            return d <= this.range;
        });
        
        return validTargets.slice(0, count);
    }

    shoot(player, target, bullets) {
        // This is the shoot logic from your player.js
        let b = new Bullet(player.pos.x, player.pos.y, target);
        b.damage = this.damage; // Set bullet's damage
        bullets.push(b);
    }

    levelUp() {
        super.levelUp(); // Increases this.level
        
        // This is your player's old level up logic
        this.damage += 5;
        if (this.level % 3 === 0) { // Your 5-level logic
            this.projectileCount++;
        }
    }

    // No draw() method needed, as the missiles draw themselves
}