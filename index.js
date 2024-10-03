import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getFirestore, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
const canvasObj = document.querySelector("canvas");
const firebaseConfig = {
  apiKey: "AIzaSyCRK2izk5LvUkWh5aq-m-300AtEZZpElEI",
  authDomain: "eekhgames.firebaseapp.com",
  projectId: "eekhgames",
  storageBucket: "eekhgames.appspot.com",
  messagingSenderId: "1046928875257",
  appId: "1:1046928875257:web:0a1f2a00f09541bb514c28",
  measurementId: "G-YK4V9GVGTJ"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let health;
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const mobileNumber = urlParams.get('mobileNumber');


const ctx = canvasObj.getContext('2d');
// ctx.fillStyle = "lightblue";

// canvasObj.style.background = "white";
// canvasObj.style.backgroundColor = "white";

canvasObj.width = window.innerWidth;
canvasObj.height = window.innerHeight;

const scoreHtml = document.getElementById("scoreHtml");
const healthHtml = document.getElementById("healthHtml");
const startBtn = document.getElementById("startGameBtn");
const modalMainMenu = document.getElementById("modalMainMenu");
const bigScore = document.getElementById("bigScoreHtml");
const sound1 = document.getElementById("Audio");

console.log(ctx);

let leftArrow = false;
let rightArrow = false;
let upArrow = false;
let downArrow = false;

// control keys:
document.addEventListener("keydown", function(event) {
    if (event.keyCode == 37) {
        leftArrow = true;
    } else if (event.keyCode == 39) {
        rightArrow = true;
    } else if (event.keyCode == 38) {
        upArrow = true;
    } else if (event.keyCode == 40) {
        downArrow = true;
    }
});

document.addEventListener("keyup", function(event) {
    if (event.keyCode == 37) {
        leftArrow = false;
    } else if (event.keyCode == 39) {
        rightArrow = false;
    } else if (event.keyCode == 38) {
        upArrow = false;
    } else if (event.keyCode == 40) {
        downArrow = false;
    }
});

function drawHealthBar() {
    const barWidth = 200;
    const barHeight = 20;
    const barX = 20;
    const barY = 20;
    
    // Draw the background of the health bar
    ctx.fillStyle = 'grey';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Draw the foreground of the health bar based on the player's health
    ctx.fillStyle = 'red';
    ctx.fillRect(barX, barY, barWidth * (health / 10), barHeight);
    
    // Draw the text showing the current health
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(`Health: ${health}`, barX + 10, barY + 15);
}


// move player:
function movePlayer() {
    const moveSpeed = 2;
    if (rightArrow && player.x + player.radius < canvasObj.width) {
        player.x += moveSpeed;
    } 
    if (leftArrow && player.x - player.radius > 0) {
        player.x -= moveSpeed;
    }
    if (upArrow && player.y - player.radius > 0) {
        player.y -= moveSpeed;
    }
    if (downArrow && player.y + player.radius < canvasObj.height) {
        player.y += moveSpeed;
    }
}

class Player {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.pulseRate = 0.02; // Rate at which the heart pulsates
        this.pulseSize = 0;
    }

    draw() {
        const heartSize = this.radius * (2 + this.pulseSize);
        ctx.drawImage(heartImg, this.x - heartSize / 2, this.y - heartSize / 2, heartSize, heartSize);
    }

    update() {
        this.pulseSize += this.pulseRate;
        if (this.pulseSize > 0.1 || this.pulseSize < -0.1) {
            this.pulseRate = -this.pulseRate;
        }
        this.draw();
    }
}
class Bullet {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        ctx.drawImage(bloodDropImg, this.x - this.radius, this.y - this.radius, this.radius * 5, this.radius * 5);
    }

    update() {
        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
}


class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.health = 20; // Initialize health to 20
    }

    draw() {
        ctx.beginPath();
        ctx.arc(
            this.x, this.y, this.radius, 0, Math.PI * 2, false);
        //ctx.fillStyle = this.color;
        //ctx.fill();
        // fill not used here, when using Bitmap Images (declared in components.js)
        if (this.radius > 24) {
            ctx.drawImage(BATcool_img, this.x - 16, this.y - 10);
        } else {
            ctx.drawImage(BAT_img, this.x - 16, this.y - 10);
        }
    }
    update() {
        this.draw();
        this.x = this.x + this.velocity.x
        this.y = this.y + this.velocity.y
    }
}

