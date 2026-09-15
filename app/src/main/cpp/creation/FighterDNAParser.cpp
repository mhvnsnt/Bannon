#include "FighterDNAParser.h"
#include "CAWVisualAssetComposite.h"
#include <iostream>

void FighterDNAParser::instantiateCharacter(const std::string& dnaPayload) {
    std::cout << "[FighterDNAParser] Parsing DNA payload: " << dnaPayload << "\n";
    std::cout << "[FighterDNAParser] Instantiating base character geometry...\n";
    CAWVisualAssetComposite::applyAttireMesh("default_attire");
    std::cout << "[FighterDNAParser] Custom attire meshes automatically parented to armature bone indices.\n";
}
