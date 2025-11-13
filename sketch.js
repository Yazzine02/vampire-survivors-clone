let player;
let enemies = []; // The player class looks at this
let bullets = []; // The player class pushes to this
let drops = [];   // Future use for XP/Gems

function preload() {
    // Asset loading
    playerImg = loadImage('assets/Sorcerer.png');
    enemyImg = loadImage('assets/Zombie.png');
    bulletImg = loadImage('assets/MagicMissile.png');
    bgImg = loadImage('assets/Sand.jpg');
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    imageMode(CENTER);
    player = new Player(width / 2, height / 2);
}

function spawnEnemy(){
    // Pick a random angle
    let angle = random(TWO_PI);

    // Pick a distance OUTSIDE the screen
    // We use width + height to ensure it's always off-screen regardless of angle
    let distance = (width + height) / 2 + 100;

    // Calculate spawn position relative to PLAYER
    let x = player.pos.x + cos(angle) * distance;
    let y = player.pos.y + sin(angle) * distance;

    enemies.push(new Enemy(x, y));
}

function draw() {
    background(0);

    // --- CAMERA & BACKGROUND ---
    push();
    // Move the world relative to player
    translate(width / 2 - player.pos.x, height / 2 - player.pos.y);

    drawInfiniteBackground();

    // --- GAME UPDATE LOOP ---
    // 1. Player
    player.update();
    player.show();
    // 2. Spawner
    // Simple Spawner: Add 1 enemy every 60 frames (1 second)
    if (frameCount % 60 === 0)spawnEnemy();
    // 3. Enemies
    // Update Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        // PASS THE ENTIRE ARRAY for separation logic
        e.update(player, enemies);
        e.show();

        // Check player collision for damage
        let d = dist(e.pos.x, e.pos.y, player.pos.x, player.pos.y);
        if (d < e.r + player.size / 2) {
            player.takeDamage(5); // Enemy deals 5 damage on contact
        }
        if (e.isDead) {
            // Drop logic first
            // 80% chance to drop XP, 20% chance to drop Gem
            let dropType = random() < 0.8 ? "XP" : "GEM";
            drops.push(new Drop(e.pos.x, e.pos.y, dropType));
            // Remove enemy from array
            enemies.splice(i, 1);
        }
    }
    // 4. Bullets
    // Update Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        b.update();
        b.show();
        // Check collision with its specific target
        // Note: You might want to check ALL enemies if you want piercing shots later
        if (b.target && b.hits(b.target)) {
            // Enemy takes damage (we will add this next)
            b.target.takeDamage(b.damage);
            bullets.splice(i, 1); // Remove bullet
        }
        // Clean up stray bullets (optional: remove if too far or target dead)
        else if (b.pos.dist(player.pos) > 1000) {
            bullets.splice(i, 1);
        }
    }
    // 5. Drops
    for (let i = drops.length - 1; i >= 0; i--) {
        let d = drops[i];
        d.update(player);
        d.show();
        // Check Collection
        if (dist(player.pos.x, player.pos.y, d.pos.x, d.pos.y) < player.size) {
            if (d.type === "XP") {
                player.gainXP(d.value);
            } else {
                player.currency += 1; // Add to wallet
            }
            drops.splice(i, 1);
        }
    }

    pop(); // End Camera Translation
    // --- HUD ---
    drawUI();
    // --- GAME OVER CHECK ---
    if (player.hp <= 0) {
        drawGameOver();
        noLoop(); // Stop the game loop
    }
}

