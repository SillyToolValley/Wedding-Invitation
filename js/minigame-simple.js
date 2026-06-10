// Simple test version of the mini game
(function() {
  let canvas, ctx;
  let player = { x: 100, y: 200, w: 50, h: 50, vy: 0 };
  let platforms = [];
  let running = false;
  let gravity = 500;
  let jumpPower = -300;
  
  window.initMiniGameSimple = function() {
    console.log('Initializing simple mini game...');
    
    // Find or create canvas
    let container = document.getElementById('miniGameContainer');
    if (!container) {
      console.error('Container not found!');
      return;
    }
    
    // Create simple game HTML
    container.innerHTML = `
      <div style="position: relative; width: 100%; height: 500px; background: #222; border: 2px solid #f0f;">
        <canvas id="simpleCanvas" width="800" height="500" style="display: block; width: 100%; height: 100%;"></canvas>
        <button id="simpleStart" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 20px; background: #ff006e; color: white; border: none; font-size: 20px; cursor: pointer;">START GAME</button>
        <div style="position: absolute; top: 10px; left: 10px; color: white; font-family: monospace;">
          <div>Press SPACE to jump</div>
          <div>Press Q to test Firebase</div>
        </div>
      </div>
    `;
    
    canvas = document.getElementById('simpleCanvas');
    ctx = canvas.getContext('2d');
    
    // Initialize platforms
    platforms = [
      { x: 0, y: 400, w: 800, h: 100 },
      { x: 300, y: 300, w: 200, h: 20 },
      { x: 600, y: 200, w: 150, h: 20 }
    ];
    
    // Start button
    document.getElementById('simpleStart').onclick = startSimpleGame;
    
    // Controls
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && running) {
        e.preventDefault();
        if (player.vy === 0) {
          player.vy = jumpPower;
        }
      }
      if (e.code === 'KeyQ') {
        testFirebase();
      }
    });
    
    // Draw initial state
    drawSimpleGame();
  };
  
  function startSimpleGame() {
    console.log('Starting simple game...');
    document.getElementById('simpleStart').style.display = 'none';
    running = true;
    player = { x: 100, y: 200, w: 50, h: 50, vy: 0 };
    gameLoopSimple();
  }
  
  function gameLoopSimple() {
    if (!running) return;
    
    const dt = 0.016; // Fixed timestep
    
    // Physics
    player.vy += gravity * dt;
    player.y += player.vy * dt;
    
    // Platform collision
    for (let p of platforms) {
      if (player.x < p.x + p.w && player.x + player.w > p.x) {
        if (player.y + player.h > p.y && player.y + player.h < p.y + 20) {
          if (player.vy > 0) {
            player.y = p.y - player.h;
            player.vy = 0;
          }
        }
      }
    }
    
    // Keep player in bounds
    if (player.y > 500) {
      player.y = 200;
      player.vy = 0;
    }
    
    drawSimpleGame();
    requestAnimationFrame(gameLoopSimple);
  }
  
  function drawSimpleGame() {
    if (!ctx) return;
    
    // Clear
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 800, 500);
    
    // Draw platforms
    ctx.fillStyle = '#ff006e';
    for (let p of platforms) {
      ctx.fillRect(p.x, p.y, p.w, p.h);
    }
    
    // Draw player
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(player.x, player.y, player.w, player.h);
    
    // Draw face
    ctx.fillStyle = '#000';
    ctx.fillRect(player.x + 10, player.y + 15, 5, 5);
    ctx.fillRect(player.x + 35, player.y + 15, 5, 5);
    ctx.fillRect(player.x + 15, player.y + 30, 20, 3);
  }
  
  function testFirebase() {
    console.log('Testing Firebase...');
    if (window.submitGameScore) {
      window.submitGameScore('TestPlayer', Math.floor(Math.random() * 1000))
        .then(() => console.log('Firebase test successful!'))
        .catch(err => console.error('Firebase test failed:', err));
    } else {
      console.error('Firebase functions not available');
    }
  }
  
  // Auto-initialize after a delay
  setTimeout(() => {
    if (document.getElementById('miniGameContainer')) {
      window.initMiniGameSimple();
    }
  }, 1000);
})();