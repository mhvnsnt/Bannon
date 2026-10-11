// Spatial Hashing and Bitonic Sort for Particle Neighbor Lookups

struct Particle {
    position: vec3<f32>,
    velocity: vec3<f32>,
    life: f32,
    active: f32,
};

struct Bounds {
    min: vec3<f32>,
    max: vec3<f32>,
};

struct Config {
    numParticles: u32,
    gridResolution: vec3<u32>,
    cellSize: f32,
};

@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(1) var<storage, read_write> particleIndices: array<u32>;
@group(0) @binding(2) var<storage, read_write> particleCellIndices: array<u32>;
@group(0) @binding(3) var<storage, read_write> gridOffsets: array<u32>; // Contains start and count for each cell
@group(0) @binding(4) var<uniform> config: Config;

// Calculates 1D spatial hash from 3D position
fn calculateCellIndex(pos: vec3<f32>) -> u32 {
    let cellPos = vec3<u32>(
        u32(pos.x / config.cellSize),
        u32(pos.y / config.cellSize),
        u32(pos.z / config.cellSize)
    );
    
    return cellPos.x + 
           cellPos.y * config.gridResolution.x + 
           cellPos.z * config.gridResolution.x * config.gridResolution.y;
}

@compute @workgroup_size(64)
fn calculateParticleHashes(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    if (index >= config.numParticles) { return; }

    particleIndices[index] = index;
    particleCellIndices[index] = calculateCellIndex(particles[index].position);
}

// Bitonic Sort Implementation
@group(1) @binding(0) var<uniform> stage: u32; // power of 2
@group(1) @binding(1) var<uniform> step_no: u32;

@compute @workgroup_size(64)
fn bitonicSort(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let i = global_id.x;
    if (i >= config.numParticles) { return; }

    let j = i ^ step_no;
    if (j > i) {
        let key_i = particleCellIndices[i];
        let val_i = particleIndices[i];
        
        let key_j = particleCellIndices[j];
        let val_j = particleIndices[j];

        let dir = (i & stage) == 0u;
        
        if ((key_i > key_j) == dir) {
            // Swap
            particleCellIndices[i] = key_j;
            particleCellIndices[j] = key_i;
            particleIndices[i] = val_j;
            particleIndices[j] = val_i;
        }
    }
}

// Calculate Grid Offsets
@compute @workgroup_size(64)
fn calculateGridOffsets(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    if (index >= config.numParticles) { return; }

    let cellIndex = particleCellIndices[index];
    
    // Check if we are the first particle in the sorted list for this cell
    var isFirst = false;
    if (index == 0u) {
        isFirst = true;
    } else {
        let prevCellIndex = particleCellIndices[index - 1u];
        if (cellIndex != prevCellIndex) {
            isFirst = true;
        }
    }

    if (isFirst) {
        gridOffsets[cellIndex] = index;
    }
}
