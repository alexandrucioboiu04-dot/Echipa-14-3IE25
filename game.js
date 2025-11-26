class ZombieTsunami {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Game state
        this.gameRunning = false;
        this.score = 0;
        this.lives = 3;
        this.zombieCount = 3; // Start with 3 zombies
        this.gameSpeed = 2; // Slower speed
        this.groundY = this.height - 100;
        this.cameraX = 0; // Camera position for scrolling
        
        // Zombie horde (no human player)
        this.zombies = []; // Individual zombies in the horde
        
        // Game objects
        this.people = []; // People that can be converted to zombies
        this.objects = []; // Destructible objects (cars, etc.)
        this.powerUps = []; // Power-up boxes
        this.particles = [];
        
        // Power-up states
        this.ninjaMode = false;
        this.tsunamiMode = false;
        this.tsunamiHeight = 0;
        
        // Input handling
        this.keys = {};
        this.setupInput();
        
        // UI elements
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOver');
        this.startBtn = document.getElementById('startBtn');
        this.restartBtn = document.getElementById('restartBtn');
        
        this.setupEventListeners();
        this.generateInitialLevel();
        this.gameLoop();
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.restartBtn.addEventListener('click', () => this.restartGame());
    }
    
    startGame() {
        this.gameRunning = true;
        this.startScreen.style.display = 'none';
        this.gameOverScreen.style.display = 'none';
        this.resetGame();
    }
    
    restartGame() {
        this.gameOverScreen.style.display = 'none';
        this.resetGame();
    }
    
    resetGame() {
        this.score = 0;
        this.lives = 3;
        this.zombieCount = 3;
        this.gameSpeed = 2;
        this.cameraX = 0;
        this.zombies = [];
        this.people = [];
        this.objects = [];
        this.powerUps = [];
        this.particles = [];
        this.ninjaMode = false;
        this.tsunamiMode = false;
        this.tsunamiHeight = 0;
        this.generateInitialLevel();
        this.updateUI();
    }
    
    generateInitialLevel() {
        // Generate initial zombies (start with 3)
        this.zombies = [];
        for (let i = 0; i < 3; i++) {
            this.zombies.push({
                x: 100 + i * 40,
                y: this.groundY - 40,
                width: 25,
                height: 40,
                speed: 3,
                type: 'normal',
                velocityY: 0,
                onGround: true
            });
        }
        
        // Generate people
        this.people = [];
        for (let i = 0; i < 5; i++) {
            this.people.push({
                x: 300 + i * 200 + Math.random() * 100,
                y: this.groundY - 45,
                width: 30,
                height: 50,
                running: false,
                direction: Math.random() < 0.5 ? 1 : -1
            });
        }
        
        // Generate destructible objects
        this.objects = [];
        for (let i = 0; i < 3; i++) {
            this.objects.push({
                x: 400 + i * 300 + Math.random() * 150,
                y: this.groundY - 60,
                width: 80,
                height: 40,
                health: 4,
                maxHealth: 4,
                type: 'car'
            });
        }
        
        // Generate power-up boxes
        this.powerUps = [];
        for (let i = 0; i < 2; i++) {
            this.powerUps.push({
                x: 600 + i * 400 + Math.random() * 200,
                y: this.groundY - 50,
                width: 40,
                height: 40,
                type: 'box'
            });
        }
    }
    
    update() {
        if (!this.gameRunning) return;
        
        this.handleInput();
        this.updateZombies();
        this.updatePeople();
        this.updateObjects();
        this.updatePowerUps();
        this.updateParticles();
        this.checkCollisions();
        this.spawnNewElements();
        this.updateCamera();
        this.updateScore();
    }
    
    handleInput() {
        // Only jumping is allowed - no horizontal movement
        this.zombies.forEach(zombie => {
            if ((this.keys['ArrowUp'] || this.keys['KeyW'] || this.keys['Space']) && zombie.onGround) {
                zombie.velocityY = -15;
                zombie.onGround = false;
            }
        });
    }
    
    updateZombies() {
        this.zombies.forEach((zombie, index) => {
            // Apply gravity
            zombie.velocityY += 0.8;
            
            // Update position
            zombie.y += zombie.velocityY;
            
            // Ground collision
            if (zombie.y > this.groundY - zombie.height) {
                zombie.y = this.groundY - zombie.height;
                zombie.velocityY = 0;
                zombie.onGround = true;
            }
            
            // Move zombies with the map (they move with the camera)
            zombie.x += this.gameSpeed;
            
            // Remove zombies that are too far behind
            if (zombie.x < this.cameraX - 100) {
                this.zombies.splice(index, 1);
                this.zombieCount--;
            }
        });
    }
    
    updatePeople() {
        this.people.forEach((person, index) => {
            // People run away from zombies
            const nearestZombie = this.findNearestZombie(person.x, person.y);
            if (nearestZombie) {
                const distance = Math.abs(person.x - nearestZombie.x);
                if (distance < 150) {
                    person.running = true;
                    person.direction = person.x > nearestZombie.x ? 1 : -1;
                }
            }
            
            // Move people
            if (person.running) {
                person.x += person.direction * 3;
            }
            
            // Remove people that are too far behind
            if (person.x < this.cameraX - 200) {
                this.people.splice(index, 1);
            }
        });
    }
    
    updateObjects() {
        // Objects don't move, just check for destruction
    }
    
    updatePowerUps() {
        // Power-up boxes don't move
    }
    
    updateParticles() {
        this.particles.forEach((particle, index) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.5; // Gravity
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(index, 1);
            }
        });
    }
    
    updateCamera() {
        // Camera continuously moves right
        this.cameraX += this.gameSpeed;
    }
    
    findNearestZombie(x, y) {
        let nearest = null;
        let minDistance = Infinity;
        
        this.zombies.forEach(zombie => {
            const distance = Math.sqrt((x - zombie.x) ** 2 + (y - zombie.y) ** 2);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = zombie;
            }
        });
        
        return nearest;
    }
    
    checkCollisions() {
        // Zombie-Person collisions (convert people to zombies)
        this.people.forEach((person, personIndex) => {
            this.zombies.forEach(zombie => {
                if (this.checkCollision(zombie, person)) {
                    // Convert person to zombie
                    this.zombies.push({
                        x: this.zombies[this.zombies.length - 1].x + 40, // Add to the end of the horde
                        y: this.groundY - 40,
                        width: 25,
                        height: 40,
                        speed: 3,
                        type: 'normal',
                        velocityY: 0,
                        onGround: true
                    });
                    this.zombieCount++;
                    this.createParticles(person.x, person.y, '#00ff00');
                    this.people.splice(personIndex, 1);
                    this.score += 50;
                }
            });
        });
        
        // Zombie-Object collisions (destroy objects)
        this.objects.forEach((object, objectIndex) => {
            let zombiesOnObject = 0;
            
            this.zombies.forEach(zombie => {
                if (this.checkCollision(zombie, object)) {
                    zombiesOnObject++;
                    // Reduce object health
                    object.health = Math.max(0, object.health - 0.1);
                }
            });
            
            if (object.health <= 0) {
                // Object destroyed
                this.createParticles(object.x + object.width/2, object.y + object.height/2, '#ff6600');
                this.objects.splice(objectIndex, 1);
                this.score += 100;
            }
        });
        
        // Zombie-PowerUp collisions
        this.powerUps.forEach((powerUp, index) => {
            this.zombies.forEach(zombie => {
                if (this.checkCollision(zombie, powerUp)) {
                    this.applyPowerUp();
                    this.createParticles(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2, '#ffff00');
                    this.powerUps.splice(index, 1);
                }
            });
        });
        
        // Tsunami mode collisions
        if (this.tsunamiMode) {
            this.checkTsunamiCollisions();
        }
    }
    
    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
    
    checkTsunamiCollisions() {
        const tsunamiX = this.zombies[0].x - 100; // Use first zombie position for tsunami
        const tsunamiY = this.groundY - this.tsunamiHeight;
        const tsunamiWidth = 200;
        const tsunamiHeight = this.tsunamiHeight;
        
        // Destroy objects hit by tsunami
        this.objects.forEach((object, index) => {
            if (tsunamiX < object.x + object.width &&
                tsunamiX + tsunamiWidth > object.x &&
                tsunamiY < object.y + object.height &&
                tsunamiY + tsunamiHeight > object.y) {
                this.createParticles(object.x + object.width/2, object.y + object.height/2, '#ff6600');
                this.objects.splice(index, 1);
                this.score += 200;
            }
        });
        
        // Convert people hit by tsunami
        this.people.forEach((person, index) => {
            if (tsunamiX < person.x + person.width &&
                tsunamiX + tsunamiWidth > person.x &&
                tsunamiY < person.y + person.height &&
                tsunamiY + tsunamiHeight > person.y) {
                this.zombies.push({
                    x: this.zombies[this.zombies.length - 1].x + 40, // Add to the end of the horde
                    y: this.groundY - 40,
                    width: 25,
                    height: 40,
                    speed: 3,
                    type: 'normal',
                    velocityY: 0,
                    onGround: true
                });
                this.zombieCount++;
                this.createParticles(person.x, person.y, '#00ff00');
                this.people.splice(index, 1);
                this.score += 100;
            }
        });
    }
    
    applyPowerUp() {
        const powerUps = ['ninja', 'tsunami', 'magnet'];
        const selected = powerUps[Math.floor(Math.random() * powerUps.length)];
        
        switch(selected) {
            case 'ninja':
                this.ninjaMode = true;
                setTimeout(() => this.ninjaMode = false, 10000); // 10 seconds
                break;
            case 'tsunami':
                this.tsunamiMode = true;
                this.tsunamiHeight = 50;
                setTimeout(() => this.tsunamiMode = false, 8000); // 8 seconds
                break;
            case 'magnet':
                // Attract nearby people to the first zombie
                if (this.zombies.length > 0) {
                    this.people.forEach(person => {
                        const dx = this.zombies[0].x - person.x;
                        person.x += dx * 0.1;
                    });
                }
                break;
        }
    }
    
    spawnNewElements() {
        // Spawn new people
        if (Math.random() < 0.01) {
            this.people.push({
                x: this.cameraX + this.width + Math.random() * 100,
                y: this.groundY - 45,
                width: 30,
                height: 50,
                running: false,
                direction: -1
            });
        }
        
        // Spawn new objects
        if (Math.random() < 0.005) {
            this.objects.push({
                x: this.cameraX + this.width + Math.random() * 100,
                y: this.groundY - 60,
                width: 80,
                height: 40,
                health: 4,
                maxHealth: 4,
                type: 'car'
            });
        }
        
        // Spawn new power-ups
        if (Math.random() < 0.003) {
            this.powerUps.push({
                x: this.cameraX + this.width + Math.random() * 100,
                y: this.groundY - 50,
                width: 40,
                height: 40,
                type: 'box'
            });
        }
    }
    
    updateScore() {
        this.score += this.gameSpeed;
        this.updateUI();
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('zombie-count').textContent = this.zombieCount;
        document.getElementById('lives').textContent = this.lives;
    }
    
    gameOver() {
        this.gameRunning = false;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalHorde').textContent = this.zombieCount;
        this.gameOverScreen.style.display = 'block';
    }
    
    createParticles(x, y, color) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 30,
                color: color
            });
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Save context for camera transformation
        this.ctx.save();
        this.ctx.translate(-this.cameraX, 0);
        
        // Draw background
        this.drawBackground();
        
        // Draw objects
        this.drawObjects();
        
        // Draw power-ups
        this.drawPowerUps();
        
        // Draw people
        this.drawPeople();
        
        // Draw zombies
        this.drawZombies();
        
        // Draw tsunami effect
        if (this.tsunamiMode) {
            this.drawTsunami();
        }
        
        // Draw particles
        this.drawParticles();
        
        // Restore context
        this.ctx.restore();
        
        // Draw power-up indicators (not affected by camera)
        this.drawPowerUpIndicators();
    }
    
    drawBackground() {
        // Sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98FB98');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(this.cameraX, 0, this.width * 2, this.height);
        
        // Ground
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(this.cameraX, this.groundY, this.width * 2, this.height - this.groundY);
    }
    
    drawObjects() {
        this.objects.forEach(object => {
            // Object background
            this.ctx.fillStyle = '#444444';
            this.ctx.fillRect(object.x, object.y, object.width, object.height);
            
            // Health bar
            const healthPercent = object.health / object.maxHealth;
            this.ctx.fillStyle = '#ff0000';
            this.ctx.fillRect(object.x, object.y - 10, object.width, 5);
            this.ctx.fillStyle = '#00ff00';
            this.ctx.fillRect(object.x, object.y - 10, object.width * healthPercent, 5);
            
            // Object type indicator
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(Math.ceil(object.health).toString(), 
                            object.x + object.width/2, 
                            object.y + object.height/2 + 4);
        });
    }
    
    drawPowerUps() {
        this.powerUps.forEach(powerUp => {
            // Power-up box
            this.ctx.fillStyle = '#ffaa00';
            this.ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
            
            // Question marks
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('?', 
                            powerUp.x + powerUp.width/2, 
                            powerUp.y + powerUp.height/2 + 7);
        });
    }
    
    drawPeople() {
        this.people.forEach(person => {
            // Person body
            this.ctx.fillStyle = person.running ? '#ff6b6b' : '#ffb6c1';
            this.ctx.fillRect(person.x, person.y, person.width, person.height);
            
            // Person head
            this.ctx.fillStyle = '#ffdbac';
            this.ctx.fillRect(person.x + 5, person.y - 15, 20, 20);
            
            // Eyes
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(person.x + 8, person.y - 10, 3, 3);
            this.ctx.fillRect(person.x + 17, person.y - 10, 3, 3);
        });
    }
    
    drawZombies() {
        this.zombies.forEach(zombie => {
            // Zombie body
            this.ctx.fillStyle = zombie.type === 'ninja' ? '#000000' : '#228B22';
            this.ctx.fillRect(zombie.x, zombie.y, zombie.width, zombie.height);
            
            // Zombie head
            this.ctx.fillStyle = zombie.type === 'ninja' ? '#333333' : '#32CD32';
            this.ctx.fillRect(zombie.x + 5, zombie.y - 15, 15, 15);
            
            // Eyes
            this.ctx.fillStyle = '#ff0000';
            this.ctx.fillRect(zombie.x + 7, zombie.y - 10, 3, 3);
            this.ctx.fillRect(zombie.x + 12, zombie.y - 10, 3, 3);
        });
    }
    
    drawTsunami() {
        if (this.zombies.length === 0) return;
        
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.tsunamiHeight);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 100, 255, 0.6)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(this.zombies[0].x - 100, this.groundY - this.tsunamiHeight, 200, this.tsunamiHeight);
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life / 30;
            this.ctx.fillRect(particle.x, particle.y, 3, 3);
        });
        this.ctx.globalAlpha = 1;
    }
    
    drawPowerUpIndicators() {
        if (this.ninjaMode) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(10, 80, 200, 30);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '16px Arial';
            this.ctx.fillText('NINJA MODE ACTIVE!', 20, 100);
        }
        
        if (this.tsunamiMode) {
            this.ctx.fillStyle = 'rgba(0, 255, 255, 0.7)';
            this.ctx.fillRect(10, 80, 200, 30);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '16px Arial';
            this.ctx.fillText('TSUNAMI MODE ACTIVE!', 20, 100);
        }
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new ZombieTsunami();
}); 