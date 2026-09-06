#pragma once
#include <string>

class FacePaintLayerProcessor {
public:
    static void applyProceduralAlphaMask(const std::string& baseTexture, const std::string& paintAsset, float alphaValue);
};
