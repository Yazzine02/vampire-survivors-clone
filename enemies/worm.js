// Extending the base class Enemy is a bad move here since we will have to
// override most of its methods. Instead, we create a new class with similar
// properties and methods so that 'sketch.js' can treat them the same way.
class WormEnemy {
    constructor(x, y) {
        this.headPos = createVector(x, y);
        this.vel = createVector(0, 0);
        this.acc = createVector(0, 0);
        
        this.maxSpeed = 1.8;
        this.maxForce = 0.1;
        
        // Stats
        this.r = 20; // Head radius (for collision)
        this.hp = 5;
        this.maxHp = 80;
        this.isDead = false;
        this.damage = 5;
        
        // Segment properties
        this.segments = [];
        this.numSegments = 2;
        this.segmentGap = 15; // Distance between segments
        
        // Initialize segments
        for (let i = 0; i < this.numSegments; i++) {
            // Place segments behind the head
            this.segments.push(createVector(x, y + (i + 1) * this.segmentGap));
        }
    }

    // A Worm has all the same methods as a regular Enemy,
    // so 'sketch.js' can treat them the same!
    
    update(player) {
        // 1. Update Head (using seek)
        this.seek(player.pos);
        
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.headPos.add(this.vel);
        this.acc.mult(0);
        
        // 2. Update Segments (Chain logic)
        let leader = this.headPos;
        for (let i = 0; i < this.numSegments; i++) {
            let segment = this.segments[i];
            
            // Vector pointing from segment to its leader
            let dir = p5.Vector.sub(leader, segment);
            let dist = dir.mag();
            
            // Move segment to be 'segmentGap' distance away from leader
            if (dist > this.segmentGap) {
                dir.setMag(dist - this.segmentGap);
                segment.add(dir);
            }
            // Update the leader for the next segment
            leader = segment;
        }
        this.devour(enemies);
    }

    devour(enemies) {
        for(let other of enemies){
            //if the other is myself then continue
            if(other==this) continue;
            // if the other is a worm then nothing happens
            if(other instanceof WormEnemy) continue;
            // if the other is a regular enemy then check for collision
            if(other instanceof Enemy){
                let d = dist(this.headPos.x, this.headPos.y, other.pos.x, other.pos.y);
                
                // If head touches a regular enemy...
                if (d < this.r + other.r) {
                    // DEVOUR!
                    other.isDead = true; // Mark the other enemy for deletion
                    
                    // Get stronger
                    this.hp += 10;
                    this.damage += 5;
                    
                    // Add a new segment to the end of the tail
                    let tail = this.segments[this.segments.length - 1];
                    this.segments.push(tail.copy());
                    this.numSegments++;
                }
            }
        }
    }

    // Basic seek behavior for the head
    seek(target) {
        let desired = p5.Vector.sub(target, this.headPos);
        desired.setMag(this.maxSpeed);
        let steer = p5.Vector.sub(desired, this.vel);
        steer.limit(this.maxForce);
        this.acc.add(steer);
    }

    show() {
        // Draw segments first (from back to front)
        for (let i = this.numSegments - 1; i >= 0; i--) {
            let seg = this.segments[i];
            image(enemyImg, seg.x, seg.y, 30, 30); // Smaller segments
        }
        
        // Draw head last (on top)
        image(enemyImg, this.headPos.x, this.headPos.y, 60, 60); // Big head
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.isDead = true;
        }
    }
    
    // Compatibility property for sketch.js collision
    get pos() {
        return this.headPos;
    }
}