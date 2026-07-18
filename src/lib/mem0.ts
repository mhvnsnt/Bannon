import { MemoryClient } from 'mem0ai';

// Initialize with lazy initialization
let mem0Client: MemoryClient | null = null;

function getMem0(): MemoryClient {
  if (!mem0Client) {
    const apiKey = process.env.MEM0_API_KEY;
    if (!apiKey) {
      throw new Error('MEM0_API_KEY environment variable is required');
    }
    mem0Client = new MemoryClient({ apiKey });
  }
  return mem0Client;
}

export const BannonMemory = {
  // Store core Bannon mathematical constants
  storeConstant: async (name: string, value: number) => {
    const client = getMem0();
    await client.add([{ memory: `BannonConstant_${name}`, metadata: { value } }]);
  },
  
  getConstant: async (name: string) => {
    const client = getMem0();
    return await client.get(`BannonConstant_${name}`);
  },

  // Initialize baseline constants
  initializeConstants: async () => {
    const constants = {
      MAX_HP: 10000,
      DMG_SCALE: 8.0,
      MAX_BODY_VEL: 3.8
    };
    
    for (const [name, value] of Object.entries(constants)) {
      await BannonMemory.storeConstant(name, value);
    }
  }
};
