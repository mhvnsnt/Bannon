#include "BannonElevatorPhysics.h"

void UBannonElevatorPhysics::CalculateInertialThrow(float ElevatorVelocityZ, float ThrowForceZ, float& ResultingZForce)
{
    // Moving vertical platforms (like subway cars or elevators) with independent physics grids.
    // If you throw someone UP while the elevator is moving UP, the force stacks.
    ResultingZForce = ThrowForceZ + (ElevatorVelocityZ * 0.5f);
}
