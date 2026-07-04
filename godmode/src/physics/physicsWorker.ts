// physicsWorker.ts
// Physics simulation logic running in a separate thread
const ctx: Worker = self as any;

let physics = { gravity: 9.8, tension: 50, dampening: 20 };

ctx.onmessage = (e) => {
  if (e.data.type === 'UPDATE_CONFIG') {
    physics = e.data.physics;
  }
};

// Simulation loop
setInterval(() => {
  // Simulate heavy physics calculations
  const force = physics.gravity * physics.tension;
  // Send back result
  ctx.postMessage({ type: 'UPDATE', simulation: { force } });
}, 16); // ~60fps
