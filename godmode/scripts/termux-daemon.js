#!/usr/bin/env node

const WebSocket = require('ws');
const { exec } = require('child_process');

// Configuration
const CLOUD_WS_URL = process.env.CLOUD_WS_URL || "ws://localhost:3000/api/termux-bridge";
const RECONNECT_INTERVAL = 5000;

function connect() {
  console.log(`[Termux Daemon] Attempting connection to ${CLOUD_WS_URL}...`);
  const ws = new WebSocket(CLOUD_WS_URL);

  ws.on('open', () => {
    console.log('[Termux Daemon] Secure tunnel established with God-Mode OS.');
    ws.send(JSON.stringify({ type: 'HANDSHAKE', payload: 'Termux Hardware Link Online' }));
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('[Termux Daemon] Received command:', message);
      
      if (message.type === 'EXEC_COMMAND' && message.command) {
        exec(message.command, (error, stdout, stderr) => {
          if (error) {
            console.error(`[Termux Daemon] Execution error: ${error.message}`);
            ws.send(JSON.stringify({ type: 'COMMAND_ERROR', payload: error.message }));
            return;
          }
          if (stderr) {
            console.warn(`[Termux Daemon] Execution stderr: ${stderr}`);
          }
          console.log(`[Termux Daemon] Execution stdout: ${stdout}`);
          ws.send(JSON.stringify({ type: 'COMMAND_RESULT', payload: stdout }));
        });
      }
    } catch (err) {
      console.error('[Termux Daemon] Error processing message:', err);
    }
  });

  ws.on('close', () => {
    console.log('[Termux Daemon] Connection lost. Retrying in 5 seconds...');
    setTimeout(connect, RECONNECT_INTERVAL);
  });

  ws.on('error', (err) => {
    console.error(`[Termux Daemon] WebSocket error: ${err.message}`);
    ws.close();
  });
}

connect();
