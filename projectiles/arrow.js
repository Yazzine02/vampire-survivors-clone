class Arrow {
    constructor(x, y, targetPos) {
        this.pos = createVector(x, y);
        this.r = 5;
        this.damage = 8;
        
        // Calculate velocity ONCE
        this.vel = p5.Vector.sub(targetPos, this.pos);
        this.vel.setMag(5); // Flies at speed 10
    }
    
    update() {
        this.pos.add(this.vel);
    }
    
    show() {
        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.vel.heading()); // Point in the direction of flight
        
        image(arrowImg, 0, 0, 30, 10); // Assumes 'arrowImg' is loaded
        pop();
    }

    // Check collision with player
    hits(player) {
        let d = dist(this.pos.x, this.pos.y, player.pos.x, player.pos.y);
        return d < this.r + player.size / 2;
    }
}