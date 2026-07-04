# daemon/pd_torque_controller.py - Active Ragdoll PD Loop Controller
import time
import json
import socket

class PDController:
    """
    Proportional-Derivative Controller for Dual-Rig Target Frame matching.
    Syncs the hidden Kinematic Rig (Animations) with the visible Physical Rig (Ragdoll).
    """
    def __init__(self, proportional_gain=150.0, derivative_gain=15.0):
        # Kp: Proportional Gain (Spring Stiffness - How hard it tries to match the target angle)
        self.Kp = proportional_gain
        # Kd: Derivative Gain (Damping - How much it resists sudden movements to prevent jitter)
        self.Kd = derivative_gain

    def calculate_torque(self, current_angle, target_angle, current_velocity):
        """
        Calculates the torque required to move a joint toward its target angle.
        Tau = Kp * (Target - Current) - Kd * Current_Velocity
        """
        error = target_angle - current_angle
        # Apply the PD formula
        torque = (self.Kp * error) - (self.Kd * current_velocity)
        return torque

class PhysicsRigSync:
    def __init__(self, ipc_port=6005):
        self.controllers = {
            "neck": PDController(200.0, 20.0), # Stiffer neck for visceral impacts
            "spine": PDController(250.0, 25.0), # Stiff core
            "shoulder": PDController(120.0, 10.0),
            "elbow": PDController(80.0, 8.0),
            "hip": PDController(150.0, 15.0),
            "knee": PDController(100.0, 10.0)
        }
        self.ipc_port = ipc_port

    def sync_joint_frame(self, joint_id, current_state, target_state):
        """
        Simulates the per-frame alignment of the physical ragdoll rig to the kinematic rig.
        """
        if joint_id not in self.controllers:
            return 0.0

        controller = self.controllers[joint_id]
        
        # Calculate angular torque
        applied_torque = controller.calculate_torque(
            current_angle=current_state["angle"],
            target_angle=target_state["angle"],
            current_velocity=current_state["velocity"]
        )

        return applied_torque

    def _notify_macro_physics(self, event_data):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.connect(("127.0.0.1", self.ipc_port))
            s.send(json.dumps({
                "jsonrpc": "2.0",
                "method": "physics/pd_loop",
                "params": event_data
            }).encode('utf-8'))
            s.close()
        except:
            pass

    def run_simulation_loop(self):
        print("[PD Torque Controller] Initializing Dual-Rig Kinematic Sync...")
        # Mock simulation of a spine joint matching a "Neckbreaker" animation curve
        sim_frames = 60
        spine_state = {"angle": 0.0, "velocity": 0.0}
        target_angle = 45.0 # Degrees bending backwards
        
        for frame in range(sim_frames):
            torque = self.sync_joint_frame("spine", spine_state, {"angle": target_angle})
            
            # Simple Euler integration for simulation:
            # Acceleration = Torque / Mass (assume mass=1.0 for simplicity)
            spine_state["velocity"] += torque * 0.016 # 60 FPS DeltaTime
            spine_state["angle"] += spine_state["velocity"] * 0.016
            
            # Log over-exertion or floating-point anomalies
            if abs(torque) > 5000:
                print(f"[Warning] Procedural Weight Overexertion at {frame}: {torque:.2f}Nm. Applying Clamp!")
                self._notify_macro_physics({"alert": "TORQUE_CLAMPED", "joint": "spine", "torque": torque})
                torque = max(-5000, min(5000, torque)) # Visceral Impact Clamping
                
        print(f"[PD Torque Controller] Loop complete. Final Spine Angle: {spine_state['angle']:.2f} (Target: {target_angle})")

if __name__ == "__main__":
    rig_sync = PhysicsRigSync()
    rig_sync.run_simulation_loop()
