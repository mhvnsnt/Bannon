// memoryMatrix.ts - The Autonomous Local Storage Bridge
import localforage from 'localforage';

localforage.config({
    name: 'CodeDummy_Nexus',
    storeName: 'mascot_grudge_matrix'
});

export const logUserError = async (errorType: string, lessonId: string) => {
    const currentData: any = await localforage.getItem('error_logs') || {};
    
    if (!currentData[errorType]) {
        currentData[errorType] = 1;
    } else {
        currentData[errorType] += 1;
    }
    
    await localforage.setItem('error_logs', currentData);
    return currentData;
};

export const getMascotAttitude = async () => {
    const data: any = await localforage.getItem('error_logs');
    if (!data) return 'neutral';

    // If they constantly miss syntax (like semicolons or brackets)
    if (data['syntax_bracket'] > 5) return 'annoyed';
    
    // If they write infinite loops
    if (data['memory_leak'] > 2) return 'cautious';

    return 'neutral';
};
