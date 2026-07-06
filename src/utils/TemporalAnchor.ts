export class TemporalAnchor {
    private history: string[] = [];
    private maxCapacity = 10;
    
    saveState(code: string) {
        this.history.push(code);
        if (this.history.length > this.maxCapacity) {
            this.history.shift();
        }
    }

    rewind(): string | null {
        if (this.history.length > 0) {
            return this.history.pop() || null;
        }
        return null;
    }
}
