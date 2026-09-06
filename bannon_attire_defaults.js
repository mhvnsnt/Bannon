/* bannon_attire_defaults.js — non-canon roster attire bindings (additive; merges with existing selection).
 * Loads AFTER the engine. Adds each non-canon character's GENERATED GLB as the default attire and keeps
 * the built-in 3js body as the alternate. Does not touch canon characters or the existing char-select UI.
 *
 * Generated GLBs live at <MODEL_BASE>characters/<key>.glb (e.g. your Supabase public assets bucket).
 * Set window.MODEL_BASE once (the ATTIRE panel field does this, persisted to localStorage). Until a GLB
 * is reachable the character falls back to 3js automatically — nothing breaks before you've generated.
 */
(function () {
  'use strict';
  var NONCANON = ['TITAN', 'VIPER', 'GOLEM', 'RONIN', 'ZEPHYR'];

  function base() { return (window.MODEL_BASE || (function () { try { return localStorage.getItem('bannonModelBase') || ''; } catch (e) { return ''; } })()); }
  function genUrl(key) { return base() + 'characters/' + key.toLowerCase() + '.glb'; }

  // register attire options per non-canon character: [generated GLB (default), 3js (alternate)]
  window.ATTIRE = window.ATTIRE || {};
  NONCANON.forEach(function (k) {
    if (!window.ATTIRE[k]) {
      window.ATTIRE[k] = [
        { name: k.charAt(0) + k.slice(1).toLowerCase() + ' (gen)', url: 'characters/' + k.toLowerCase() + '.glb', isDefault: true },
        { name: k.charAt(0) + k.slice(1).toLowerCase() + ' (3js)', url: 'embedded:' + k.toLowerCase() }
      ];
    }
  });

  // set the DEFAULT model binding to the generated GLB (unless the user already chose one this session)
  function applyDefaults() {
    if (typeof window.assignCharModel !== 'function') return;
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem('bannonCharModels') || '{}'); } catch (e) {}
    NONCANON.forEach(function (k) {
      if (saved[k]) return;              // respect an explicit user choice
      var u = genUrl(k);
      if (!base()) return;               // no host set yet -> leave on 3js fallback
      try { window.assignCharModel(k, u, k + ' (gen)'); } catch (e) {}
    });
    if (typeof window.applyCharModels === 'function') { try { window.applyCharModels(); } catch (e) {} }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(applyDefaults, 600); });
  else setTimeout(applyDefaults, 600);
  window.applyNoncanonAttireDefaults = applyDefaults;   // re-run after setting MODEL_BASE
})();