const friction = 0.96; //low means gibs splatt! high means gibs will travel far!
class Gib {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(
            this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
    update() {
        this.draw();
        this.velocity.x *= friction;
        this.velocity.y *= friction;
        this.x = this.x + this.velocity.x
        this.y = this.y + this.velocity.y
        this.alpha -= 0.001
        // Alpha can be really small. BUT: It needs to have at least SOME value...
        // Or they will never be removed and the canvas will look like Jackson Pollock Art...
        // And of course, the CPU will say Good-Bye sooner or later
    }
}

const xWorld = canvasObj.width / 2;
const yWorld = canvasObj.height / 2;

let player = new Player(xWorld, yWorld + 200, 30, "white");
let bullets = [];
let enemies = [];
let gibs = [];

function init() {
    player = new Player(xWorld, yWorld + 200, 30, "white");
    bullets = [];
    enemies = [];
    gibs = [];
    score = 0;
    health = 10;
    healthHtml.innerHTML = health;
    scoreHtml.innerHTML = score;
    bigScore.innerHTML = score;
}

// Sounds:
function playSound1() { 
    sound1.play(); 
}

function spawnEnemies() {
    setInterval(() => {
        const x = Math.random() * canvasObj.width;
        // Math.random() < 0.5 ? 0 : canvasObj.width;
        const y = 0;
        const radius = Math.random() * (30 - 5) + 5; // Max: 30, Min: 5

        const color =  `hsl(${Math.random()*360}, 50%, 50%)`  // "#225588";

        const angle = Math.atan2(player.y - y, player.x - x); //Closing IN to the Center(if xWorld.x) OR Player(if player.x).
        const velocity = { x: Math.cos(angle), y: Math.sin(angle)};

        enemies.push(new Enemy(x, y, radius, color, velocity))
    }, 2000);
}

let score = 0;
let animationId;
function drawPlayerHealthBar() {
    const barWidth = 200;
    const barHeight = 20;
    const barX = 20;
    const barY = 20;
    
    // Draw the background of the health bar
    ctx.fillStyle = 'grey';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Draw the foreground of the health bar based on the player's health
    ctx.fillStyle = 'red';
    ctx.fillRect(barX, barY, barWidth * (health / 10), barHeight);
    
    // Draw the text showing the current health
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(`Health: ${health}`, barX + 10, barY + 15);
}

function drawEnemyHealthBar(enemy) {
    const barWidth = 15;
    const barHeight = 12;
    const barX = enemy.x - barWidth / 2;
    const barY = enemy.y - enemy.radius - 10;
    
    // Draw the background of the health bar
    ctx.fillStyle = 'grey';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Draw the foreground of the health bar based on the enemy's health
    ctx.fillStyle = 'red';
    ctx.fillRect(barX, barY, barWidth * (enemy.health / 20), barHeight);
    
    // Draw the text showing the current health
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText(`${Math.floor(enemy.health)}`, barX + 1 , barY + 10);
}

// Update the animate function to draw the health bars
function animate() {
    animationId = requestAnimationFrame(animate);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvasObj.width, canvasObj.height);
    movePlayer();
    player.update(); // Update the player's position and pulsing effect

    drawPlayerHealthBar(); // Draw the player's health bar

    gibs.forEach((gib, gibIndex) => {
        if (gib.alpha <= 0) {
            gibs.splice(gibIndex, 1);
        } else {
            gib.update();
        }
    });

    bullets.forEach((bullet, bulletLocIndex) => {
        bullet.update();
        if (bullet.x + bullet.radius < 0 ||
            bullet.x - bullet.radius > canvasObj.width ||
            bullet.y + bullet.radius < 0 ||
            bullet.y - bullet.radius > canvasObj.height) {
            setTimeout(() => {
                bullets.splice(bulletLocIndex, 1);
            }, 0);
        }
        
    });

    

