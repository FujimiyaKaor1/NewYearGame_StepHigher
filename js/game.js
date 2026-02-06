class Firework {
    constructor(w, h) {
        this.w = w;
        this.h = h;
        this.reset();
    }

    reset() {
        this.x = Math.random() * this.w;
        this.y = this.h;
        this.tx = Math.random() * this.w;
        this.ty = Math.random() * (this.h * 0.5);
        this.vx = (this.tx - this.x) / 60;
        this.vy = (this.ty - this.y) / 60;
        this.life = 60;
        this.exploded = false;
        this.particles = [];
        this.color = Math.random() > 0.5 ? '#FF0055' : '#FFD700';
    }

    update() {
        if (!this.exploded) {
            this.x += this.vx;
            this.y += this.vy;
            this.life--;
            if (this.life <= 0) {
                this.explode();
            }
        } else {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.05; // gravity
                p.life -= 0.02;
                if (p.life <= 0) this.particles.splice(i, 1);
            }
            if (this.particles.length === 0) this.reset();
        }
    }

    explode() {
        this.exploded = true;
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3;
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: this.color
            });
        }
    }

    draw(ctx) {
        if (!this.exploded) {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, 3, 3);
        } else {
            for (const p of this.particles) {
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.audio = new AudioController();
        
        // Performance & Quality Settings
        this.dpr = window.devicePixelRatio || 1;
        // Downgrade DPR for very high density screens to save battery/perf
        if (this.dpr > 2.5) this.dpr = 2; 
        
        // FPS Monitoring
        this.lastTime = 0;
        this.frameCount = 0;
        this.fps = 60;
        this.lastFpsUpdate = 0;
        this.lowFpsFrames = 0; // Counter for consecutive low fps frames

        // Initialize Assets with DPR
        Assets.init(this.dpr);

        // Game State
        this.state = 'start'; // start, playing, gameover, win, win_prompt
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('skyward_high_score')) || 0;
        this.isTutorial = !localStorage.getItem('skyward_tutorial_done');
        this.isEndless = false;
        this.debugMode = false; // Toggle with 'D' key
        this.BOUNDARY_MARGIN = 20; // Safety distance
        
        // Secrets State
        this.triggeredTargets = new Set();

        // Physics Constants (Refined for slower pace, higher jumps)
        this.gravity = 0.25; // Was 0.4
        this.jumpForce = -14; // Was -10 (Increased by 40%)
        this.moveSpeed = 6; 
        
        // Entities
        this.player = {
            x: 0, y: 0, width: 60, height: 60,
            vx: 0, vy: 0,
            direction: 1
        };
        
        this.platforms = [];
        this.items = [];
        this.particles = [];
        this.fireworks = []; // Menu Fireworks
        
        // Input
        this.input = { left: false, right: false };
        this.lastTouchX = null;

        // Viewport
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        // Bindings
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.setupInput();
        
        // Loop
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        // Handle High DPI with Pixel Perfection
        const realWidth = Math.floor(this.width * this.dpr);
        const realHeight = Math.floor(this.height * this.dpr);
        
        // Only update if dimensions changed to avoid flicker
        if (this.canvas.width !== realWidth || this.canvas.height !== realHeight) {
            this.canvas.width = realWidth;
            this.canvas.height = realHeight;
            this.canvas.style.width = `${this.width}px`;
            this.canvas.style.height = `${this.height}px`;
            
            // Re-apply scale because resizing canvas resets context
            this.ctx.scale(this.dpr, this.dpr);
            
            // Re-init assets if DPR changed significantly (adaptive)
            // But usually just re-scaling context is enough if Assets are already init
        }

        // Responsive Physics
        if (this.width < 600) {
            this.moveSpeed = 5;
            this.player.width = 50;
            this.player.height = 50;
        } else {
            this.moveSpeed = 7;
            this.player.width = 60;
            this.player.height = 60;
        }

        // Init fireworks
        if (this.fireworks.length === 0) {
             for(let i=0; i<3; i++) this.fireworks.push(new Firework(this.width, this.height));
        } else {
            // Update firework bounds
            this.fireworks.forEach(fw => {
                fw.w = this.width;
                fw.h = this.height;
            });
        }
    }

    setupInput() {
        // Mouse/Touch
        const handleStart = (x) => {
            this.lastTouchX = x;
        };
        
        const handleMove = (x) => {
            if (this.state !== 'playing') return;
            if (this.lastTouchX !== null) {
                const delta = x - this.lastTouchX;
                // Simple tilt control
                if (delta > 5) {
                    this.input.right = true;
                    this.input.left = false;
                } else if (delta < -5) {
                    this.input.left = true;
                    this.input.right = false;
                } else {
                    this.input.left = false;
                    this.input.right = false;
                }
                this.lastTouchX = x;
            }
        };

        const handleEnd = () => {
            this.lastTouchX = null;
            this.input.left = false;
            this.input.right = false;
        };

        // Touch
        this.canvas.addEventListener('touchstart', e => {
            e.preventDefault();
            handleStart(e.touches[0].clientX);
        }, {passive: false});
        
        this.canvas.addEventListener('touchmove', e => {
            e.preventDefault();
            handleMove(e.touches[0].clientX);
        }, {passive: false});
        
        this.canvas.addEventListener('touchend', handleEnd);

        // Mouse
        this.canvas.addEventListener('mousedown', e => handleStart(e.clientX));
        this.canvas.addEventListener('mousemove', e => {
            if (e.buttons === 1) handleMove(e.clientX);
        });
        this.canvas.addEventListener('mouseup', handleEnd);
    }

    start() {
        this.state = 'playing';
        this.score = 0;
        this.triggeredTargets = new Set();
        this.platforms = [];
        this.items = [];
        this.particles = [];
        this.isEndless = false;

        // Reset UI
        document.getElementById('endless-badge').classList.add('hidden');
        document.querySelector('.highscore-small').classList.add('hidden');
        
        // Initial setup
        this.player.x = this.width / 2 - this.player.width / 2;
        this.player.y = this.height - 200;
        this.player.vx = 0;
        this.player.vy = this.jumpForce;
        
        // Starting Platform
        this.platforms.push({
            x: this.width / 2 - 60,
            y: this.height - 50,
            width: 120,
            height: 20,
            type: 'normal'
        });

        if (this.isTutorial) {
            // Fixed tutorial ladder
            const startX = this.width / 2 - 60;
            const startY = this.height - 50;
            const stepY = 180; // Increased spacing for higher jumps
            // Left, Right, Left, Right pattern
            this.platforms.push({ x: startX - 80, y: startY - stepY, width: 120, height: 20, type: 'normal' });
            this.platforms.push({ x: startX + 80, y: startY - stepY * 2, width: 120, height: 20, type: 'normal' });
            this.platforms.push({ x: startX - 80, y: startY - stepY * 3, width: 120, height: 20, type: 'normal' });
            this.platforms.push({ x: startX + 80, y: startY - stepY * 4, width: 120, height: 20, type: 'normal' });
            
            // Generate more above
            let currentY = startY - stepY * 4;
            for (let i = 0; i < 5; i++) {
                currentY -= Utils.randomInt(150, 180);
                this.generatePlatform(currentY);
            }
        } else {
            // Standard generation
            let currentY = this.height - 150;
            for (let i = 0; i < 10; i++) {
                currentY -= Utils.randomInt(140, 180); // Increased from 80-120
                this.generatePlatform(currentY);
            }
        }

        // Hide UI
        document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('hud').classList.add('active');
        
        this.audio.playCollect();
    }

    generatePlatform(y) {
        // Difficulty scaling (Dynamic Difficulty Adjustment)
        // Endless Mode: Difficulty cycles every 10000 points
        let effectiveScore = this.score;
        if (this.isEndless) {
             effectiveScore = (this.score - 10000) % 10000;
        }

        let minWidth = 90, maxWidth = 120;
        let movingChance = 0;
        let breakChance = 0;

        if (effectiveScore > 3000) {
            // Hard
            minWidth = 60; maxWidth = 90;
            movingChance = 0.04; 
            breakChance = 0.1;
        } else if (effectiveScore > 1000) {
            // Medium
            minWidth = 70; maxWidth = 100;
            movingChance = 0.03; 
            breakChance = 0;
        }

        const width = Utils.randomInt(minWidth, maxWidth);
        
        // --- Improved X Generation Logic ---
        const SAFE_JUMP_DIST = 180;
        let x;
        let originalX = null;
        let wasCorrected = false;
        
        const lastPlatform = this.platforms[this.platforms.length - 1];
        if (lastPlatform) {
            const lastCenter = lastPlatform.x + lastPlatform.width / 2;
            const minCenter = lastCenter - SAFE_JUMP_DIST;
            const maxCenter = lastCenter + SAFE_JUMP_DIST;
            let newCenter = Utils.randomInt(minCenter, maxCenter);
            
            // Handle Screen Wrapping
            if (newCenter < 0) {
                newCenter += this.width;
            } else if (newCenter > this.width) {
                newCenter -= this.width;
            }
            
            x = newCenter - width / 2;
            originalX = x;
            
            // 5. Strict Boundary Enforcement (Safety Distance)
            if (x < this.BOUNDARY_MARGIN) {
                x = this.BOUNDARY_MARGIN;
                wasCorrected = true;
            } else if (x + width > this.width - this.BOUNDARY_MARGIN) {
                x = this.width - this.BOUNDARY_MARGIN - width;
                wasCorrected = true;
            }
            
        } else {
            // Fallback for first platform
            x = Utils.randomInt(this.BOUNDARY_MARGIN, this.width - width - this.BOUNDARY_MARGIN);
        }
        
        const typeRoll = Math.random();
        let type = 'normal';
        
        if (typeRoll < movingChance) type = 'moving';
        else if (typeRoll < movingChance + breakChance) type = 'breakable';

        const platform = { x, y, width, height: 20, type, dx: 2 + (this.score/5000) };
        if (wasCorrected) {
            platform.isViolation = true;
            platform.originalX = originalX;
        }
        this.platforms.push(platform);

        // Chance to spawn item
        // Increased spawn rate: > 0.77 means 23% chance
        if (Math.random() > 0.77) {
            const itemType = Math.random() > 0.85 ? 'rocket' : 'coin';
            this.items.push({
                x: x + width/2 - (itemType === 'rocket' ? 10 : 15),
                y: y - (itemType === 'rocket' ? 50 : 35),
                width: itemType === 'rocket' ? 20 : 30,
                height: itemType === 'rocket' ? 40 : 30,
                type: itemType
            });
        }
    }

    update() {
        // FPS Calc
        const now = performance.now();
        
        if (now - this.lastFpsUpdate > 1000) {
            this.fps = Math.round(this.frameCount * 1000 / (now - this.lastFpsUpdate));
            this.frameCount = 0;
            this.lastFpsUpdate = now;
            
            // Adaptive Quality
            if (this.fps < 30) {
                this.lowFpsFrames++;
                if (this.lowFpsFrames > 3 && this.dpr > 1) {
                    console.log('Downgrading Quality due to low FPS');
                    this.dpr = 1;
                    // Force resize to apply new DPR
                    this.canvas.width = 0; 
                    this.resize(); 
                    Assets.init(1); // Re-init assets with new DPR
                    this.lowFpsFrames = 0;
                }
            } else {
                this.lowFpsFrames = 0;
            }
        }
        this.frameCount++;

        // Always update fireworks if in menu or win state
        if (this.state === 'start' || this.state === 'gameover' || this.state === 'win' || this.state === 'win_prompt') {
            this.fireworks.forEach(fw => fw.update());
        }

        if (this.state !== 'playing') return;

        // New: Repeated-digit easter egg & score cap (Threshold Logic)
        // Check for 1111, 2222, ..., 9999
        for (let digit = 1; digit <= 9; digit++) {
            const target = digit * 1111;
            // Strict inequality > ensures we trigger even if we skip the exact number
            // But we must NOT trigger if score == target (as per strict requirement)
            if (this.score > target && !this.triggeredTargets.has(target)) {
                this.triggeredTargets.add(target);
                this.showIdiomBanner(digit);
                this.audio.playCelebration(digit);
            }
        }

        // Check for Game End at 10000 (Only if NOT endless)
        if (!this.isEndless && this.score > 10000 && !this.triggeredTargets.has(10000)) {
            this.triggeredTargets.add(10000);
            this.startNewYearOverlay();
            return;
        }

        // Real-time Highscore Update in Endless Mode
        if (this.isEndless) {
             if (this.score > this.highScore) {
                 this.highScore = this.score;
                 document.getElementById('hud-highscore').innerText = Math.floor(this.highScore);
                 // Save periodically or on game over? Saving here might be too frequent if writing to disk, 
                 // but localStorage is fast enough for per-frame if needed, or throttle it.
                 // Let's just update display here and save on GameOver/Exit.
             }
        }
 
        // Tutorial Logic
        if (this.isTutorial && this.score > 200) {
            this.isTutorial = false;
            localStorage.setItem('skyward_tutorial_done', 'true');
        }

        // Player Movement
        if (this.input.left) {
            this.player.vx = -this.moveSpeed;
            this.player.direction = -1;
        } else if (this.input.right) {
            this.player.vx = this.moveSpeed;
            this.player.direction = 1;
        } else {
            this.player.vx *= 0.9; // Friction
        }

        this.player.x += this.player.vx;
        this.player.y += this.player.vy;
        this.player.vy += this.gravity;

        // Screen Wrapping
        if (this.player.x > this.width) this.player.x = -this.player.width;
        if (this.player.x < -this.player.width) this.player.x = this.width;

        // Camera Scroll (Move world down)
        if (this.player.y < this.height * 0.4) {
            const diff = this.height * 0.4 - this.player.y;
            this.player.y = this.height * 0.4;
            
            // Move everything down
            this.platforms.forEach(p => p.y += diff);
            this.items.forEach(i => i.y += diff);
            this.particles.forEach(p => p.y += diff);
            
            this.score += Math.floor(diff);
            document.querySelector('.score-display').innerText = this.score;

            // Generate new platforms
            const highestPlatform = this.platforms[this.platforms.length - 1];
            if (highestPlatform && highestPlatform.y > 100) {
                this.generatePlatform(highestPlatform.y - Utils.randomInt(140, 180));
            }
        }

        // Platform Collision
        this.platforms.forEach(p => {
            // Move moving platforms
            if (p.type === 'moving') {
                p.x += p.dx;
                if (p.x < 0 || p.x + p.width > this.width) p.dx *= -1;
            }

            if (Utils.checkPlatformCollision(this.player, p)) {
                if (p.type === 'breakable') {
                    // Break logic: Now reusable!
                    this.player.vy = this.jumpForce;
                    // p.y = this.height + 100; // REMOVED: Do not destroy platform
                    if (this.dpr > 1) this.createParticles(p.x + p.width/2, p.y, 'brown');
                } else {
                    this.player.vy = this.jumpForce;
                    this.audio.playJump();
                    if (this.dpr > 1) this.createParticles(this.player.x + this.player.width/2, this.player.y + this.player.height, 'white');
                }
                
                // Stabilization: Dampen horizontal velocity on landing to help player stay on platform
                // unless they are actively pressing keys
                if (!this.input.left && !this.input.right) {
                    this.player.vx *= 0.5;
                }
            }
        });

        // Item Collision
        this.items.forEach((item, index) => {
            if (Utils.checkCollision(this.player, item)) {
                if (item.type === 'rocket') {
                    this.player.vy = -30; // Super jump
                    this.audio.playRocket();
                } else {
                    this.score += 100;
                    this.audio.playCollect();
                }
                if (this.dpr > 1) this.createParticles(item.x, item.y, 'gold');
                this.items.splice(index, 1);
            }
        });

        // Cleanup
        this.platforms = this.platforms.filter(p => p.y < this.height);
        this.items = this.items.filter(i => i.y < this.height);

        // Game Over
        if (this.player.y > this.height) {
            this.gameOver();
        }

        // Update Particles
        this.particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.05;
            if (p.life <= 0) this.particles.splice(i, 1);
        });
    }

    showIdiomBanner(digit) {
        const map = {
            1: "一马当先",
            2: "二龙腾飞",
            3: "三阳开泰",
            4: "四季平安",
            5: "五福临门",
            6: "六六大顺",
            7: "七星高照",
            8: "八方来财",
            9: "九九同心"
        };
        const banner = document.getElementById('easter-egg-banner');
        const text = document.getElementById('banner-text');
        text.innerText = map[digit] || "新春大吉";
        text.style.color = digit >= 6 ? "#FF0055" : "#FFD700";
        // Decorative aura
        this.createAura(this.player.x + this.player.width/2, this.player.y + this.player.height/2, digit >= 6 ? 'red' : 'gold');
        banner.classList.remove('hidden');
        banner.classList.add('active');
        setTimeout(() => {
            banner.classList.remove('active');
            banner.classList.add('hidden');
        }, 3000);
    }

    startNewYearOverlay() {
        this.state = 'win_prompt'; // Use a specific state to stop updates but keep rendering fireworks
        this.audio.playGameOver();
        // More fireworks
        for (let i = 0; i < 12; i++) this.fireworks.push(new Firework(this.width, this.height));
        // Show overlay
        document.getElementById('hud').classList.remove('active');
        document.getElementById('hud').classList.add('hidden');
        const overlay = document.getElementById('newyear-overlay');
        const title = document.getElementById('ny-title');
        const sub = document.getElementById('ny-sub');
        title.innerText = "新年快乐";
        sub.innerText = "恭喜发财";
        overlay.classList.remove('hidden');
        overlay.classList.add('active');
        
        // Setup focus for keyboard accessibility if needed
        setTimeout(() => {
             document.getElementById('ny-continue-btn').focus();
        }, 100);

        // Save high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('skyward_high_score', this.highScore);
        }
    }

    continueEndless() {
        try {
            console.log("Switching to Endless Mode...");
            this.state = 'playing';
            this.isEndless = true;
            
            // UI Updates
            const overlay = document.getElementById('newyear-overlay');
            overlay.classList.remove('active');
            overlay.classList.add('hidden');
            
            document.getElementById('hud').classList.remove('hidden');
            document.getElementById('hud').classList.add('active');
            
            // Show Endless Badge & Highscore
            document.getElementById('endless-badge').classList.remove('hidden');
            document.querySelector('.highscore-small').classList.remove('hidden');
            document.getElementById('hud-highscore').innerText = Math.floor(this.highScore);
            
            // Record First Time
            if (!localStorage.getItem('skyward_endless_first_time')) {
                localStorage.setItem('skyward_endless_first_time', 'true');
                // Maybe show a quick toast/message?
            }
            
            // Note: We do NOT reset score or platforms. 
            // The generatePlatform logic will now handle difficulty cycling.
            
        } catch (e) {
            console.error("Failed to switch to Endless Mode:", e);
            alert("模式切换失败，请重试");
            this.state = 'win_prompt'; // Revert state
        }
    }

    createAura(x, y, color) {
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.5,
                color: color === 'gold' ? Assets.colors.gold : Assets.colors.red
            });
        }
    }

    createParticles(x, y, color) {
        // Limit max particles
        if (this.particles.length > 50) return; 
        
        // Trail Logic based on score
        let trailColor = color;
        if (this.score > 5000) trailColor = `hsl(${Math.random()*360}, 100%, 50%)`; // Rainbow
        else if (this.score > 3000) trailColor = Assets.colors.gold;
        else if (this.score > 1000) trailColor = 'white';

        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x, y,
                vx: Utils.randomFloat(-2, 2),
                vy: Utils.randomFloat(-2, 2),
                life: 1,
                color: trailColor === 'gold' ? Assets.colors.gold : (trailColor === 'white' ? '#FFF' : trailColor)
            });
        }
    }

    drawDebug() {
        if (!this.debugMode) return;
        
        const ctx = this.ctx;
        ctx.save();
        
        // Draw Boundary Lines
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        // Left Boundary
        ctx.beginPath();
        ctx.moveTo(this.BOUNDARY_MARGIN, 0);
        ctx.lineTo(this.BOUNDARY_MARGIN, this.height);
        ctx.stroke();
        
        // Right Boundary
        ctx.beginPath();
        ctx.moveTo(this.width - this.BOUNDARY_MARGIN, 0);
        ctx.lineTo(this.width - this.BOUNDARY_MARGIN, this.height);
        ctx.stroke();
        
        // Draw Violations (Ghost Platforms)
        this.platforms.forEach(p => {
            if (p.isViolation && p.originalX !== undefined) {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.fillRect(p.originalX, p.y, p.width, p.height);
                ctx.strokeStyle = 'red';
                ctx.strokeRect(p.originalX, p.y, p.width, p.height);
                
                // Draw arrow to corrected position
                ctx.beginPath();
                ctx.moveTo(p.originalX + p.width/2, p.y + p.height/2);
                ctx.lineTo(p.x + p.width/2, p.y + p.height/2);
                ctx.strokeStyle = 'yellow';
                ctx.setLineDash([]);
                ctx.stroke();
            }
        });
        
        ctx.restore();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw Fireworks (Background)
        if (this.state === 'start' || this.state === 'gameover') {
            this.fireworks.forEach(fw => fw.draw(this.ctx));
        }

        // Draw Background Lanterns (New)
        if (this.state === 'playing') {
            Assets.drawBackground(this.ctx, this.width, this.height, this.score);
        }

        // Draw Platforms
        this.platforms.forEach(p => Assets.drawPlatform(this.ctx, p.x, p.y, p.width, p.height, p.type));

        // Draw Items
        this.items.forEach(i => Assets.drawItem(this.ctx, i.x, i.y, i.width, i.height, i.type));

        // Draw Player
        if (this.state === 'playing') {
            Assets.drawPlayer(this.ctx, this.player.x, this.player.y, this.player.width, this.player.height, this.player.direction);
        }

        // Draw Particles
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        });

        // Draw Tutorial
        if (this.isTutorial && this.state === 'playing') {
            this.drawTutorial();
        }
        
        this.drawDebug();
    }

    drawTutorial() {
        const time = performance.now() / 500;
        const xOffset = Math.sin(time) * 30;
        const cx = this.width / 2;
        const cy = this.height / 2;

        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('左右滑动控制方向', cx, cy + 80);

        // Hand icon
        this.ctx.translate(cx + xOffset, cy);
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 20, 0, Math.PI*2);
        this.ctx.fill();
        this.ctx.restore();
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(this.loop);
    }

    gameOver() {
        this.state = 'gameover';
        this.audio.playGameOver();
        
        // Update High Score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('skyward_high_score', this.highScore);
        }

        // Show Game Over UI
        document.getElementById('hud').classList.remove('active');
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('game-over-screen').classList.add('active');
        
        document.getElementById('final-score').innerText = this.score;
        document.getElementById('best-score').innerText = this.highScore;
    }
}
