/* ===== AI-Studio module: BANNON_EDITOR (salvaged from rescue branch) ===== */
window.BANNON_EDITOR = (function(){
  const MAX_ATTRIBUTE_TOTAL = 450; // Force balance (Strength + Stamina + Toughness + Speed + Charisma + Technique)
  const CATEGORIES = ['Strength', 'Stamina', 'Toughness', 'Speed', 'Charisma', 'Technique'];
  
  // Validate and clamp fighter stats to ensure realism
  function validateStats(stats) {
    let total = 0;
    const out = {};
    CATEGORIES.forEach(c => {
      const v = Math.max(1, Math.min(99, stats[c] || 50));
      out[c] = v;
      total += v;
    });
    
    // Scale down if exceeding max
    if(total > MAX_ATTRIBUTE_TOTAL) {
      const ratio = MAX_ATTRIBUTE_TOTAL / total;
      CATEGORIES.forEach(c => { out[c] = Math.floor(out[c] * ratio); });
    }
    return out;
  }

  // Assign a visual gear preset (mimics the MDickie texture atlas swapping)
  function setGearPreset(fighter, presetType) {
    const presets = {
      'heavyweight': { scale: 1.1, mass: 120, tights: 'trunks', kneepads: true },
      'cruiserweight': { scale: 0.9, mass: 85, tights: 'long', kneepads: true },
      'brawler': { scale: 1.0, mass: 105, tights: 'jeans', kneepads: false },
      'luchador': { scale: 0.95, mass: 90, tights: 'full', mask: true }
    };
    const p = presets[presetType] || presets['brawler'];
    fighter.scale = p.scale;
    fighter.mass = p.mass;
    fighter.gear = { tights: p.tights, kneepads: p.kneepads, mask: p.mask||false };
    return fighter;
  }

  // Allocate moveset from the dictionary
  function allocateMoves(fighter, finisherID, signatureID) {
    fighter.moveset = fighter.moveset || {};
    fighter.moveset.finisher = finisherID;
    fighter.moveset.signature = signatureID;
    return fighter;
  }

  return {
    MAX_ATTRIBUTE_TOTAL,
    validateStats,
    setGearPreset,
    allocateMoves
  };
})();

