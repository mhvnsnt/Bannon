import json
import socket
import os
import sys

def send_mutation_payload():
    library_dir = os.path.abspath("./public/library")
    if not os.path.exists(library_dir):
        os.makedirs(library_dir)
        
    target_file = "bannon_mutation_test.html"
    file_path = os.path.join(library_dir, target_file)
    
    # Write some initial content
    initial_content = "<html>\n<body>\n    <div id='to_mutate'>Original Content</div>\n</body>\n</html>"
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(initial_content)
        
    print(f"Created initial file at {file_path}")

    # We want to change 'Original Content' to 'Mutated by Swarm'
    target_substr = "Original Content"
    start_byte = initial_content.encode('utf-8').find(target_substr.encode('utf-8'))
    end_byte = start_byte + len(target_substr.encode('utf-8'))
    
    new_value = "Mutated by Swarm"

    payload = {
        "jsonrpc": "2.0",
        "method": "ast/mutate",
        "params": {
            "target_file": target_file,
            "start_byte": start_byte,
            "end_byte": end_byte,
            "new_value": new_value
        },
        "id": 1
    }
    
    # Connect to the local Node.js daemon over TCP port 6000
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect(("127.0.0.1", 6005))
        print("Sending JSON-RPC payload...")
        s.sendall(json.dumps(payload).encode('utf-8'))
        
        # Read the acknowledgment response
        response = s.recv(4096)
        print(f"Server response: {response.decode('utf-8')}")
        s.close()
        
    except Exception as e:
        print(f"Failed to communicate with TCP Daemon: {e}")
        
    # Check if the file was modified
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            final_content = f.read()
        print(f"File content after mutation:\n{final_content}")
    except Exception as e:
        print(f"Failed to read file: {e}")

if __name__ == "__main__":
    send_mutation_payload()
