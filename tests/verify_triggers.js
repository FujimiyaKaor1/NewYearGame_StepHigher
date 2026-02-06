
const assert = require('assert');

class MockGame {
    constructor() {
        this.score = 0;
        this.triggeredTargets = new Set();
        this.events = [];
    }

    update() {
        // Logic copied from js/game.js
        for (let digit = 1; digit <= 9; digit++) {
            const target = digit * 1111;
            if (this.score > target && !this.triggeredTargets.has(target)) {
                this.triggeredTargets.add(target);
                this.events.push(`Triggered ${digit}`);
            }
        }

        if (this.score > 10000 && !this.triggeredTargets.has(10000)) {
            this.triggeredTargets.add(10000);
            this.events.push('Triggered End');
        }
    }
}

function runTests() {
    const game = new MockGame();
    console.log("Starting Tests...");

    // Test 1: Score < 1111
    game.score = 1110;
    game.update();
    assert.strictEqual(game.events.length, 0, "Should not trigger at 1110");

    // Test 2: Score == 1111 (Strict Inequality Check)
    game.score = 1111;
    game.update();
    assert.strictEqual(game.events.length, 0, "Should not trigger at 1111 exactly");

    // Test 3: Score > 1111
    game.score = 1111.1;
    game.update();
    assert.strictEqual(game.events.length, 1, "Should trigger at 1111.1");
    assert.strictEqual(game.events[0], "Triggered 1", "Should trigger digit 1");

    // Test 4: Skip Trigger (Jump from 2220 to 2225)
    game.score = 2225;
    game.update();
    assert.strictEqual(game.events.length, 2, "Should trigger second event");
    assert.strictEqual(game.events[1], "Triggered 2", "Should trigger digit 2");

    // Test 5: Game End Exact (10000)
    game.score = 10000;
    game.update();
    // Should NOT trigger end yet
    assert.ok(!game.triggeredTargets.has(10000), "Should not trigger end at 10000 exactly");

    // Test 6: Game End Trigger (>10000)
    game.score = 10000.5;
    game.update();
    assert.ok(game.triggeredTargets.has(10000), "Should trigger end at 10000.5");
    assert.strictEqual(game.events[game.events.length-1], "Triggered End");

    console.log("All tests passed!");
}

runTests();
