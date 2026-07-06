export class Panopticon {
    private socket: WebSocket | null = null;
    private userId: string = 'user_' + Math.floor(Math.random() * 1000);
    private role: 'user' | 'admin' = 'user';
    private onUpdateCallback: ((data: any) => void) | null = null;
    private onOverrideCallback: ((payload: any) => void) | null = null;

    constructor(role: 'user' | 'admin' = 'user', userId?: string) {
        this.role = role;
        if (userId) this.userId = userId;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const socketUrl = `${protocol}//${host}`;

        console.log(`[Panopticon] Establishing real connection to: ${socketUrl} (${this.role})`);
        
        try {
            this.socket = new WebSocket(socketUrl);

            this.socket.onopen = () => {
                console.log(`[Panopticon] Connected! Registering ${this.userId}`);
                this.socket?.send(JSON.stringify({
                    type: 'register',
                    userId: this.userId,
                    role: this.role
                }));
            };

            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'telemetry-update' && this.onUpdateCallback) {
                        this.onUpdateCallback(data);
                    } else if (data.type === 'override' && this.onOverrideCallback) {
                        this.onOverrideCallback(data.payload);
                    }
                } catch (e: any) {
                    console.error("[Panopticon] Message parsing error:", e.message);
                }
            };

            this.socket.onerror = (e) => {
                console.error("[Panopticon] Connection error:", e);
            };

            this.socket.onclose = () => {
                console.warn("[Panopticon] Socket connection closed.");
            };
        } catch (e) {
            console.error("[Panopticon] Socket creation failed:", e);
        }
    }

    public broadcastTelemetry(code: string, mascotPos: { x: number, y: number, z: number }, animState: string = 'wander') {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
        this.socket.send(JSON.stringify({
            type: 'telemetry-tick',
            userId: this.userId,
            code,
            mascotPos,
            animState
        }));
    }

    public subscribeToUser(targetUserId: string, onUpdate: (data: any) => void) {
        console.log(`[Panopticon] Subscribing to telemetry of: ${targetUserId}`);
        this.onUpdateCallback = onUpdate;
        
        const subscribe = () => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({
                    type: 'shadow-user',
                    targetUserId
                }));
            }
        };

        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            subscribe();
        } else if (this.socket) {
            const originalOnOpen = this.socket.onopen;
            this.socket.onopen = (e) => {
                if (originalOnOpen) originalOnOpen.call(this.socket, e);
                subscribe();
            };
        }

        return {
            unsubscribe: () => {
                this.onUpdateCallback = null;
            }
        };
    }

    public registerOverrideListener(onOverride: (payload: any) => void) {
        this.onOverrideCallback = onOverride;
    }

    public forceInjectPayload(targetUserId: string, payload: any) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
        console.log(`[Panopticon] Injecting administrative override command to user: ${targetUserId}`);
        this.socket.send(JSON.stringify({
            type: 'admin-override',
            targetUserId,
            payload
        }));
    }
}
