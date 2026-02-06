const Assets = {
    // Cache
    cache: {},
    dpr: 1,

    // Colors (Cyberpunk 2026 Theme)
    colors: {
        red: '#FF0055', // Neon Red
        gold: '#FFD700', // Gold
        darkRed: '#550022',
        white: '#FFFFFF',
        purple: '#9D00FF', // Neon Purple
        bgGradientTop: '#1a0033',
        bgGradientBottom: '#330011'
    },

    init: (dpr) => {
        Assets.dpr = dpr || 1;
        Assets.cache = {};
        
        // Super-sampling factor for sharpness (2x)
        const scale = 2; 

        // Pre-render assets with scaled resolution
        // Player: Logic 60x60 -> Cache 120x120
        Assets.renderToCache('player', 60, 60, scale, (ctx, w, h) => Assets._drawPlayerRaw(ctx, w, h));
        Assets.renderToCache('cloud_normal', 120, 40, scale, (ctx, w, h) => Assets._drawPlatformRaw(ctx, w, h, 'normal'));
        Assets.renderToCache('cloud_moving', 120, 40, scale, (ctx, w, h) => Assets._drawPlatformRaw(ctx, w, h, 'moving'));
        Assets.renderToCache('cloud_breakable', 120, 40, scale, (ctx, w, h) => Assets._drawPlatformRaw(ctx, w, h, 'breakable'));
        Assets.renderToCache('item_coin', 40, 40, scale, (ctx, w, h) => Assets._drawItemRaw(ctx, w, h, 'coin'));
        Assets.renderToCache('item_rocket', 40, 60, scale, (ctx, w, h) => Assets._drawItemRaw(ctx, w, h, 'rocket'));
    },

    renderToCache: (key, width, height, scale, drawFn) => {
        const canvas = document.createElement('canvas');
        // Actual pixel size = logic size * dpr * supersample_scale
        const realScale = Assets.dpr * scale;
        canvas.width = Math.ceil(width * realScale);
        canvas.height = Math.ceil(height * realScale);
        const ctx = canvas.getContext('2d');
        
        // Scale context so drawing commands use logic coordinates (but scaled up)
        ctx.scale(realScale, realScale);
        
        drawFn(ctx, width, height);
        Assets.cache[key] = { canvas, width, height };
    },

    // Raw drawing functions (Internal)
    _drawPlayerRaw: (ctx, w, h) => {
        const x = 0, y = 0;
        ctx.translate(w/2, h/2);
        
        // Glow Effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#FF0055';

        // Body (Horse Shape)
        ctx.fillStyle = Assets.colors.red;
        
        // Main Body (Round Rect)
        ctx.beginPath();
        ctx.roundRect(-w*0.4, -h*0.3, w*0.8, h*0.6, 10);
        ctx.fill();

        // Head (Circle + Snout)
        ctx.beginPath();
        ctx.arc(w*0.1, -h*0.35, w*0.25, 0, Math.PI * 2);
        ctx.fill();
        
        // Ears
        ctx.beginPath();
        ctx.moveTo(w*0.05, -h*0.55);
        ctx.lineTo(w*0.15, -h*0.7);
        ctx.lineTo(w*0.25, -h*0.55);
        ctx.fill();

        // Mane (Hair)
        ctx.fillStyle = Assets.colors.gold;
        ctx.beginPath();
        ctx.arc(w*0.25, -h*0.3, w*0.1, 0, Math.PI * 2);
        ctx.fill();

        // Eye (Cyber Eye)
        ctx.fillStyle = '#00FFFF'; // Cyan
        ctx.shadowColor = '#00FFFF';
        ctx.beginPath();
        ctx.arc(w*0.15, -h*0.35, 3, 0, Math.PI * 2);
        ctx.fill();

        // Gold decoration (Glowing Text "Fu")
        ctx.shadowColor = Assets.colors.gold;
        ctx.shadowBlur = 5;
        ctx.fillStyle = Assets.colors.gold;
        ctx.font = `bold ${Math.floor(w/2.5)}px "Microsoft YaHei", "SimHei", Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('福', 0, 5);
        
        // Reset Shadow
        ctx.shadowBlur = 0;
    },

    drawBackground: (ctx, width, height, scrollY) => {
        // Draw floating lanterns based on scrollY
        const lanternSpacing = 300;
        const offsetY = scrollY % lanternSpacing;
        
        ctx.save();
        ctx.globalAlpha = 0.3;
        
        for (let i = -1; i < height / lanternSpacing + 1; i++) {
            const y = i * lanternSpacing + offsetY;
            // Left side
            Assets._drawLantern(ctx, 40, y);
            // Right side
            Assets._drawLantern(ctx, width - 40, y + 150);
        }
        
        ctx.restore();
    },

    _drawLantern: (ctx, x, y) => {
        ctx.fillStyle = Assets.colors.red;
        ctx.shadowBlur = 20;
        ctx.shadowColor = Assets.colors.red;
        
        // Lantern Body
        ctx.beginPath();
        ctx.ellipse(x, y, 20, 30, 0, 0, Math.PI*2);
        ctx.fill();
        
        // Gold rims
        ctx.fillStyle = Assets.colors.gold;
        ctx.fillRect(x - 10, y - 28, 20, 4);
        ctx.fillRect(x - 10, y + 24, 20, 4);
        
        // Tassel
        ctx.strokeStyle = Assets.colors.gold;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y + 28);
        ctx.lineTo(x, y + 50);
        ctx.stroke();
    },

    _drawPlatformRaw: (ctx, w, h, type) => {
        const x = 0, y = 0;
        if (type === 'normal') {
            // Neon Cloud
            ctx.shadowBlur = 10;
            ctx.shadowColor = Assets.colors.purple;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            
            ctx.beginPath();
            ctx.roundRect(x, y + h/2 - 5, w, 10, 5);
            ctx.fill();
            
            // Decorative circles
            ctx.beginPath();
            ctx.arc(x + w * 0.2, y + h/2, 15, 0, Math.PI * 2);
            ctx.arc(x + w * 0.5, y + h/2 - 5, 20, 0, Math.PI * 2);
            ctx.arc(x + w * 0.8, y + h/2, 15, 0, Math.PI * 2);
            ctx.fill();
            
            // Add "Fu" pattern on platform
            ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
            ctx.font = '12px Arial';
            ctx.fillText('福', x + w/2 - 6, y + h/2 + 4);
            
        } else if (type === 'moving') {
            // Cyan Tech Platform
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00FFFF';
            ctx.fillStyle = '#E0F7FA';
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, 10);
            ctx.fill();
            
            ctx.strokeStyle = '#00FFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + 5, y + h/2);
            ctx.lineTo(x + w - 5, y + h/2);
            ctx.stroke();

        } else if (type === 'breakable') {
            // Glitch/Dark Platform
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#FF0000';
            ctx.fillStyle = '#424242';
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, 5);
            ctx.fill();
            
            ctx.strokeStyle = '#FF5252';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + w*0.3, y);
            ctx.lineTo(x + w*0.7, y + h);
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
    },

    _drawItemRaw: (ctx, w, h, type) => {
        const x = 0, y = 0;
        ctx.translate(w/2, h/2);
        if (type === 'coin') {
            // Holographic Coin
            ctx.shadowBlur = 10;
            ctx.shadowColor = Assets.colors.gold;
            ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
            ctx.strokeStyle = '#FFFFFF';
            
            ctx.beginPath();
            ctx.arc(0, 0, w/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('¥', 0, 2);
            
        } else if (type === 'rocket') {
            // Cyber Rocket
            ctx.shadowBlur = 10;
            ctx.shadowColor = Assets.colors.red;
            
            ctx.fillStyle = Assets.colors.red;
            ctx.fillRect(-w/4, -h/2, w/2, h);
            
            ctx.fillStyle = '#00FFFF'; // Blue thruster
            ctx.fillRect(-w/4, h/2 - 5, w/2, 5);
            
            ctx.fillStyle = Assets.colors.gold;
            ctx.beginPath();
            ctx.moveTo(-w/4, -h/2);
            ctx.lineTo(0, -h/2 - 10);
            ctx.lineTo(w/4, -h/2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    },

    // Public draw methods using cache
    drawPlayer: (ctx, x, y, w, h, direction) => {
        const cache = Assets.cache['player'];
        if (cache) {
            ctx.save();
            ctx.translate(x + w/2, y + h/2);
            if (direction < 0) ctx.scale(-1, 1);
            // Draw centered
            ctx.drawImage(cache.canvas, -w/2, -h/2, w, h);
            ctx.restore();
        } else {
            // Fallback
            Assets._drawPlayerRaw(ctx, w, h);
        }
    },

    drawPlatform: (ctx, x, y, w, h, type) => {
        const key = `cloud_${type}`;
        const cache = Assets.cache[key];
        if (cache) {
            // Stretch if width differs significantly? 
            // For now, we assume standard sizes or stretch the image
            ctx.drawImage(cache.canvas, x, y, w, h);
        } else {
            Assets._drawPlatformRaw(ctx, w, h, type);
        }
    },

    drawItem: (ctx, x, y, w, h, type) => {
        const key = `item_${type}`;
        const cache = Assets.cache[key];
        if (cache) {
            ctx.drawImage(cache.canvas, x, y, w, h);
        } else {
            Assets._drawItemRaw(ctx, w, h, type);
        }
    }
};
