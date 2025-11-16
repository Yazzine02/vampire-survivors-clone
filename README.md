# Reactive AI Survivor (p5.js Game)

A top-down survival game in the style of *Vampire Survivors*, built from scratch in p5.js. This project is a deep dive into **autonomous agent design**, focusing on implementing a variety of steering behaviors to create dynamic and complex enemy AI.

The player must survive an endless horde of enemies by leveling up and upgrading their automatic weapons, all while navigating a-static map filled with obstacles.

---

## 🚀 Core Gameplay Features

* **Top-Down Survival:** Navigate a large, static map and survive as long as possible.
* **Automatic Combat:** The player's weapons fire automatically, letting you focus on movement and positioning.
* **RPG Leveling System:** Collect XP gems from fallen enemies to level up. Each level-up grants full health, increased stats, and weapon upgrades.
* **Magnetic Drops:** XP and gems are automatically "sucked" to the player when they get close.
* **Diverse Enemy Roster:** Fight a variety of enemies, each with unique AI and stats:
    * **Zombies:** Standard melee enemies.
    * **Archers:** Kiting units that flee if you get too close and shoot from a distance.
    * **Worms:** Multi-segment enemies that devour other enemies to grow longer and stronger.
    * *(Knight, Lancer, Monk classes also included)*
* **Obstacle-Filled Map:** The map contains trees, rocks, and buildings that both the player and enemies must navigate around.

---

## 💻 Technical Features & AI Deep Dive

### 1. Player vs. Enemy Collision
The project implements two different types of obstacle handling:

* **Player (Collision Resolution):** The player moves freely. If they enter an obstacle, the `checkObstacleCollisions()` function "pushes" them back out to the nearest valid spot.
* **Enemy (Steering Avoidance):** Enemies *anticipate* collisions. The `avoid()` steering behavior calculates a force to steer them around an obstacle *before* they hit it.

### 2. Custom Enemy Classes
* **`Archer` (Inheritance):** `Archer extends Enemy` and overrides the `update()` method to create a custom AI state machine (Seek, Flee, or Shoot) based on its distance from the player. It inherits all the base `seek`, `separate`, and `avoid` functions.
* **`WormEnemy` (Custom Interface):** This class does *not* extend `Enemy` due to its unique (multi-segment) structure. It implements all the same public methods (`update`, `seek`, `separate`, `avoid`, `show`, `takeDamage`) and properties (`pos`, `r`) so that the main `sketch.js` file can treat it just like any other enemy. Its `devour()` method allows it to grow in real-time.

---

## 🎮 How to Play

* **Movement:** `QZSD` (AZERTY) or `Arrow Keys`

---

## 📂 How to Run Locally

This project uses `p5.js` and loads local asset files (images). Due to browser security (CORS), you must run it from a local web server.

1.  **Clone or download** this repository.
2.  **Open a terminal** in the project's root folder (the one containing `index.html`).
3.  **Start a local server.** The easiest way is with Python:
    ```bash
    # If you have Python 3
    python -m http.server
    
    # Or, if you have an older version of Python 2
    python -m SimpleHTTPServer
    ```
4.  **Open your browser** and go to `http://localhost:8000`.

---

## 🛠️ File Structure

* `sketch.js`: The main p5.js file. Handles `setup()`, `draw()`, game loop, camera, and all rendering.
* `index.html`: Loads all script files in the correct order.
* `player.js`: `Player` class. Handles movement, stats, leveling, and collisions.
* `obstacle.js`: Simple `Obstacle` class with position and radius.
* `spawner.js`: `Spawner` class. Handles the game's difficulty curve and enemy spawn logic.
* `drop.js`: `Drop` class. Defines the "magnet" behavior for XP and gems.
*
* `enemies/`
    * `enemy.js`: The **base `Enemy` class** containing all core AI: `seek`, `separate`, and `avoid`.
    * `archer.js`: Subclass with kiting (`flee`) logic.
    * `worm.js`: Custom multi-segment enemy with `devour` logic.
    * `knight.js`, `lancer.js`, `monk.js`: Additional enemy stubs.
*
* `weapons/`
    * `weapon.js`: Base `Weapon` class.
    * `magic_missile_weapon.js`: Auto-fires `Bullet` projectiles at the nearest enemy.
*
* `projectiles/`
    * `bullet.js`: Homing projectile that uses a `seek` behavior.
    * `arrow.js`: Simple straight-line projectile.
*
* `assets/`
    * Contains all `.png` and `.jpg` files for sprites and the map.
