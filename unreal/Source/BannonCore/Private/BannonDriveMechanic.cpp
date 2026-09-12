#include "BannonDriveMechanic.h"

void UBannonDriveMechanic::AddDrive(float Amount)
{
    CurrentDrive += Amount;
    if (CurrentDrive > MaxDrive) CurrentDrive = MaxDrive;
}

bool UBannonDriveMechanic::ConsumeDrive(float Amount)
{
    if (CurrentDrive >= Amount)
    {
        CurrentDrive -= Amount;
        return true;
    }
    return false;
}

float UBannonDriveMechanic::CalculateDriveMultiplier(float BaseDamage)
{
    // The higher the drive, the more explosive the physics force
    // e.g., 100 Drive = 1.5x multiplier on physics impulse
    return BaseDamage * (1.0f + (CurrentDrive / MaxDrive) * 0.5f);
}
