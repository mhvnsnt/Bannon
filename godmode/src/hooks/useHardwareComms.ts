import { useState, useEffect } from 'react';

export function useWebBluetooth() {
  const [device, setDevice] = useState<any | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
      setSupported(true);
    }
  }, []);

  const connect = async () => {
    if (!supported) return;
    try {
      const bleDevice = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['generic_access'] // basic service to test connection
      });
      
      setDevice(bleDevice);
      
      bleDevice.addEventListener('gattserverdisconnected', () => {
        setIsConnected(false);
        setDevice(null);
      });

      const server = await bleDevice.gatt?.connect();
      if (server) {
        setIsConnected(true);
      }
    } catch (err) {
      console.error('Bluetooth connection failed', err);
    }
  };

  const disconnect = () => {
    if (device && device.gatt?.connected) {
      device.gatt.disconnect();
    }
  };

  return { device, isConnected, connect, disconnect, supported };
}

export function useWebSerial() {
  const [port, setPort] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'serial' in navigator) {
      setSupported(true);
    }
  }, []);

  const connect = async () => {
    if (!supported) return;
    try {
      const serialPort = await (navigator as any).serial.requestPort();
      await serialPort.open({ baudRate: 9600 });
      setPort(serialPort);
      setIsConnected(true);
    } catch (err) {
      console.error('Serial connection failed', err);
    }
  };

  const disconnect = async () => {
    if (port) {
      await port.close();
      setPort(null);
      setIsConnected(false);
    }
  };
  
  const sendCommand = async (command: string) => {
     if (!port || !isConnected) return;
     try {
         const encoder = new TextEncoder();
         const writer = port.writable.getWriter();
         await writer.write(encoder.encode(command + '\\n'));
         writer.releaseLock();
     } catch (e) {
         console.error("Failed to write to serial port", e);
     }
  }

  return { port, isConnected, connect, disconnect, sendCommand, supported };
}
