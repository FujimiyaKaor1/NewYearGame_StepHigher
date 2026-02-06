
const assert = require('assert');

// Mock Dependencies
class MockUtils {
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

global.Utils = MockUtils;

class MockGame {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.platforms = [];
        this.items = [];
        this.score = 0;
        this.isEndless = false;
        this.BOUNDARY_MARGIN = 20;
    }

    // Copying the relevant logic from js/game.js for testing
    // In a real module system we would import it, but here we duplicate for unit testing without browser DOM
    generatePlatform(y) {
        let effectiveScore = this.score;
        let minWidth = 90, maxWidth = 120;
        const width = Utils.randomInt(minWidth, maxWidth);
        
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
            
            // Wrapping simulation
            if (newCenter < 0) newCenter += this.width;
            else if (newCenter > this.width) newCenter -= this.width;
            
            x = newCenter - width / 2;
            originalX = x;
            
            if (x < this.BOUNDARY_MARGIN) {
                x = this.BOUNDARY_MARGIN;
                wasCorrected = true;
            } else if (x + width > this.width - this.BOUNDARY_MARGIN) {
                x = this.width - this.BOUNDARY_MARGIN - width;
                wasCorrected = true;
            }
            
        } else {
            x = Utils.randomInt(this.BOUNDARY_MARGIN, this.width - width - this.BOUNDARY_MARGIN);
        }

        const platform = { x, y, width, height: 20 };
        if (wasCorrected) {
            platform.isViolation = true;
            platform.originalX = originalX;
        }
        this.platforms.push(platform);
    }
}

function runTests() {
    console.log("Starting Platform Boundary Tests...");
    const game = new MockGame(400, 800);
    const MARGIN = 20;

    // Test 1: Generate many platforms and verify strict containment
    console.log("Test 1: Bulk Generation Verification");
    for (let i = 0; i < 1000; i++) {
        game.generatePlatform(800 - i * 100);
        const p = game.platforms[i];
        
        // Assert Left Boundary
        if (p.x < MARGIN) {
            console.error(`Violation at index ${i}: x=${p.x} < MARGIN=${MARGIN}`);
            assert.fail("Platform too close to left boundary");
        }

        // Assert Right Boundary
        if (p.x + p.width > game.width - MARGIN) {
            console.error(`Violation at index ${i}: right=${p.x + p.width} > limit=${game.width - MARGIN}`);
            assert.fail("Platform too close to right boundary");
        }
    }
    console.log(">> Passed: 1000 platforms generated within bounds.");

    // Test 2: Force Boundary Violation Logic
    // We can't easily force randomInt in this setup without mocking Utils further, 
    // but we can check if correction logic triggers by observing isViolation flag stats.
    console.log("Test 2: Correction Logic Verification");
    const violations = game.platforms.filter(p => p.isViolation);
    console.log(`Total Corrections Triggered: ${violations.length} / 1000`);
    
    if (violations.length > 0) {
        const v = violations[0];
        console.log(`Sample Violation: Original=${v.originalX.toFixed(2)}, Corrected=${v.x.toFixed(2)}`);
        // Verify the corrected value is exactly at margin
        const atLeft = Math.abs(v.x - MARGIN) < 0.01;
        const atRight = Math.abs(v.x + v.width - (game.width - MARGIN)) < 0.01;
        assert.ok(atLeft || atRight, "Corrected platform should be exactly at margin limit");
    } else {
        console.warn("No violations triggered randomly. This is statistically unlikely but possible if SAFE_JUMP_DIST is small relative to width.");
    }
    
    // Output Report
    console.log("\n--- Platform Generation Report ---");
    console.log(`Total Platforms: ${game.platforms.length}`);
    console.log(`Safe Margin: ${MARGIN}px`);
    console.log(`Scene Width: ${game.width}px`);
    console.log(`Violations Caught & Fixed: ${violations.length}`);
    console.log("All coordinate checks passed.");
}

runTests();
