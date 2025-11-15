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
    
    update(player,enemies, terrain) {
        // 1. Update Head (using seek)
        let seekForce = this.seek(player.pos);
        let separateForce = this.separate(enemies);
        let avoidForce = this.avoid(terrain, player.pos);

        // Weight forces
        seekForce.mult(1.0);
        separateForce.mult(2.0); // Don't crowd other enemies
        avoidForce.mult(5.0);    // Avoid obstacles strongly

        this.applyForce(seekForce);
        this.applyForce(separateForce);
        this.applyForce(avoidForce);

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

    applyForce(force) {
        this.acc.add(force);
    }

    // Basic seek behavior for the head
    seek(target) {
        let desired = p5.Vector.sub(target, this.headPos);
        desired.setMag(this.maxSpeed);
        let steer = p5.Vector.sub(desired, this.vel);
        steer.limit(this.maxForce);
        return steer;
    }
    separate(enemies) {
        let desiredSeparation = this.r * 4; // Use worm's radius
        let sum = createVector(0, 0);
        let count = 0;

        for (let other of enemies) {
            // Use .pos for compatibility (worm has .pos, enemy has .pos)
            let d = p5.Vector.dist(this.headPos, other.pos);

            // If they are too close (and not me)
            if ((d > 0) && (d < desiredSeparation)) {
                let diff = p5.Vector.sub(this.headPos, other.pos);
                diff.normalize();
                diff.div(d);
                sum.add(diff);
                count++;
            }
        }

        if (count > 0) {
            sum.div(count);
            sum.setMag(this.maxSpeed);
            let steer = p5.Vector.sub(sum, this.vel);
            steer.limit(this.maxForce);
            return steer;
        }
        return createVector(0, 0);
    }

    /*
    // This is just like the avoid function we have seen in class, that i believe is not good enough
    // basically because the enemy can get stuck on corners
    avoid(obstacles) {
        let perceptionRadius = this.r * 6;
        let sum = createVector(0, 0);
        let count = 0;
        for (let obs of obstacles) {
            let d = p5.Vector.dist(this.headPos, obs.pos);

            if ((d > 0) && (d < perceptionRadius + obs.r)) {
                let diff = p5.Vector.sub(this.headPos, obs.pos);
                diff.normalize();
                diff.div(d);
                sum.add(diff);
                count++;
            }
        }
        if (count > 0) {
            sum.div(count);
            sum.setMag(this.maxSpeed);
            let steer = p5.Vector.sub(sum, this.vel);
            steer.limit(this.maxForce * 2.0); // Allow for strong turns
            return steer;
        }
        return createVector(0, 0);
    }
     */

    // An improved AVOID function that uses tangent method to prevent getting stuck on corners
    // attempts to steer "around" obstacles by choosing a tangent force aligned with the target
    avoid(obstacles, target) {
        // How far ahead the enemy "looks" for obstacles
        let perceptionRadius = this.r * 5; // Increased perception
        let sum = createVector(0, 0);
        let count = 0;

        // The "goal" direction, for reference
        let seekDirection = p5.Vector.sub(target, this.headPos); // Use headPos
        seekDirection.normalize();

        for (let obs of obstacles) {
            let d = p5.Vector.dist(this.headPos, obs.pos); // Use headPos

            // If the obstacle is within our perception radius
            if ((d > 0) && (d < perceptionRadius + obs.r)) {

                // 1. Base Repulsion Force (points directly away from obstacle)
                let repel = p5.Vector.sub(this.headPos, obs.pos); // Use headPos
                repel.normalize();

                // 2. Calculate the two perpendicular "sliding" forces
                let tangent1 = createVector(-repel.y, repel.x);
                let tangent2 = createVector(repel.y, -repel.x);

                // 3. Find which tangent is "better"
                let tangentToUse;
                if (tangent1.dot(seekDirection) > tangent2.dot(seekDirection)) {
                    tangentToUse = tangent1;
                } else {
                    tangentToUse = tangent2;
                }

                // 4. Combine Repulsion + Tangent
                tangentToUse.setMag(1.0);
                repel.setMag(0.5);
                let combinedForce = p5.Vector.add(tangentToUse, repel);

                // 5. Weight by distance
                let weight = (perceptionRadius - d) / perceptionRadius;
                combinedForce.mult(weight * this.maxSpeed);

                sum.add(combinedForce);
                count++;
            }
        }

        if (count > 0) {
            sum.div(count);
            sum.setMag(this.maxSpeed);
            let steer = p5.Vector.sub(sum, this.vel);
            steer.limit(this.maxForce * 2.5);
            return steer;
        }
        return createVector(0, 0);
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