#include "BannonCourtSystem.h"

void UBannonCourtSystem::FileInjuryLawsuit(float DefendantSalary, float PlaintiffInjurySeverity, bool& bCaseWon, float& OutSettlementAmount)
{
    // Classic MDickie court scenario: Suing a rival for injuring you in the ring or backstage.
    // High severity injuries have a higher chance of winning the case.
    
    if (PlaintiffInjurySeverity > 50.0f)
    {
        // 60% chance to win if severely injured
        bCaseWon = (FMath::RandRange(0, 100) < 60);
    }
    else
    {
        // 20% chance to win for minor injuries (frivolous lawsuit)
        bCaseWon = (FMath::RandRange(0, 100) < 20);
    }
    
    if (bCaseWon)
    {
        // Settlement is a percentage of the defendant's salary multiplied by injury severity
        OutSettlementAmount = (DefendantSalary * 0.1f) * (PlaintiffInjurySeverity / 100.0f);
    }
    else
    {
        OutSettlementAmount = 0.0f;
    }
}

void UBannonCourtSystem::EvaluateWrongfulTermination(bool bHasCreativeControl, int32 RemainingContractWeeks, float& OutSeverancePackage)
{
    // Getting fired randomly happens. If they have creative control, they get a massive payout.
    float BaseWeeklyPay = 5000.0f; // Stubbed base pay
    
    if (bHasCreativeControl)
    {
        OutSeverancePackage = BaseWeeklyPay * RemainingContractWeeks * 2.0f; // Double payout for breach of CC
    }
    else
    {
        OutSeverancePackage = BaseWeeklyPay * (RemainingContractWeeks * 0.25f); // 25% severance
    }
}
