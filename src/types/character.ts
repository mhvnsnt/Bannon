// src/types/character.ts
import { FCreationSaveProfile, FEquippedItem, InjuryPersistence } from '../data/schemas';

export interface BodySliders {
    headSize: number;
    neck: number;
    shoulders: number;
    arms: number;
    chest: number;
    waist: number;
    hips: number;
    legs: number;
    height: number;
    muscleWeight: number; // bone-scale driven
    armLength?: number;
    legLength?: number;
}

export interface FaceCustomization {
    headShape: Record<string, number>;
    eyes: { shape: number; size: number; color: string; spacing: number };
    nose?: { width: number; height: number };
    mouth?: { width: number; lipThickness: number };
    teeth: string;
    eyelashes: string;
    makeupLayers: FEquippedItem[];
    paintLayers: FEquippedItem[]; // layered, UV-masked, color/opacity per layer
    scars: string[];
    blemishes: string[];
}

export interface ClothingSlots {
    headwear?: FEquippedItem[];
    upperBody: FEquippedItem[];
    lowerBody: FEquippedItem[];
    footwear?: FEquippedItem[];
}

export interface SuperstarProfile {
    id: string;
    name: string;
    bodyTemplate: string;
    bodySliders: BodySliders;
    pose: string;
    face: FaceCustomization;
    hair: { style: FEquippedItem; facialHair: FEquippedItem };
    torso: { base: FEquippedItem; accessories: FEquippedItem[] };
    masks: FEquippedItem[];
    clothing: ClothingSlots;
    accessories: FEquippedItem[]; // wrist/knee/elbow gear
    traits?: string[]; // Persistent personality / behavioral traits
    injuries?: InjuryPersistence; // Limb injury damage history and modifiers
}

export class SuperstarSerializer {
    static toSaveProfile(profile: SuperstarProfile): FCreationSaveProfile {
        const sliderValues: Record<string, number> = {
            headSize: profile.bodySliders.headSize,
            neck: profile.bodySliders.neck,
            shoulders: profile.bodySliders.shoulders,
            arms: profile.bodySliders.arms,
            chest: profile.bodySliders.chest,
            waist: profile.bodySliders.waist,
            hips: profile.bodySliders.hips,
            legs: profile.bodySliders.legs,
            height: profile.bodySliders.height,
            muscleWeight: profile.bodySliders.muscleWeight,
            armLength: profile.bodySliders.armLength || 0,
            legLength: profile.bodySliders.legLength || 0,
            eyeShape: profile.face.eyes.shape,
            eyeSize: profile.face.eyes.size,
            eyeSpacing: profile.face.eyes.spacing,
            jawWidth: profile.face.headShape.jawWidth || 50,
            chinSize: profile.face.headShape.chinSize || 50,
            noseWidth: profile.face.nose?.width || 0,
            noseHeight: profile.face.nose?.height || 0,
            mouthWidth: profile.face.mouth?.width || 0,
            lipThickness: profile.face.mouth?.lipThickness || 0
        };

        const equippedItems: FEquippedItem[] = [
            ...(profile.face.makeupLayers || []),
            ...(profile.face.paintLayers || []),
            profile.hair?.style,
            profile.hair?.facialHair,
            profile.torso?.base,
            ...(profile.torso?.accessories || []),
            ...(profile.masks || []),
            ...(profile.clothing?.headwear || []),
            ...(profile.clothing?.upperBody || []),
            ...(profile.clothing?.lowerBody || []),
            ...(profile.clothing?.footwear || []),
            ...(profile.accessories || [])
        ].filter(Boolean) as FEquippedItem[];

        return {
            ProfileID: profile.id,
            SuperstarName: profile.name,
            BodyTemplate: profile.bodyTemplate,
            SliderValues: sliderValues,
            EquippedItems: equippedItems,
            MovesetSlots: {}, // Populated separately or merged
            PoseID: profile.pose || 'pose_ready',
            SubTraits: profile.traits || [],
            Injuries: profile.injuries || { head: 0, torso: 0, leftArm: 0, rightArm: 0, leftLeg: 0, rightLeg: 0 }
        };
    }

    static toJson(profile: SuperstarProfile): string {
        return JSON.stringify(this.toSaveProfile(profile));
    }

