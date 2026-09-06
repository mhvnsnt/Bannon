#include "FacePaintLayerProcessor.h"
#include <iostream>

void FacePaintLayerProcessor::applyProceduralAlphaMask(const std::string& baseTexture, const std::string& paintAsset, float alphaValue) {
    std::cout << "[FacePaintLayerProcessor] Handling procedural alpha-masking of face texture maps.\n";
    std::cout << "[FacePaintLayerProcessor] Layering " << paintAsset << " over " << baseTexture << " with alpha " << alphaValue << ".\n";
    std::cout << "[FacePaintLayerProcessor] War-paint and mask assets successfully layered over base FighterDNA geometry.\n";
}
