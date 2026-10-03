import { UMovesetLibraryAsset, EOpponentState, EFacing, ELocation, EDirectionalVariant } from '../data/schemas';

export interface MovesetFilterArgs {
    requiredOpponentState?: EOpponentState;
    requiredFacing?: EFacing;
    requiredLocation?: ELocation;
    directionalVariant?: EDirectionalVariant;
}

/**
 * Filters a list of move assets to only those that match the requested state criteria.
 * This ensures the UI only shows moves that are valid for the specific state-gating of a slot.
 */
export function filterAvailableMoves(
    moves: UMovesetLibraryAsset[],
    filterArgs: MovesetFilterArgs
): UMovesetLibraryAsset[] {
    return moves.filter(move => {
        // If a move does not define a requirement, it is considered unrestricted for that axis.
        // If it does define a requirement, it must match the requested filter exactly (if a filter is provided).
        
        if (filterArgs.requiredOpponentState && move.RequiredOpponentState) {
            if (move.RequiredOpponentState !== filterArgs.requiredOpponentState) return false;
        }
        
        if (filterArgs.requiredFacing && move.RequiredFacing) {
            if (move.RequiredFacing !== filterArgs.requiredFacing) return false;
        }
        
        if (filterArgs.requiredLocation && move.RequiredLocation) {
            if (move.RequiredLocation !== filterArgs.requiredLocation) return false;
        }
        
        if (filterArgs.directionalVariant && move.DirectionalVariant) {
            if (move.DirectionalVariant !== filterArgs.directionalVariant) return false;
        }

        return true;
    });
}
