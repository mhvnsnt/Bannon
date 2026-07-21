#include "Modules/ModuleManager.h"

class FRTIKModule : public IModuleInterface
{
public:
	virtual void StartupModule() override {}
	virtual void ShutdownModule() override {}
};

IMPLEMENT_MODULE(FRTIKModule, RTIK)
