class Spawner {
    constructor() {
        this.spawnTimer = 0;
        this.spawnInterval = 60; // Spawn every 60 frames (1 second)
    }

    // Call this from draw()
    update(player) {
        this.spawnTimer--;
        if (this.spawnTimer <= 0) {
            this.spawn(player);
            this.spawnTimer = this.spawnInterval;
        }
    }

    // This is where all your enemy logic goes
    spawn(player) {
        // Calculate spawn position (same as your old function)
        let angle = random(TWO_PI);
        let distance = (width + height) / 2 + 100;
        let x = player.pos.x + cos(angle) * distance;
        let y = player.pos.y + sin(angle) * distance;

        // --- Spawn Table ---
        // As your game grows, you can make this more complex.
        
        let roll = random(); // Get a random number between 0 and 1

        if (roll < 0.1) { // 10% chance for a Worm
            enemies.push(new WormEnemy(x, y));
        }else if (0.1<= roll < 0.25) {// 15% chance for a knight
            enemies.push(new Knight(x, y));
        }else if (0.25<= roll < 0.40){
            enemies.push(new Lancer(x, y));
        }else if (0.40<= roll < 0.55){
            enemies.push(new Monk(x, y));
        }else if (0.55<= roll < 0.70){
            enemies.push(new Archer(x, y));
        }
        else { // 90% chance for a regular Zombie
            enemies.push(new Enemy(x, y));
        }
    }
}