// src/data/schemas.ts

export enum ECreationCategory {
    Superstar_Body = 'Superstar_Body',
    Superstar_Face = 'Superstar_Face',
    Superstar_Hair = 'Superstar_Hair',
    Superstar_Torso = 'Superstar_Torso',
    Superstar_Masks = 'Superstar_Masks',
    Superstar_Clothing = 'Superstar_Clothing',
    Superstar_Accessories = 'Superstar_Accessories',
    Superstar_Payback = 'Superstar_Payback',
    Moveset_Library = 'Moveset_Library',
    Arena_Barricade = 'Arena_Barricade',
    Arena_Ramp = 'Arena_Ramp',
    Arena_Tron = 'Arena_Tron',
    Entrance_Sequence = 'Entrance_Sequence'
}

export enum EUnlockState {
    Locked = 'Locked',
    Unlocked = 'Unlocked',
    DLC = 'DLC'
}

export interface FCreationItemRow {
    ItemID: string;
    Category: ECreationCategory;
    Subcategory: string;
    DisplayName: string;
    ThumbnailIcon: string;
    AssetRef: string;
    UnlockState: EUnlockState;
    SlotIndex: number;
    bAllowsLayering: boolean;
}

export interface UCreationPartAsset {
    ItemID: string;
    Category: ECreationCategory;
    PartMesh: string;
    MaterialVariants: string[];
    MaxLayerCount?: number;
    bAllowsLayering: boolean;
    SlotTags: string[];
}

export enum EOpponentState {
    Standing = 'Standing',
    GroundedFaceUp = 'GroundedFaceUp',
    GroundedFaceDown = 'GroundedFaceDown',
    Dazed = 'Dazed',
    DazedInRopes = 'DazedInRopes',
    StunnedInCorner = 'StunnedInCorner',
    TreeOfWoe = 'TreeOfWoe',
    OnTopRope = 'OnTopRope',
    OnApron = 'OnApron',
    SeatedMidRope = 'SeatedMidRope',
    SeatedTopRope = 'SeatedTopRope',
    SeatedGround = 'SeatedGround',
    OutsideFloor = 'OutsideFloor',
    AtGuardrail = 'AtGuardrail',
    AtTable = 'AtTable'
}

export enum EFacing {
    Front = 'Front',
    Rear = 'Rear'
}

export enum ELocation {
    CenterRing = 'CenterRing',
    NearRopes = 'NearRopes',
    Corner = 'Corner',
    Apron = 'Apron',
    Floor = 'Floor',
    TopRope = 'TopRope'
}

export enum EDirectionalVariant {
    Neutral = 'Neutral',
    Up = 'Up',
    Down = 'Down',
    Left = 'Left',
    Right = 'Right'
}

export interface UMovesetLibraryAsset {
    MoveID: string;
    PositionGroup: string;
    MoveClass: string;
    MoveMontage: string;
    PreviewThumbnail: string;
    StaminaCost: number;
    UnlockState: EUnlockState;
    // State Gating
    RequiredOpponentState?: EOpponentState;
    RequiredFacing?: EFacing;
    RequiredLocation?: ELocation;
    DirectionalVariant?: EDirectionalVariant;
}

export enum EPaybackEffect {
    Buff = 'Buff',
    Stun = 'Stun',
    Escape = 'Escape',
    StealMove = 'StealMove',
    SummonAlly = 'SummonAlly'
}

export interface PaybackSystem {
    PaybackID: string;
    DisplayName: string;
    TriggerCondition: string;
    EffectType: EPaybackEffect;
    bCausesDisqualification: boolean;
}

export interface InjuryPersistence {
    head: number;
    torso: number;
    leftArm: number;
    rightArm: number;
    leftLeg: number;
    rightLeg: number;
    // Helper to calculate speed/movement modifiers based on injuries
    calculateSpeedModifier?(): number;
    calculateTurnRadiusModifier?(): number;
}

export interface FEquippedItem {
    ItemID: string;
    LayerOrder: number;
    ColorOverride: { r: number, g: number, b: number, a: number };
    Opacity: number;
}

export interface FCreationSaveProfile {
    ProfileID: string;
    SuperstarName: string;
    BodyTemplate: string;
    SliderValues: Record<string, number>;
    EquippedItems: FEquippedItem[];
    MovesetSlots: Record<string, string>;
    PoseID: string;
    SubTraits?: string[]; // Persistent personality / gameplay sub-traits
    Injuries?: InjuryPersistence; // Limb injury damage state
}
