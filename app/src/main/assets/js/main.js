let simulationInterval;
let timerInterval;
let matchTime = 98;

const SEGMENTS = 15;

let p1 = {
    hp: 15,
    stamina: 100,
    trauma: { head: 100, torso: 100, lArm: 100, rArm: 100, lLeg: 100, rLeg: 100 },
    gimmick: null,
    styles: []
};

let p2 = {
    hp: 15,
    stamina: 100,
    trauma: { head: 100, torso: 100, lArm: 100, rArm: 100, lLeg: 100, rLeg: 100 },
    gimmick: null,
    styles: []
};

function initSegments(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    for(let i=0; i<SEGMENTS; i++) {
        const seg = document.createElement('div');
        seg.className = 'segment';
        seg.id = containerId + '_seg_' + i;
        container.appendChild(seg);
    }
}

function getGradientColor(percentage) {
    if (percentage > 75) return '#4caf50'; // Green
    if (percentage > 40) return '#ffeb3b'; // Yellow
    if (percentage > 15) return '#ff9800'; // Orange
    return '#f44336'; // Red
}

function updatePlayerHUD(player, prefix) {
    for(let i=0; i<SEGMENTS; i++) {
        const seg = document.getElementById(prefix + 'HealthSegments_seg_' + i);
        if (seg) {
            if (i < Math.ceil(player.hp)) seg.classList.remove('empty');
            else seg.classList.add('empty');
        }
    }
    
    document.getElementById(prefix + 'Stamina').style.width = Math.max(0, player.stamina) + '%';
    
    const t = player.trauma;
    document.getElementById(prefix + 'Head').style.background = getGradientColor(t.head);
    document.getElementById(prefix + 'Torso').style.background = getGradientColor(t.torso);
    document.getElementById(prefix + 'LArm').style.background = getGradientColor(t.lArm);
    document.getElementById(prefix + 'RArm').style.background = getGradientColor(t.rArm);
    document.getElementById(prefix + 'LLeg').style.background = getGradientColor(t.lLeg);
    document.getElementById(prefix + 'RLeg').style.background = getGradientColor(t.rLeg);
}

function applyMatchup(selection) {
    if (selection === 'heavy_clash') {
        document.getElementById('p1Name').innerText = "TITAN";
        document.getElementById('p1Sub').innerText = "Heavyweight Quake";
        document.getElementById('p2Name').innerText = "GOLEM";
        document.getElementById('p2Sub').innerText = "The Clay Colossus";
        
        if (window.ArchetypeMatrix) {
            p1.archetype = window.ArchetypeMatrix.get('strong_style_heavy');
            p2.archetype = window.ArchetypeMatrix.get('immovable_object');
        }
        if (window.GimmickBehaviorTree) {
            p1.gimmick = window.GimmickBehaviorTree.get('the_shooter');
            p2.gimmick = window.GimmickBehaviorTree.get('the_shooter');
        }
    } else if (selection === 'flyer_tech') {
        document.getElementById('p1Name').innerText = "KAGE";
        document.getElementById('p1Sub').innerText = "Karate Shadow";
        document.getElementById('p2Name').innerText = "RONIN";
        document.getElementById('p2Sub').innerText = "Wanderer Steel";
        
        if (window.ArchetypeMatrix) {
            p1.archetype = window.ArchetypeMatrix.get('karate_phantom');
            p2.archetype = window.ArchetypeMatrix.get('masterless_technician');
        }
        if (window.GimmickBehaviorTree) {
            p1.gimmick = window.GimmickBehaviorTree.get('underdog_babyface');
            p2.gimmick = window.GimmickBehaviorTree.get('ring_general');
        }
    } else {
        document.getElementById('p1Name').innerText = "BANNON";
        document.getElementById('p1Sub').innerText = "The Broken Architect";
        document.getElementById('p2Name').innerText = "VIPER";
        document.getElementById('p2Sub').innerText = "Southpaw Ice";
        
        if (window.ArchetypeMatrix) {
            p1.archetype = window.ArchetypeMatrix.get('free_agent');
            p2.archetype = window.ArchetypeMatrix.get('mat_technician');
        }
        if (window.GimmickBehaviorTree) {
            p1.gimmick = window.GimmickBehaviorTree.get('balanced');
            p2.gimmick = window.GimmickBehaviorTree.get('cowardly_heel');
        }
    }
    
    if (window.ExpandedFightingStyles) {
        window.ExpandedFightingStyles.assignToProfile(p1, 'orthodox', 'brawler', 'catch_wrestling');
        window.ExpandedFightingStyles.assignToProfile(p2, 'vale_tudo', 'shoot_fighter', 'lucha_libre');
    }
}

function processDamage(player) {
    const tax = player.archetype ? player.archetype.stamina_scaling_factor : 1.0;
    player.stamina -= (Math.random() * 3 * tax);
    if (player.stamina < 0) player.stamina = 0;
    
    let attackFreq = player.gimmick ? player.gimmick.attack_priority : 50;
    
    if (Math.random() * 100 < attackFreq * 0.1) {
        const parts = ['head', 'torso', 'lArm', 'rArm', 'lLeg', 'rLeg'];
        const target = parts[Math.floor(Math.random() * parts.length)];
        player.trauma[target] -= Math.random() * 4;
        if (player.trauma[target] < 0) player.trauma[target] = 0;
        
        if (player.trauma[target] < 30 && Math.random() > 0.8) {
            player.hp -= 1;
        }
    }
    
    if (player.stamina === 0) player.stamina += 2.0;
}

function simulateCombat() {
    processDamage(p1);
    processDamage(p2);
    
    updatePlayerHUD(p1, 'p1');
    updatePlayerHUD(p2, 'p2');
}

function decrementTimer() {
    if (matchTime > 0) matchTime--;
    document.getElementById('matchTimer').innerText = matchTime.toString().padStart(2, '0');
}

function startGame() {
    const selected = document.querySelector('input[name="archetype"]:checked').value;
    applyMatchup(selected);
    
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('topHud').style.display = 'flex';
    
    initSegments('p1HealthSegments');
    initSegments('p2HealthSegments');
    
    updatePlayerHUD(p1, 'p1');
    updatePlayerHUD(p2, 'p2');
    
    if (simulationInterval) clearInterval(simulationInterval);
    if (timerInterval) clearInterval(timerInterval);
    
    simulationInterval = setInterval(simulateCombat, 200);
    timerInterval = setInterval(decrementTimer, 1000);
    
    console.log("[MAIN] Combat Engine Loaded with Archetypes and Behavior Trees.");
}
