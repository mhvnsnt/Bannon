import fs from 'fs';
import path from 'path';

interface UnitaryOperation {
    id: string;
    filePath: string;
    timestamp: number;
    forwardData: string;
    inverseData: string; // The exact data needed to undo this operation
}

export class UnitaryExecutionNode {
    private static operationLog: UnitaryOperation[] = [];

    static writeUnitary(filePath: string, newContent: string) {
        const absPath = path.resolve(filePath);
        let inverseData = "";
        
        if (fs.existsSync(absPath)) {
            inverseData = fs.readFileSync(absPath, 'utf-8');
        } else {
            inverseData = "__FILE_CREATION__"; // special marker to indicate deletion on reverse
        }

        const op: UnitaryOperation = {
            id: `U_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            filePath: absPath,
            timestamp: Date.now(),
            forwardData: newContent,
            inverseData: inverseData
        };

        // Apply forward operation
        fs.mkdirSync(path.dirname(absPath), { recursive: true });
        fs.writeFileSync(absPath, newContent, 'utf-8');
        
        this.operationLog.push(op);
        console.log(`[UNITARY] Applied forward operator to ${path.basename(filePath)}. U-dagger logged.`);
        return op.id;
    }

    static reverseOperator(operationId?: string) {
        if (this.operationLog.length === 0) return false;
        
        // Uncompute specific op or last op
        const opIndex = operationId 
            ? this.operationLog.findIndex(o => o.id === operationId)
            : this.operationLog.length - 1;
            
        if (opIndex === -1) return false;
        
        const op = this.operationLog[opIndex];
        
        if (op.inverseData === "__FILE_CREATION__") {
            if (fs.existsSync(op.filePath)) {
                fs.unlinkSync(op.filePath);
            }
        } else {
            fs.writeFileSync(op.filePath, op.inverseData, 'utf-8');
        }

        this.operationLog.splice(opIndex, 1);
        console.log(`[UNITARY] Applied inverse operator U-dagger. Uncomputed state for ${path.basename(op.filePath)}.`);
        return true;
    }
}
