document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();

    // Button Listeners
    const startBtn = document.getElementById('start-btn');
    const retryBtn = document.getElementById('retry-btn');
    const shareBtn = document.getElementById('share-btn');
    const helpBtn = document.getElementById('help-btn');
    const closeHelpBtn = document.getElementById('close-help-btn');
    const helpModal = document.getElementById('help-modal');
    const nyContinueBtn = document.getElementById('ny-continue-btn');
    const nyMenuBtn = document.getElementById('ny-menu-btn');

    startBtn.addEventListener('click', () => {
        game.start();
    });

    retryBtn.addEventListener('click', () => {
        // Hide Game Over
        document.getElementById('game-over-screen').classList.remove('active');
        document.getElementById('game-over-screen').classList.add('hidden');
        game.start();
    });

    // Keyboard Shortcuts for Game Over and Win screens
    document.addEventListener('keydown', (e) => {
        // Toggle Debug
        if (e.key === 'd' || e.key === 'D') {
            game.debugMode = !game.debugMode;
            console.log(`Debug Mode: ${game.debugMode}`);
        }

        // Game Over Screen
        if (document.getElementById('game-over-screen').classList.contains('active')) {
            if (e.key === 'Enter') {
                document.getElementById('retry-btn').click();
            }
        }
        
        // New Year Overlay (Win Prompt)
        if (document.getElementById('newyear-overlay').classList.contains('active')) {
            if (e.key === 'Enter') {
                nyContinueBtn.click();
            } else if (e.key === 'Escape') {
                nyMenuBtn.click();
            }
        }
    });

    helpBtn.addEventListener('click', () => {
        helpModal.classList.remove('hidden');
        helpModal.classList.add('active');
    });

    closeHelpBtn.addEventListener('click', () => {
        helpModal.classList.remove('active');
        helpModal.classList.add('hidden');
    });

    shareBtn.addEventListener('click', () => {
        const text = `我在《2026步步高升》中跳了 ${game.score} 分！你也来试试吧！`;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                alert('成绩已复制到剪贴板，快去分享吧！');
            }).catch(err => {
                prompt('请复制以下文字分享：', text);
            });
        } else {
            prompt('请复制以下文字分享：', text);
        }
    });

    nyContinueBtn.addEventListener('click', () => {
        game.continueEndless();
    });

    nyMenuBtn.addEventListener('click', () => {
        const overlay = document.getElementById('newyear-overlay');
        overlay.classList.remove('active');
        overlay.classList.add('hidden');
        // Show start screen
        document.getElementById('start-screen').classList.remove('hidden');
        document.getElementById('start-screen').classList.add('active');
    });

    // Initial render call to show background
    game.draw();
    
    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registered', reg))
            .catch(err => console.error('Service Worker failed', err));
    }
});
