# Bannon Performance Issues (Documented 2026-10-05)

Owner reports Bannon PWA is slow, laggy, and broken in multiple ways. Moving active development to AshLane.

## Confirmed Issues
1. **Slow rendering**: 40,000+ line single HTML file takes too long to parse/load on mobile.
2. **Laggy 3D**: Complex scene with too many draw calls for mobile GPUs.
3. **Buffering**: 21MB+ GLB models timeout on mobile connections.
4. **GitHub Pages**: Doesn't serve large GLB files (404 on 21MB Sombra model).
5. **Cache issues**: Users see stale versions, require manual hard-refresh.

## Work Completed in Bannon (2026-10-05)
- Texture Studio integrated into Model Lab (touch texture painter)
- Sombra Negra v9 model (skeleton bodysuit, leg bones) in assets/models/
- Sombra added to MODEL_LIBRARY and CHAR_ALT_MODELS
- Character customization PWA (standalone)

## Migration to AshLane
All work is being ported to AshLane for better performance.
