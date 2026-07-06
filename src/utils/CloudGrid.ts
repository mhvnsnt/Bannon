import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export interface MascotStatePacket {
    id: string;
    x: number;
    y: number;
    z: number;
    rotY: number;
    animState: string;
}

export class CloudGrid {
    public doc: Y.Doc;
    public provider: WebsocketProvider | null = null;
    public mascotStates: Y.Map<any>;
    public codeText: Y.Text;

    constructor(roomName: string = 'codedummy-global-room') {
        this.doc = new Y.Doc();
        try {
            this.provider = new WebsocketProvider('ws://localhost:1234', roomName, this.doc, { connect: false });
        } catch (e) {
            console.warn("Y-Websocket provider failed to init");
        }
        
        this.mascotStates = this.doc.getMap('mascotStates');
        this.codeText = this.doc.getText('code');
    }

    public updateLocalMascot(packet: MascotStatePacket) {
        this.mascotStates.set(packet.id, packet);
    }

    public getRemoteMascots(): Map<string, MascotStatePacket> {
        const mascots = new Map<string, MascotStatePacket>();
        this.mascotStates.forEach((value, key) => {
            mascots.set(key, value);
        });
        return mascots;
    }

    public onStateChange(callback: () => void) {
        this.mascotStates.observe(callback);
    }
}
