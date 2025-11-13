class Drop{
    constructor(x, y, type) {
        this.pos = createVector(x, y);
        this.vel = createVector(0, 0);
        this.type = type; // "XP" or "GEM"
        this.value = 10;  // How much XP or Money it gives

        this.isMagnetized = false;
        this.speed = 8;
        this.r = 8;
    }

    update(player) {
        let d = dist(this.pos.x, this.pos.y, player.pos.x, player.pos.y);

        // 1. Magnet Trigger Range (e.g., 100 pixels)
        if (d < 150) {
            this.isMagnetized = true;
        }

        // 2. If magnetized, fly to player
        if (this.isMagnetized) {
            let dir = p5.Vector.sub(player.pos, this.pos);
            dir.setMag(this.speed); // Fly fast!
            this.pos.add(dir);
        }
    }

    show() {
        push();
        translate(this.pos.x, this.pos.y);
        noStroke();

        if (this.type === "XP") {
            fill(0, 255, 255); // Cyan for XP
            circle(0, 0, this.r);
        } else {
            fill(255, 215, 0); // Gold for Gems/Currency
            rectMode(CENTER);
            rect(0, 0, this.r, this.r); // Square shape for Gems
        }
        pop();
    }
}