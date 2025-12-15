/* 
  Hugging You - Immersive Experience Script
  Handles: Starfield, Shooting Stars, Parallax, Audio Player
*/

document.addEventListener('DOMContentLoaded', () => {
    // Canvas Setup
    const canvas = document.getElementById('starfield');
    const ctx = canvas.getContext('2d');
    let width, height;

    const stars = [];
    const shootingStars = [];
    
    // Resize Observer
    const resize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        initStars();
    };
    window.addEventListener('resize', resize);
    
    // Star Class
    class Star {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 1.5 + 0.5; // 0.5 to 2px
            this.baseAlpha = Math.random() * 0.6 + 0.2; // 0.2 to 0.8
            this.alpha = this.baseAlpha;
            this.twinkleSpeed = Math.random() * 0.02 + 0.005;
            this.twinkleDir = 1;
        }

        update() {
            this.alpha += this.twinkleSpeed * this.twinkleDir;
            if (this.alpha > this.baseAlpha + 0.2 || this.alpha < this.baseAlpha - 0.2) {
                this.twinkleDir *= -1;
            }
            // Clamp alpha
            this.alpha = Math.max(0, Math.min(1, this.alpha));
        }

        draw() {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Shooting Star Class
    class ShootingStar {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * (height * 0.5); // Start in top half
            this.length = Math.random() * 80 + 20;
            this.speed = Math.random() * 10 + 5;
            this.angle = Math.PI / 4; // Diagonal down-right approx
            this.opacity = 0;
            this.active = true;
            this.fadingIn = true;
            
            // Randomize direction slightly
            if (Math.random() < 0.5) {
               // Top-left to bottom-right
               this.vx = this.speed * Math.cos(this.angle);
               this.vy = this.speed * Math.sin(this.angle);
            } else {
               // Top-right to bottom-left
               this.x = Math.random() * width; // Re-roll x
               this.vx = -this.speed * Math.cos(this.angle);
               this.vy = this.speed * Math.sin(this.angle);
            }
        }

        update() {
            if (!this.active) return;

            this.x += this.vx;
            this.y += this.vy;

            // Fade in
            if (this.fadingIn) {
                this.opacity += 0.05;
                if (this.opacity >= 1) {
                    this.opacity = 1;
                    this.fadingIn = false;
                }
            } else {
                // Fade out near end of life or screen
                if (Math.random() < 0.05) { // Random chance to start dying
                    this.opacity -= 0.03;
                }
            }
            
            if (this.x < -100 || this.x > width + 100 || this.y > height + 100 || this.opacity <= 0) {
                this.active = false;
            }
        }

        draw() {
            if (!this.active) return;
            
            ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x - this.vx * (this.length / this.speed), this.y - this.vy * (this.length / this.speed));
            ctx.stroke();
            
            // Head glow
            ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initStars() {
        stars.length = 0;
        const starCount = Math.floor((width * height) / 2000); // Density
        for (let i = 0; i < starCount; i++) {
            stars.push(new Star());
        }
    }

    let nextSpawnTime = 0;

    const scheduleNextShootingStar = (currentTime) => {
        // 15 to 40 seconds
        const delay = Math.random() * 25000 + 15000;
        nextSpawnTime = currentTime + delay;
    };
    
    const animate = (timestamp) => {
        if (nextSpawnTime === 0) scheduleNextShootingStar(timestamp);

        ctx.clearRect(0, 0, width, height);

        // Draw static/twinkling stars
        stars.forEach(star => {
            star.update();
            star.draw();
        });

        // Handle Shooting Stars
        if (timestamp > nextSpawnTime) { 
            shootingStars.push(new ShootingStar());
            scheduleNextShootingStar(timestamp);
        }

        for (let i = shootingStars.length - 1; i >= 0; i--) {
            let s = shootingStars[i];
            s.update();
            s.draw();
            if (!s.active) {
                shootingStars.splice(i, 1);
            }
        }

        requestAnimationFrame(animate);
    };

    // Parallax
    const backgroundLayer = document.getElementById('background-layer');
    window.addEventListener('mousemove', (e) => {
        const x = (e.clientX / width - 0.5) * 20; // -10 to 10px
        const y = (e.clientY / height - 0.5) * 20;
        
        backgroundLayer.style.transform = `translate(${x}px, ${y}px)`;
        // Move stars slower for depth
        canvas.style.transform = `translate(${x * 0.5}px, ${y * 0.5}px)`;
    });

    // Audio Player Logic
    const audio = document.getElementById('audio-player');
    const playBtn = document.getElementById('play-pause');
    const iconPlay = playBtn.querySelector('.icon-play');
    const iconPause = playBtn.querySelector('.icon-pause');
    const progressBar = document.getElementById('progress-fill');
    const progressContainer = document.getElementById('progress-container');
    const currentTimeEl = document.querySelector('.current-time');
    const totalTimeEl = document.querySelector('.total-time');
    const playerContainer = document.querySelector('.glass-card');

    // Init
    resize();
    animate(0);

    // Play/Pause
    playBtn.addEventListener('click', () => {
        if (audio.paused) {
            audio.play();
            iconPlay.classList.add('hidden');
            iconPause.classList.remove('hidden');
            playerContainer.classList.add('playing');
        } else {
            audio.pause();
            iconPlay.classList.remove('hidden');
            iconPause.classList.add('hidden');
            playerContainer.classList.remove('playing');
        }
    });

    // Update Progress
    audio.addEventListener('timeupdate', () => {
        const { duration, currentTime } = audio;
        if (isNaN(duration)) return;
        
        const percent = (currentTime / duration) * 100;
        progressBar.style.width = `${percent}%`;

        // Update time text
        currentTimeEl.textContent = formatTime(currentTime);
    });

    // Set Duration
    audio.addEventListener('loadedmetadata', () => {
        totalTimeEl.textContent = formatTime(audio.duration);
    });

    // Click on progress bar
    progressContainer.addEventListener('click', (e) => {
        const width = progressContainer.clientWidth;
        const clickX = e.offsetX;
        const duration = audio.duration;
        audio.currentTime = (clickX / width) * duration;
    });

    // Format helper
    function formatTime(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    }
});
