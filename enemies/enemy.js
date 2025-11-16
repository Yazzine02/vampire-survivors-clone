class Enemy {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.vel = createVector(0, 0);
        this.acc = createVector(0, 0);

        this.damage = 15;

        this.maxSpeed = 0.5;  // Slower than player (usually)
        this.maxForce = 0.1; // How fast they can change direction
        this.r = 15;        // Radius/Size
        this.hp = 30;       // Health Points
        this.isDead = false;

        this.img = enemyImg; // Default enemy image

        this.largeurZoneEvitementDevantVaisseau = this.r / 2;
    }

    update(player, enemies, terrain) {
        // --- AI DECISION MAKING ---
        let seekForce = this.seek(player.pos);
        let separateForce = this.separate(enemies);
        let avoidForce = this.avoid(terrain, player.pos);

        // Weight the forces:
        // We want them to chase the player, but PRIORITY is personal space.
        seekForce.mult(1.0);
        separateForce.mult(2.0); // Stronger force to prevent overlapping
        avoidForce.mult(5.0);    // Strongly avoid obstacles

        this.applyForce(seekForce);
        this.applyForce(separateForce);
        this.applyForce(avoidForce)

        // --- PHYSICS ENGINE (Same as Bullet) ---
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.mult(0);
    }

    applyForce(force) {
        this.acc.add(force);
    }

    // 1. SEEK: The drive to kill the player
    seek(target) {
        let desired = p5.Vector.sub(target, this.pos);
        desired.setMag(this.maxSpeed);
        let steer = p5.Vector.sub(desired, this.vel);
        steer.limit(this.maxForce);
        return steer;
    }

    // 2. SEPARATE: The drive to not crowd neighbors
    separate(enemies) {
        let desiredSeparation = this.r * 2; // Maintain a buffer zone
        let sum = createVector(0, 0);
        let count = 0;

        // Loop through every OTHER enemy
        // (Performance Warning: This is N^2. For < 100 enemies it's fine)
        for (let other of enemies) {
            let d = p5.Vector.dist(this.pos, other.pos);

            // If they are too close (and not me)
            if ((d > 0) && (d < desiredSeparation)) {
                let diff = p5.Vector.sub(this.pos, other.pos);
                diff.normalize();
                diff.div(d); // Weigh by distance: closer = stronger push
                sum.add(diff);
                count++;
            }
        }

        if (count > 0) {
            sum.div(count); // Average direction
            sum.setMag(this.maxSpeed);
            let steer = p5.Vector.sub(sum, this.vel);
            steer.limit(this.maxForce); // Don't separate TOO abruptly
            return steer;
        }
        return createVector(0, 0);
    }
    // This is just like the avoid function we have seen in class, that i believe is not good enough
    // basically because the enemy can get stuck on corners
    // 3. AVOID: The drive to not hit obstacles (terrain)
    avoid(obstacles) {
        // calcul d'un vecteur "ahead" (capteur) devant le véhicule
        let ahead = this.vel.copy();
        // 30 frames "dans le futur".
        // Note : Si la vitesse est très basse (0.5), 30 frames = 15 pixels.
        // Vous pouvez augmenter le multiplicateur (ex: 60 ou 100) si vous trouvez
        // que les ennemis réagissent trop tard.
        ahead.mult(30);

        //on calcule ahead2, deux fois plus petit
        let ahead2 = ahead.copy();
        ahead2.mult(0.5);

        if (Enemy.debug) {
            this.drawVector(this.pos, ahead, "yellow");
            this.drawVector(this.pos, ahead2, "purple");
        }

        // Calcul des coordonnées du point au bout de ahead
        let pointAuBoutDeAhead = this.pos.copy().add(ahead);
        let pointAuBoutDeAhead2 = this.pos.copy().add(ahead2);

        // Detection de l'obstacle le plus proche
        let obstacleLePlusProche = this.getObstacleLePlusProche(obstacles);

        // Si pas d'obstacle, on renvoie un vecteur nul
        if (obstacleLePlusProche == undefined) {
            return createVector(0, 0);
        }

        // On calcule la distance entre le cercle et le bout du vecteur ahead
        let distance1 = pointAuBoutDeAhead.dist(obstacleLePlusProche.pos);
        let distance2 = pointAuBoutDeAhead2.dist(obstacleLePlusProche.pos);
        let distance = min(distance1, distance2);

        if (Enemy.debug) {
            // On dessine le point au bout du vecteur ahead pour debugger
            push();
            fill("red");
            circle(pointAuBoutDeAhead.x, pointAuBoutDeAhead.y, 10);
            fill("blue");
            circle(pointAuBoutDeAhead2.x, pointAuBoutDeAhead2.y, 10);
            pop();

            // On dessine la zone d'évitement
            push();
            stroke(100, 100);
            strokeWeight(this.largeurZoneEvitementDevantVaisseau);
            line(this.pos.x, this.pos.y, pointAuBoutDeAhead.x, pointAuBoutDeAhead.y);
            pop();
        }

        // si la distance est < rayon de l'obstacle + largeur zone + rayon ennemi
        if (distance < obstacleLePlusProche.r + this.largeurZoneEvitementDevantVaisseau + this.r) {
            // collision possible 

            // calcul de la force d'évitement. C'est un vecteur qui va
            // du centre de l'obstacle vers le point au bout du vecteur ahead
            let force;
            if (distance1 < distance2) {
                force = p5.Vector.sub(pointAuBoutDeAhead, obstacleLePlusProche.pos);
            } else {
                force = p5.Vector.sub(pointAuBoutDeAhead2, obstacleLePlusProche.pos);
            }

            if (Enemy.debug) {
                this.drawVector(obstacleLePlusProche.pos, force, "yellow");
            }

            // Pilotage :
            // force est la vitesse désirée
            force.setMag(this.maxSpeed);
            // force = vitesse désirée - vitesse courante
            force.sub(this.vel);
            // on limite cette force à la longueur maxForce
            force.limit(this.maxForce);
            return force;
        } else {
            // pas de collision possible
            return createVector(0, 0);
        }
    }
    getObstacleLePlusProche(obstacles) {
        let plusPetiteDistance = 100000000;
        let obstacleLePlusProche = undefined;

        // Assurez-vous que 'obstacles' est bien un tableau
        if (!Array.isArray(obstacles)) {
            console.error("getObstacleLePlusProche: 'obstacles' n'est pas un tableau.");
            return undefined;
        }

        obstacles.forEach(o => {
            // Je calcule la distance entre le vaisseau et l'obstacle
            const distance = this.pos.dist(o.pos);

            if (distance < plusPetiteDistance) {
                plusPetiteDistance = distance;
                obstacleLePlusProche = o;
            }
        });

        return obstacleLePlusProche;
    }
    /*
    // An improved AVOID function that uses tangent method to prevent getting stuck on corners
    // attempts to steer "around" obstacles by choosing a tangent force aligned with the target
    avoid(obstacles, target) {
        let perceptionRadius = this.r * 5;
        let strongestAvoidanceForce = createVector(0, 0);
        let strongestTangent = createVector(0, 0);

        let seekDirection = p5.Vector.sub(target, this.pos).normalize();

        // --- ! MODIFIED "DECIDER" LOGIC ! ---
        let decider;
        if (this.stickyTangent.magSq() > 0) {
            // 1. We have a "locked" choice. Use it.
            decider = this.stickyTangent;
        } else if (this.vel.magSq() > 1) {
            // 2. We are moving. Use momentum.
            decider = this.vel.copy().normalize();
        } else {
            // 3. We are stuck. Use seek direction.
            decider = seekDirection;
        }
        // ---

        for (let obs of obstacles) {
            let d = p5.Vector.dist(this.pos, obs.pos);

            if ((d > 0) && (d < perceptionRadius + obs.r)) {
                let repel = p5.Vector.sub(this.pos, obs.pos).normalize();
                let tangent1 = createVector(-repel.y, repel.x);
                let tangent2 = createVector(repel.y, -repel.x);

                // Find which tangent is "better" using our stable 'decider'
                let tangentToUse;
                if (tangent1.dot(decider) > tangent2.dot(decider)) {
                    tangentToUse = tangent1;
                } else {
                    tangentToUse = tangent2;
                }

                tangentToUse.setMag(1.0);
                repel.setMag(0.5);
                let combinedForce = p5.Vector.add(tangentToUse, repel);

                let weight = (perceptionRadius - d) / perceptionRadius;
                combinedForce.mult(weight * this.maxSpeed);

                if (combinedForce.magSq() > strongestAvoidanceForce.magSq()) {
                    strongestAvoidanceForce = combinedForce;
                    // --- ! NEW ! ---
                    // Remember the tangent associated with this strongest force
                    strongestTangent = tangentToUse;
                }
            }
        }


        if (strongestAvoidanceForce.magSq() > 0) {
            // --- ! "LOCK IN" THE CHOICE ! ---
            this.stickyTangent = strongestTangent; // "Lock" this tangent

            strongestAvoidanceForce.setMag(this.maxSpeed);
            let steer = p5.Vector.sub(strongestAvoidanceForce, this.vel);

            // --- ! MODIFIED ! ---
            // As requested, a *VERY* powerful steering force
            steer.limit(this.maxForce * 10.0);

            return steer;
        }

        // --- ! "UNLOCK" THE CHOICE ! ---
        // No threats found, so clear the "lock"
        this.stickyTangent = createVector(0, 0);
        return createVector(0, 0); // No threats found
    }


    // --- ! NEW ! ---
    // (Add this new function for debugging)
    debugDraw(obstacles, target) {
        let perceptionRadius = this.r * 5;

        // 1. Draw perception radius
        push();
        noFill();
        stroke(100, 255, 100, 50); // Faint green
        strokeWeight(1);
        circle(this.pos.x, this.pos.y, perceptionRadius * 2);
        pop();

        let seekDirection = p5.Vector.sub(target, this.pos).normalize();
        let decider = this.vel.copy();
        if (decider.magSq() < 1) decider = seekDirection;
        else decider.normalize();

        // 2. Find the *single closest* obstacle for drawing
        let closestObs = null;
        let minDist = Infinity;
        for (let obs of obstacles) {
            let d = p5.Vector.dist(this.pos, obs.pos);
            if (d < minDist && d < perceptionRadius + obs.r) {
                minDist = d;
                closestObs = obs;
            }
        }

        // 3. If we have a close obstacle, draw all the forces
        if (closestObs) {
            push();
            let repel = p5.Vector.sub(this.pos, closestObs.pos).normalize();
            let tangent1 = createVector(-repel.y, repel.x);
            let tangent2 = createVector(repel.y, -repel.x);

            let tangentToUse;
            if (tangent1.dot(decider) > tangent2.dot(decider)) {
                tangentToUse = tangent1;
            } else {
                tangentToUse = tangent2;
            }

            // Helper to draw vectors
            let drawVec = (v, color) => {
                stroke(color);
                strokeWeight(2);
                line(this.pos.x, this.pos.y, this.pos.x + v.x * 50, this.pos.y + v.y * 50);
            };

            drawVec(repel, "red");       // Repulsion force (away)
            drawVec(tangent1, "gray");   // Unused tangent
            drawVec(tangent2, "gray");   // Unused tangent
            drawVec(tangentToUse, "cyan"); // *The chosen tangent*

            pop();
        }
    }
     */

    show() {
        push();
        translate(this.pos.x, this.pos.y);
        // Optional: Flip sprite if moving left
        if (this.vel.x < 0) scale(-1, 1);
        // Draw Undead Sprite
        image(this.img, 0, 0, this.r * 3, this.r * 3);

        pop();
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.isDead = true;
        }
    }
}