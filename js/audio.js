class AudioController {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true;
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.3; // Default volume
        
        // BGM State
        this.bgmOscillators = [];
        this.bgmPlaying = false;
        this.bgmTimer = null;
        this.bgmGain = this.ctx.createGain();
        this.bgmGain.connect(this.masterGain);
        this.bgmGain.gain.value = 0.2; // Lower volume for BGM

        // Ambient State
        this.ambientTimer = null;
    }

    resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        if (!this.bgmPlaying) {
            this.startBGM();
            this.startAmbient();
        }
    }

    startBGM() {
        this.bgmPlaying = true;
        // Pentatonic Scale (Chinese Folk Style)
        // G4, A4, C5, D5, E5 (Gong, Shang, Jiao, Zhi, Yu)
        const scale = [392.00, 440.00, 523.25, 587.33, 659.25];
        
        const playNote = () => {
            if (!this.bgmPlaying) return;
            
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            // Flute-like sound (Triangle wave with vibrato)
            osc.type = 'triangle'; 
            
            // Melody logic: Pick notes that sound good in sequence
            // Simple random walk
            const freq = scale[Math.floor(Math.random() * scale.length)];
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            
            // Envelope (Soft Attack, Sustained, Soft Release)
            gain.gain.setValueAtTime(0, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.1);
            gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.3);
            gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.6);
            
            osc.connect(gain);
            gain.connect(this.bgmGain);
            
            osc.start();
            osc.stop(this.ctx.currentTime + 0.6);
            
            // Rhythmic pattern: mainly 8th notes
            this.bgmTimer = setTimeout(playNote, 300 + Math.random() * 300);
        };
        
        playNote();
    }

    startAmbient() {
        // Firecracker sound every 3-8 seconds
        const playCracker = () => {
            if (!this.bgmPlaying) return;
            
            // Low pass noise
            const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 sec
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 500;
            
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
            
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.bgmGain); // Use BGM gain node
            
            noise.start();
            
            this.ambientTimer = setTimeout(playCracker, 3000 + Math.random() * 5000);
        };
        
        playCracker();
    }

    playCelebration(digit) {
        if (!this.enabled) return;
        this.resume();
        const noiseDuration = 0.2;
        const bufferSize = this.ctx.sampleRate * noiseDuration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 400 + (digit || 1) * 60;
        const gainN = this.ctx.createGain();
        gainN.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gainN.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + noiseDuration);
        noise.connect(filter);
        filter.connect(gainN);
        gainN.connect(this.masterGain);
        noise.start();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        const base = 660;
        osc.frequency.setValueAtTime(base + (digit || 1) * 20, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.4);
    }

    stopBGM() {
        this.bgmPlaying = false;
        if (this.bgmTimer) clearTimeout(this.bgmTimer);
        if (this.ambientTimer) clearTimeout(this.ambientTimer);
    }

    // Play a tone
    playTone(freq, type, duration) {
        if (!this.enabled) return;
        this.resume();
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playJump() {
        // "Boing" sound - refined
        if (!this.enabled) return;
        this.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(500, this.ctx.currentTime + 0.15); // Slower ramp
        
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    playLand() {
        // "Thud" sound
        this.playTone(150, 'sine', 0.05);
    }

    playCollect() {
        // "Ding" sound - Cyber style
        if (!this.enabled) return;
        this.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
        osc.frequency.setValueAtTime(1800, this.ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    playRocket() {
        // Noise
        if (!this.enabled) return;
        this.resume();
        // Noise buffer... simplifying to just a low rumble
        this.playTone(100, 'sawtooth', 0.5);
    }

    playGameOver() {
        if (!this.enabled) return;
        this.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + 0.8); // Slower
        
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.8);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.8);
    }
}
