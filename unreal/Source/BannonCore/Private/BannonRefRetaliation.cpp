#include "BannonRefRetaliation.h"

void UBannonRefRetaliation::EvaluateRefTolerance(int32 TimesAttacked, float CurrentPatience, bool& bWillFightBack)
{
    // A classic MDickie staple: Referees have a breaking point. 
    // If attacked too many times, their AI switches from "Officiating" to "Aggressive Brawler"
    if (TimesAttacked >= 3 || CurrentPatience <= 0.0f)
    {
        bWillFightBack = true;
    }
    else
    {
        bWillFightBack = false;
    }
}
