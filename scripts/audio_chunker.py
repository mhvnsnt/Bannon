import soundfile as sf
import numpy as np
import sys
import os

def process_large_wav(file_path, block_size=4096):
    if not os.path.exists(file_path):
        print(f"[{file_path}] File not found.")
        return
        
    try:
        print(f"Starting chunked processing of {file_path} (block size: {block_size})...")
        blocks_processed = 0
        total_samples = 0
        
        # Stream the file in chunks instead of loading entirely into RAM
        for block in sf.blocks(file_path, blocksize=block_size):
            # Execute audio banking/processing logic on the block here
            blocks_processed += 1
            total_samples += len(block)
            
            if blocks_processed % 1000 == 0:
                print(f"Processed {blocks_processed} blocks... ({total_samples} samples)")
                
        print(f"[{file_path}] Processed successfully via chunking. Total blocks: {blocks_processed}")
    except Exception as e:
        print(f"CRITICAL FAULT isolating {file_path}: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python audio_chunker.py <path_to_wav_file>")
        sys.exit(1)
        
    process_large_wav(sys.argv[1])
