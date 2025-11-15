let player;
let spawner;
let enemies = []; // The player class looks at this
let bullets = []; // The player class pushes to this
let drops = [];   // Future use for XP/Gems
let arrows = []; // For archer enemy projectiles
// MAP DEFINITION
let terrain=[]; // For future obstacles
// brush radius for obstacle editor
let debugRadius=50;


function preload() {
    // Asset loading
    mapImg = loadImage('assets/Map.png');
    playerImg = loadImage('assets/Sorcerer.png');
    enemyImg = loadImage('assets/Zombie.png');
    bulletImg = loadImage('assets/MagicMissile.png');
    bgImg = loadImage('assets/Sand.jpg');
    monkImg = loadImage('assets/Monk.png');
    knightImg = loadImage('assets/Knight.png');
    lancerImg = loadImage('assets/Lancer.png');
    archerImg = loadImage('assets/Archer.png');
    arrowImg = loadImage('assets/Arrow.png');
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    imageMode(CENTER);
    player = new Player(mapImg.width / 2, mapImg.height / 2);
    spawner = new Spawner();

    // Give player a starting weapon
    player.weapons.push(new MagicMissileWeapon());

    // Defining the terrain obstacles
    terrain.push(new Obstacle(171,261,45));
    terrain.push(new Obstacle(283, 315, 74));
    terrain.push(new Obstacle(281, 205, 45));
    terrain.push(new Obstacle(377, 28, 25));
    terrain.push(new Obstacle(635, 216, 60));
    terrain.push(new Obstacle(877, 219, 55));
    terrain.push(new Obstacle(759, 169, 105));
    terrain.push(new Obstacle(489, 548, 70));
    terrain.push(new Obstacle(1213, 473, 20));
    terrain.push(new Obstacle(1221, 214, 20));
    terrain.push(new Obstacle(1378, 299, 40));
    terrain.push(new Obstacle(1348, 234, 75));
    terrain.push(new Obstacle(1349, 141, 50));
    terrain.push(new Obstacle(220, 967, 45));
    terrain.push(new Obstacle(733, 882, 75));
    terrain.push(new Obstacle(734, 786, 50));
    terrain.push(new Obstacle(934, 758, 20));
    terrain.push(new Obstacle(1205, 844, 40));
    terrain.push(new Obstacle(1373, 722, 70));
    terrain.push(new Obstacle(1374, 625, 55));
    terrain.push(new Obstacle(327, 1259, 40));
    terrain.push(new Obstacle(220, 1253, 70));
    terrain.push(new Obstacle(223, 1157, 50));
    terrain.push(new Obstacle(1164, 1170, 45));

}

/*
//Deprecated simple spawner function
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
*/

function draw() {
    background(0);

    // --- CAMERA & BACKGROUND ---
    push();
    // Move the world relative to player
    translate(width / 2 - player.pos.x, height / 2 - player.pos.y);
    //draw map
    image(mapImg, mapImg.width / 2, mapImg.height / 2, mapImg.width, mapImg.height);
    //drawInfiniteBackground();

    //Draw Terrain Obstacles
    for(let obs of terrain){
        obs.show();
    }

    // --- GAME UPDATE LOOP ---
    // 1. Player
    player.update(terrain);
    // Constrain player to map boundaries
    let playerRadius = player.size / 2;
    player.pos.x = constrain(player.pos.x, playerRadius, mapImg.width - playerRadius);
    player.pos.y = constrain(player.pos.y, playerRadius, mapImg.height - playerRadius);
    player.show();
    /*
    ////Deprecated simple spawner logic
    if (frameCount % 60 === 0)spawnEnemy();
    */
    // 2. Weapons
    player.updateWeapons(enemies, bullets);
    player.drawWeapons();
    // 3. Spawner
    spawner.update(player);
    // 4. Enemies
    // Update Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        // PASS THE ENTIRE ARRAY for separation logic
        e.update(player, enemies, terrain);
        // Constrain enemies to map boundaries
        let enemyRadius = e.r;
        e.pos.x = constrain(e.pos.x, enemyRadius, mapImg.width - enemyRadius);
        e.pos.y = constrain(e.pos.y, enemyRadius, mapImg.height - enemyRadius);
        e.show();

        // Check player collision for damage
        let d = dist(e.pos.x, e.pos.y, player.pos.x, player.pos.y);
        if (d < e.r + player.size / 2) {
            player.takeDamage(e);
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
    // 5. Bullets
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
    // 6. Drops
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
    //7.Arrows
    for(let i=arrows.length-1;i>=0;i--){
        let a=arrows[i];
        a.update();
        a.show();

        // Check collision with player
        if(a.hits(player)){

            // BUGFIX: Pass the whole arrow 'a', not 'a.damage'
            player.takeDamage(a);

            arrows.splice(i,1); // Your code here is correct! This will now run.
        }
        // Clean up stray arrows
        else if (a.pos.dist(player.pos) > 1000) {
            arrows.splice(i, 1);
        }
    }

    pop(); // End Camera Translation
    // --- HUD ---
    drawUI();
    // Draw the red brush on top of the game, at the mouse
    //drawDebugBrush(); // (Add this line)
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
    let xpWidth = map(player.xp, 0, player.xpToNextLevel, 0, 200);
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
/*
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

function keyPressed() {
    // Use '1' and '2' keys to change the brush size
    if (key === '1') {
        debugRadius = max(10, debugRadius - 5); // Decrease size, min 10
        console.log("Debug radius set to: " + debugRadius);
    }
    if (key === '2') {
        debugRadius += 5; // Increase size
        console.log("Debug radius set to: " + debugRadius);
    }
}

function mousePressed() {
    // 1. Calculate the mouse's position in the GAME WORLD, not the screen
    // This formula "un-translates" the mouse coordinates
    let worldX = round(mouseX - width / 2 + player.pos.x);
    let worldY = round(mouseY - height / 2 + player.pos.y);

    // 2. Print the exact line of code to the console (F12)
    let codeLine = `terrain.push(new Obstacle(${worldX}, ${worldY}, ${debugRadius}));`;
    console.log(codeLine);

    // Optional: Prevents player from shooting while placing obstacles
    // return false;
}

function drawDebugBrush() {
    push();
    fill(255, 0, 0, 100); // Semi-transparent red
    stroke(255, 0, 0);
    strokeWeight(2);
    // Draw the circle at the mouse's screen position
    circle(mouseX, mouseY, debugRadius * 2);
    pop();
}

function drawPauseScreen() {
    push();
    // This draws in SCREEN space, not world space

    // --- DELETE THESE TWO LINES ---
    // fill(0, 150); // Dark semi-transparent overlay
    // rect(0, 0, width, height);
    // ---

    textAlign(CENTER, CENTER);
    fill(255);
    textSize(64);
    textStyle(BOLD);
    stroke(0);
    strokeWeight(6);
    text("PAUSED", width / 2, height / 2);
    pop();
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