    enemies.forEach((enemy, enemiesIndex) => {
    enemy.update();
    drawEnemyHealthBar(enemy); // Draw the enemy's health bar

    bullets.forEach((bullet, bulletIndex) => {
        const distEnemBullet = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
        if (distEnemBullet - enemy.radius - bullet.radius < 1) {
            score += 5;
            scoreHtml.innerHTML = score;
            for (let i = 0; i < enemy.radius * 3; i++) {
                gibs.push(new Gib(
                    bullet.x,
                    bullet.y,
                    Math.random() * 2,
                    enemy.color,
                    { x: (Math.random() - 0.5) * 6, y: (Math.random() - 0.5) * 6 }
                ));
            }
            enemy.health -= 10; // Reduce the enemy's health by 10
            bullets.splice(bulletIndex, 1); // Remove the bullet from the bullets array
            if (enemy.health <= 0) {
                enemies.splice(enemiesIndex, 1);
            }
        }
    });
       function sendScoreToFirestore(score) {
    if (mobileNumber) {
        const userDocRef = doc(db, "users", mobileNumber);

        // Retrieve the current user document
        getDoc(userDocRef)
            .then((docSnap) => {
                if (docSnap.exists()) {
                    // Get the current coins and MyBeatScore from the document
                    const previousCoins = docSnap.data().Coins || 0; // Default to 0 if Coins does not exist
                    const previousScore = docSnap.data().MyBeat2Score || 0;
                    const scoreHistory = docSnap.data().MyBeat2ScoreHistory || []; // Get existing score history or default to empty array

                    // Create a new score entry
                    const newScore = previousScore + score;

                    // Update the document with the new score and history
                    return updateDoc(userDocRef, {
                        Coins: previousCoins + score,
                        MyBeat2Score: newScore,
                        MyBeat2ScoreHistory: [...scoreHistory, score] // Append new score to history
                    });
                } else {
                    console.error("No such document!");
                }
            })
            .then(() => {
                console.log("Score updated successfully!");
            })
            .catch((error) => {
                console.error("Error updating score: ", error);
            });
    } else {
        console.error("No mobile number provided!");
    }
}

// In your game logic, this part stays unchanged:
const distEnemPlayer = Math.hypot(player.x - enemy.x, player.y - enemy.y);
if (distEnemPlayer - enemy.radius - player.radius < 1) {
    console.log("We are FCKD!");
    enemies.splice(enemiesIndex, 1);
    health -= 1;

    healthHtml.innerHTML = health;
    console.log("Health is now: ", health);
    zzfx(...[0.1, 0, 50, .02, , .5, 4, .1,,,,,,,,.06,.01]);

    // GAME OVER:
    if (health < 1) {
        cancelAnimationFrame(animationId);
        healthHtml.innerHTML = health;
        scoreHtml.innerHTML = score;
        modalMainMenu.style.display = "flex";
        bigScore.innerHTML = score;
        sendScoreToFirestore(score);

        //Sound of GAME OVER:
        zzfx(...[.5, , 925, .04, .3, .6, 1, .3, , 6.27, -184, .09, .17]);
    }
}

    // ...
});
}


window.addEventListener("click", (event) => {
    const angle = Math.atan2(event.clientY - player.y, event.clientX - player.x);

    // Bullet Speed:
    let speed = 5;
    const velocity = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed
    };

    // Birth of a Bullet:
    bullets.push(new Bullet(
        player.x, player.y, 3, "white", velocity
    ));

    

    // Sound of Bullet:
    zzfx(...[.8,,129,.01,,.15,,,,,,,,5]);
});

// Create a song
//let mySongData = zzfxM(...[[[,0,400,,,,1]],[[[,-1,10,4,5,5,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],[,1,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],[,-1,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],[,1,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,]]],[0],,{"title":"New Song","instruments":["Instrument 0"],"patterns":["Pattern 0"]}]);

startBtn.addEventListener("click", () => {
    init();
    animate();
    spawnEnemies();
    modalMainMenu.style.display = "none";

    // Play the song (returns a AudioBufferSourceNode)
    //let myAudioNode = zzfxP(...mySongData);
});
