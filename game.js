const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const keys = {};
const bullets = [];
const enemies = [];
const powerUps = [];
let enemySpawnCounter = 0;
let playerLives = 3;
let gameOver = false;
let score = 0;
let powerUpSpawnCounter = 0;
let level = 1;
let enemySpawnRate = 100; // Lower value means more frequent enemy spawns
let enemyBaseSpeed = 2;
let levelStarted = false;

let images = {
  player: new Image(),
  enemy1: new Image(),
  enemy2: new Image(),
  enemy3: new Image(),
  background: new Image(),
  powerUp1: new Image(),
};

images.player.src = "images/playerShip2_orange.png";
images.enemy1.src = "images/enemyBlack1.png";
images.enemy2.src = "images/enemyBlack2.png";
images.enemy3.src = "images/enemyBlack3.png";
images.background.src = "images/blue.png";
images.powerUp1.src = "images/powerUp_blue_bolt.png";

function imageLoader(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadImages() {
  try {
    const playerSrc = "images/playerShip2_orange.png";
    const enemy1Src = "images/enemyBlack1.png";
    const enemy2Src = "images/enemyBlack2.png";
    const enemy3Src = "images/enemyBlack3.png";
    const backgroundSrc = "images/blue.png";
    const powerUp1Src = "images/shield_gold.png";

    const [player, enemy1, enemy2, enemy3, background, powerUp1] =
      await Promise.all([
        imageLoader(playerSrc),
        imageLoader(enemy1Src),
        imageLoader(enemy2Src),
        imageLoader(enemy3Src),
        imageLoader(backgroundSrc),
        imageLoader(powerUp1Src),
      ]);

    images.player = player;
    images.enemy1 = enemy1;
    images.enemy2 = enemy2;
    images.enemy3 = enemy3;
    images.background = background;
    images.powerUp1 = powerUp1;
  } catch (err) {
    console.log(err);
  }
}

loadImages().then(() => {
  startGame();
});

function gameLoop() {
  if (!gameOver) {
    update();
    draw();
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "48px Arial";
    ctx.fillStyle = "#f00";
    ctx.fillText("Game Over", canvas.width / 2 - 100, canvas.height / 2 - 50);
    ctx.font = "24px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText(
      "Press R to Restart",
      canvas.width / 2 - 80,
      canvas.height / 2 + 20
    );
  }
  requestAnimationFrame(gameLoop);
}

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = images.player.width;
    this.height = images.player.height;
  }

  draw() {
    ctx.drawImage(images.player, this.x, this.y, this.width, this.height);
  }
}

class Bullet {
  constructor(x, y, width, height, color, speed) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.speed = speed;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  update() {
    this.y -= this.speed;
  }
}

class Enemy {
  constructor(x, y, width, height, speed, type, size, points) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.type = type;
    this.size = size;
    this.points = points;
  }

  draw() {
    let enemyImage;
    if (this.size === 1) {
      enemyImage = images.enemy1;
    } else if (this.size === 0.8) {
      enemyImage = images.enemy2;
    } else if (this.size === 1.2) {
      enemyImage = images.enemy3;
    }
    ctx.drawImage(enemyImage, this.x, this.y, this.width, this.height);
  }

  update() {
    if (this.type === "straight") {
      this.y += this.speed;
    } else if (this.type === "zigzag") {
      this.y += this.speed;
      this.x += Math.sin(this.y * 0.05) * 5;
    } else if (this.type === "circle") {
      this.y += this.speed;
      this.x += Math.sin(this.y * 0.05) * 5;
      this.y += Math.cos(this.x * 0.05) * 5;
    }
  }
}

class PowerUp {
  constructor(x, y, width, height, image) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.image = image;
  }

  draw() {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }

  update() {
    this.y += 1;
  }
}

let player = new Player(
  canvas.width / 2 - 25,
  canvas.height - 50,
  50,
  50,
  "#0f0"
);

function startGame() {
  // Initialize your game objects here
  player = new Player(canvas.width / 2 - 25, canvas.height - 75);

  // Start the game loop
  gameLoop();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(images.background, 0, 0, canvas.width, canvas.height);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  player.draw();

  bullets.forEach((bullet) => {
    bullet.draw();
  });

  enemies.forEach((enemy) => {
    enemy.draw();
  });

  for (const powerUp of powerUps) {
    powerUp.draw();
  }

  ctx.font = "24px Arial";
  ctx.fillStyle = "#fff";
  ctx.fillText(`Lives: ${playerLives}`, 20, 40);

  ctx.font = "24px Arial";
  ctx.fillStyle = "#fff";
  ctx.fillText(`Score: ${score}`, 20, 80);

  ctx.font = "24px Arial";
  ctx.fillStyle = "#fff";
  ctx.fillText(`Level: ${level}`, 20, 120);
}

window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

