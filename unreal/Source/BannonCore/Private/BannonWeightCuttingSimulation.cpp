#include "BannonWeightCuttingSimulation.h"

void UBannonWeightCuttingSimulation::ProcessWeeklyDietAndTraining(float TargetWeight, float CurrentWeight, int32 CaloricIntake, int32 TrainingIntensity, float& OutNewWeight, float& OutStaminaPenalty)
{
    // Deepens MDickie RPG systems: Weight cutting and biological stress mechanics.
    // Caloric deficit + high training intensity cuts weight but imposes a severe stamina penalty on match day.
    float CaloricShift = (CaloricIntake - 2500) * 0.002f; // Base maintenance assumed at 2500 kcal
    float TrainingBurn = TrainingIntensity * 0.05f; 

    OutNewWeight = CurrentWeight + CaloricShift - TrainingBurn;

    // Severe dehydration/weight cutting taxes the cardiovascular system
    float WeightLost = CurrentWeight - OutNewWeight;
    if (WeightLost > 5.0f) 
    {
        OutStaminaPenalty = WeightLost * 2.5f; // Losing >5 lbs in a week drains base stamina for the upcoming match
    }
    else
    {
        OutStaminaPenalty = 0.0f;
    }
}