function drawUI() {
    // --- 1. HEALTH BAR (Top Left) ---
    push();
    noStroke();

    // Background (Dark Grey)
    fill(50);
    rect(20, 20, 200, 20);

    // Foreground (Red) - Mapped Current HP to Max HP
    let hpWidth = map(player.hp, 0, player.maxHp, 0, 200);
    // Clamp the value so it doesn't draw backwards if HP < 0
    hpWidth = constrain(hpWidth, 0, 200);

    fill(255, 50, 50);
    rect(20, 20, hpWidth, 20);

    // Border
    noFill();
    stroke(255);
    strokeWeight(2);
    rect(20, 20, 200, 20);
    pop();

    // --- 2. XP BAR (Below Health) ---
    push();
    noStroke();

    // Background (Dark Grey)
    fill(50);
    rect(20, 50, 200, 10);

    // Foreground (Cyan) - Mapped Current XP to Next Level Goal
    let xpWidth = map(player.xp, 0, player.nextLevelXp, 0, 200);
    xpWidth = constrain(xpWidth, 0, 200);

    fill(0, 255, 255);
    rect(20, 50, xpWidth, 10);

    // Border
    noFill();
    stroke(255);
    strokeWeight(1);
    rect(20, 50, 200, 10);
    pop();

    // --- 3. TEXT STATS ---
    push();
    fill(255);
    textSize(16);
    textStyle(BOLD);
    textAlign(LEFT, TOP);

    // Add a black outline to text for readability
    stroke(0);
    strokeWeight(3);
    text(`LVL: ${player.level}`, 230, 50);

    fill(255, 215, 0); // Gold color
    text(`GEMS: ${player.currency}`, 230, 20);
    pop();

    // --- 4. LEVEL UP POPUP ---
    // Only draw this if the timer is active
    if (player.levelUpTimer > 0) {
        push();
        textAlign(CENTER, CENTER);
        textSize(60);
        textStyle(BOLD);

        // Gold Text with Black Outline
        stroke(0);
        strokeWeight(6);
        fill(255, 215, 0);

        text("LEVEL UP!", width / 2, height / 2 - 100);

        // Optional: Subtitle showing new stats
        // textSize(24);
        // fill(255);
        // strokeWeight(3);
        // text("Max HP Up!  +1 Missile!", width / 2, height / 2 - 50);

        player.levelUpTimer -= 10; // Decrease timer

        pop();
    }
}

function drawGameOver() {
    push();
    fill(0, 150); // Semi-transparent black overlay
    rect(0, 0, width, height);

    textAlign(CENTER, CENTER);
    fill(255, 0, 0);
    textSize(64);
    text("YOU PERISHED", width / 2, height / 2 - 20);

    fill(255);
    textSize(24);
    text("Git good by refreshing the page", width / 2, height / 2 + 40);
    pop();
}

    //This creates Obvious Background Seams
    // Creates a [A] [A] pattern that seems too obvious when scrolling
    function drawInfiniteBackground() {
        let tileSize = 1024; // Adjust based on your image resolution

        // Calculate which "tile" the player is currently standing on
        let currentTileX = Math.floor(player.pos.x / tileSize);
        let currentTileY = Math.floor(player.pos.y / tileSize);

        // Draw the 9 tiles surrounding the player so we never see the edge
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                image(
                    bgImg,
                    (currentTileX + i) * tileSize,
                    (currentTileY + j) * tileSize,
                    tileSize,
                    tileSize
                );
            }
        }
    }

//The fix to the seams is to use a [A][E] pattern where E is the reflected image of A
// Inside sketch.js
/*
function drawInfiniteBackground() {
    let tileSize = 1024;

    let currentTileX = Math.floor(player.pos.x / tileSize);
    let currentTileY = Math.floor(player.pos.y / tileSize);

    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            let x = (currentTileX + i) * tileSize;
            let y = (currentTileY + j) * tileSize;

            push();
            translate(x, y);

            // MIRRORING LOGIC:
            // If the tile index is odd, flip it.
            // This ensures edge A always touches edge A (mirrored).
            let scaleX = (currentTileX + i) % 2 === 0 ? 1 : -1;
            let scaleY = (currentTileY + j) % 2 === 0 ? 1 : -1;

            scale(scaleX, scaleY);

            // Draw at 0,0 relative to the translation
            image(bgImg, 0, 0, tileSize, tileSize);
            pop();
        }
    }
}
*/