    static fromSaveProfile(save: FCreationSaveProfile): SuperstarProfile {
        const getSlider = (key: string, def: number) => save.SliderValues?.[key] ?? def;

        const bodySliders: BodySliders = {
            headSize: getSlider('headSize', 50),
            neck: getSlider('neck', 50),
            shoulders: getSlider('shoulders', 50),
            arms: getSlider('arms', 50),
            chest: getSlider('chest', 50),
            waist: getSlider('waist', 50),
            hips: getSlider('hips', 50),
            legs: getSlider('legs', 50),
            height: getSlider('height', 185),
            muscleWeight: getSlider('muscleWeight', 80),
            armLength: getSlider('armLength', 0),
            legLength: getSlider('legLength', 0)
        };

        const items = save.EquippedItems || [];
        const findItem = (prefix: string, def: any) => items.find(item => item.ItemID.startsWith(prefix)) || def;
        const filterItems = (prefixes: string[]) => items.filter(item => prefixes.some(p => item.ItemID.startsWith(p)));

        return {
            id: save.ProfileID,
            name: save.SuperstarName || 'Saved Superstar',
            bodyTemplate: save.BodyTemplate || 'heavyweight_A',
            bodySliders,
            pose: save.PoseID || 'pose_ready',
            face: {
                headShape: { jawWidth: getSlider('jawWidth', 50), chinSize: getSlider('chinSize', 50) },
                eyes: { shape: getSlider('eyeShape', 1), size: getSlider('eyeSize', 50), color: '#ff0000', spacing: getSlider('eyeSpacing', 50) },
                nose: { width: getSlider('noseWidth', 0), height: getSlider('noseHeight', 0) },
                mouth: { width: getSlider('mouthWidth', 0), lipThickness: getSlider('lipThickness', 0) },
                teeth: 'clean',
                eyelashes: 'standard',
                makeupLayers: filterItems(['makeup_']),
                paintLayers: filterItems(['paint_']),
                scars: [],
                blemishes: []
            },
            hair: {
                style: findItem('hair_', { ItemID: 'hair_short', LayerOrder: 0, ColorOverride: { r: 0.1, g: 0.1, b: 0.1, a: 1 }, Opacity: 1 }) as FEquippedItem,
                facialHair: findItem('beard_', { ItemID: 'none', LayerOrder: 0, ColorOverride: { r: 0.1, g: 0.1, b: 0.1, a: 1 }, Opacity: 1 }) as FEquippedItem
            },
            torso: {
                base: findItem('skin_', { ItemID: 'skin_default', LayerOrder: 0, ColorOverride: { r: 1, g: 0.8, b: 0.7, a: 1 }, Opacity: 1 }) as FEquippedItem,
                accessories: filterItems(['torso_acc_'])
            },
            masks: filterItems(['mask_']),
            clothing: {
                headwear: filterItems(['headwear_', 'hat_']),
                upperBody: filterItems(['upper_', 'jacket_', 'shirt_']),
                lowerBody: filterItems(['lower_', 'trunks_', 'pants_']),
                footwear: filterItems(['footwear_', 'boots_', 'shoes_'])
            },
            accessories: filterItems(['acc_']),
            traits: save.SubTraits || [],
            injuries: save.Injuries || { head: 0, torso: 0, leftArm: 0, rightArm: 0, leftLeg: 0, rightLeg: 0 }
        };
    }
}

export function createDefaultProfile(): SuperstarProfile {
    return {
        id: 'bannon_superstar_1',
        name: 'John Bannon',
        bodyTemplate: 'heavyweight_A',
        bodySliders: {
            headSize: 50,
            neck: 50,
            shoulders: 50,
            arms: 50,
            chest: 50,
            waist: 50,
            hips: 50,
            legs: 50,
            height: 185,
            muscleWeight: 80,
        },
        pose: 'pose_ready',
        face: {
            headShape: { jawWidth: 50, chinSize: 50 },
            eyes: { shape: 1, size: 50, color: '#3b82f6', spacing: 50 },
            teeth: 'clean',
            eyelashes: 'standard',
            makeupLayers: [],
            paintLayers: [],
            scars: [],
            blemishes: []
        },
        hair: {
            style: { ItemID: 'hair_short', LayerOrder: 0, ColorOverride: { r: 0.1, g: 0.1, b: 0.1, a: 1 }, Opacity: 1 },
            facialHair: { ItemID: 'none', LayerOrder: 0, ColorOverride: { r: 0.1, g: 0.1, b: 0.1, a: 1 }, Opacity: 1 }
        },
        torso: {
            base: { ItemID: 'skin_default', LayerOrder: 0, ColorOverride: { r: 1, g: 0.8, b: 0.7, a: 1 }, Opacity: 1 },
            accessories: []
        },
        masks: [],
        clothing: {
            upperBody: [],
            lowerBody: [
                { ItemID: 'trunks_default', LayerOrder: 1, ColorOverride: { r: 0.1, g: 0.1, b: 0.1, a: 1 }, Opacity: 1 }
            ]
        },
        accessories: [],
        traits: [
            "aggression:0.50",
            "defense:0.50",
            "range:0.50",
            "grapple:0.50",
            "risk:0.50",
            "patience:0.50",
            "showmanship:0.50"
        ],
        injuries: {
            head: 0,
            torso: 0,
            leftArm: 0,
            rightArm: 0,
            leftLeg: 0,
            rightLeg: 0
        }
    };
}
