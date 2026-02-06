const Utils = {
    // Get random integer between min and max (inclusive)
    randomInt: (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // Get random float
    randomFloat: (min, max) => {
        return Math.random() * (max - min) + min;
    },

    // AABB Collision detection
    checkCollision: (rect1, rect2) => {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    },

    // Check if player is falling onto a platform (one-way platform collision)
    checkPlatformCollision: (player, platform) => {
        // Only collide if player is falling
        if (player.vy < 0) return false;

        // Enhanced box collision with wider tolerance (0-100% width)
        // Allowing a small buffer (5px) on edges to prevent "slipping"
        const buffer = 5;
        const isCollidingX = 
            player.x + player.width > platform.x - buffer &&
            player.x < platform.x + platform.width + buffer;

        const isCollidingY = 
            player.y + player.height > platform.y &&
            player.y + player.height < platform.y + platform.height + player.vy + 2; // +2 tolerance

        return isCollidingX && isCollidingY;
    }
};