window.addEventListener("keydown", (e) => {
  if (gameOver && e.code === "KeyR") {
    restartGame();
  }
});

function handlePlayerInput() {
  if (keys["ArrowLeft"] || keys["KeyA"]) {
    player.x -= 5;
  }

  if (keys["ArrowRight"] || keys["KeyD"]) {
    player.x += 5;
  }

  if (keys["Space"]) {
    bullets.push(
      new Bullet(player.x + player.width / 2 - 5, player.y, 10, 20, "#0f0", 6)
    );
    keys["Space"] = false; // Prevent continuous shooting
  }
}

function nextLevel() {
  level++;
  enemySpawnRate *= 0.9;
  enemyBaseSpeed += 0.5;
  enemies.length = 0;
  bullets.length = 0;
  player.x = canvas.width / 2 - 25;
  player.y = canvas.height - 50;
  levelStarted = true; // Add this line
}
function checkLevelCleared() {
  // Check if the level has started and if there are no more enemies on the screen and no enemies are about to spawn
  if (
    levelStarted &&
    enemies.length === 0 &&
    enemySpawnCounter > enemySpawnRate * 0.8
  ) {
    return true;
  }
  return false;
}

function update() {
  handlePlayerInput();
  // Handle bullet updates
  bullets.forEach((bullet, index) => {
    bullet.update();

    if (bullet.y < 0) {
      bullets.splice(index, 1);
    }
  });

  // Handle enemy updates
  enemySpawnCounter++;

  if (enemySpawnCounter > enemySpawnRate) {
    const x = Math.random() * (canvas.width - 40);
    const enemyVariety = Math.floor(Math.random() * 3);
    let enemyType, enemyColor, enemySize, enemyPoints;

    if (enemyVariety === 0) {
      enemyType = "straight";
      enemyColor = "#f00";
      enemySize = 1;
      enemyPoints = 10;
    } else if (enemyVariety === 1) {
      enemyType = "zigzag";
      enemyColor = "#0ff";
      enemySize = 0.8;
      enemyPoints = 15;
    } else if (enemyVariety === 2) {
      enemyType = "circle";
      enemyColor = "#ff0";
      enemySize = 1.2;
      enemyPoints = 20;
    }

    enemies.push(
      new Enemy(
        x,
        0,
        40,
        40,
        enemyBaseSpeed + level * 0.5,
        enemyType,
        enemySize,
        enemyPoints
      )
    );
    enemySpawnCounter = 0;
    enemies.forEach((enemy, enemyIndex) => {
      enemy.update();

      for (let i = 0; i < powerUps.length; i++) {
        const powerUp = powerUps[i];
        powerUp.update();

        // Check for collision with the player
        if (
          powerUp.x < player.x + player.width &&
          powerUp.x + powerUp.width > player.x &&
          powerUp.y < player.y + player.height &&
          powerUp.y + powerUp.height > player.y
        ) {
          powerUps.splice(i, 1);
          i--;

          // Increase bullet speed temporarily
          player.bulletSpeed = 10;
          setTimeout(() => {
            player.bulletSpeed = 5;
          }, 5000);
        }
      }

      powerUpSpawnCounter++;
      if (powerUpSpawnCounter > 400 && Math.random() < 0.02) {
        powerUps.push(
          new PowerUp(
            Math.random() * (canvas.width - 30),
            0,
            30,
            30,
            images.powerUp1
          )
        );

        powerUpSpawnCounter = 0;
      }

      // Check for bullet-enemy collisions
      bullets.forEach((bullet, bulletIndex) => {
        if (
          bullet.x < enemy.x + enemy.width &&
          bullet.x + bullet.width > enemy.x &&
          bullet.y < enemy.y + enemy.height &&
          bullet.y + bullet.height > enemy.y
        ) {
          enemies.splice(enemyIndex, 1);
          bullets.splice(bulletIndex, 1);
          score += enemy.points; // Increase the player's score based on the enemy's point value
        }
      });

      // Check for player-enemy collisions
      if (
        player.x < enemy.x + enemy.width &&
        player.x + player.width > enemy.x &&
        player.y < enemy.y + enemy.height &&
        player.y + player.height > enemy.y
      ) {
        playerLives--;
        if (playerLives <= 0) {
          gameOver = true;
        } else {
          // Remove the collided enemy
          enemies.splice(enemyIndex, 1);
        }
      }

      // Remove enemies that go off-screen
      if (enemy.y > canvas.height) {
        enemies.splice(enemyIndex, 1);
      }
    });
  }

  if (checkLevelCleared()) {
    nextLevel();
  }
}

function restartGame() {
  playerLives = 3;
  gameOver = false;
  player.x = canvas.width / 2 - 25;
  player.y = canvas.height - 50;
  bullets.length = 0;
  enemies.length = 0;
  enemySpawnCounter = 0;
  powerUps.length = 0; // Reset power-ups
  score = 0;
}

loadImages(images);
