#!/bin/bash

# start_stack.sh - Automated System Daemon Initialization Orchestrator
clear
echo "====================================================================="
echo "        INITIALIZING SYSTEM CORE MESH: GOD MODE OPERATING SYSTEM      "
echo "====================================================================="

# Base tracking variables for process management hooks
PID_LIST=()

cleanup_ports() {
    echo -e "\n[System Shutdown] Trapped break sequence. Sweeping system ports safely..."
    for pid in "${PID_LIST[@]}"; do
        if kill -0 $pid 2>/dev/null; then
            kill -SIGTERM $pid
        fi
    done
    
    # Force clean port allocations to prevent socket bind errors on reboot
    fuser -k 3000/tcp 2>/dev/null
    fuser -k 6000/tcp 2>/dev/null
    echo "[System Shutdown] Mesh swept clean. Environment offline."
    exit 0
}

# Link cleanup routine directly to system break signals
trap cleanup_ports SIGINT SIGTERM

echo "[1/6] Verifying local network configuration channels..."
if lsof -Pi :3000 -t >/dev/null || lsof -Pi :6000 -t >/dev/null; then
    echo "[Warning] Ports are currently occupied. Running hardware override sweep..."
    fuser -k 3000/tcp 2>/dev/null
    fuser -k 6000/tcp 2>/dev/null
    sleep 1
fi

echo "[2/6] Instantiating hardware telemetry monitor modules..."
python3 daemon/daemon_telemetry.py > /dev/null &
PID_LIST+=($!)

echo "[3/6] Launching background self-healing loops & runtime sandboxes..."
python3 daemon/swarm_self_healing_core.py &
PID_LIST+=($!)

echo "[4/6] Starting Web OS Engine and Socket.io communication bridge..."
npm run dev &
PID_LIST+=($!)

echo "[5/6] Hooking Vulkan capture handles and setting up container environments..."
python3 daemon/docker_test_sandbox.py &
PID_LIST+=($!)
python3 daemon/vulkan_wrapper.py &
PID_LIST+=($!)

echo "[6/6] Injecting Proportional-Derivative (PD) active ragdoll torque controllers..."
python3 daemon/pd_torque_controller.py &
PID_LIST+=($!)

echo "[7/7] Activating compliant local asset matcher..."
python3 legal_asset_matcher.py &
PID_LIST+=($!)

echo "====================================================================="
echo " SYSTEM ONLINE: Access God Mode Dashboard at http://localhost:3000   "
echo " Press [CTRL+C] to halt the ecosystem safely                         "
echo "====================================================================="

# Keep thread script active to handle logging loops
while true; do
    sleep 1
done
