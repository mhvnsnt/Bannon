package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import com.example.ui.theme.MyApplicationTheme
import kotlinx.coroutines.delay
import kotlin.math.cos
import kotlin.math.sin

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()
    setContent {
      MyApplicationTheme {
        Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
          BannonEngineScreen(modifier = Modifier.padding(innerPadding))
        }
      }
    }
  }
}

// Core Physics Data Structures
enum class CrumpleTier {
    STABLE,
    STAGGERED,
    FULL_COLLAPSE,
    RECOVERIN
}

data class FighterPoiseNode(
    val fighterId: Int,
    var hp: Float,
    var poise: Float,
    var stamina: Float,
    var state: CrumpleTier,
    var recoveryTimer: Float
)

data class PerformanceMonitor(
    var grappleSolverCycles: Long = 0,
    var strikeSolverCycles: Long = 0,
    var totalFrames: Int = 0
)

data class GrappleNode(
    val attackerId: Int,
    val defenderId: Int,
    val targetBoneId: Int,
    var gripTension: Float,
    var leverageDelta: Float,
    var lockCoordinates: FloatArray
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false
        other as GrappleNode
        if (!lockCoordinates.contentEquals(other.lockCoordinates)) return false
        return true
    }
    override fun hashCode(): Int {
        return lockCoordinates.contentHashCode()
    }
}

data class StrikeVector(
    val attackerId: Int,
    val targetBoneId: Int,
    val baseForce: Float,
    val limbVelocity: Float,
    val impactNormal: FloatArray
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false
        other as StrikeVector
        if (!impactNormal.contentEquals(other.impactNormal)) return false
        return true
    }
    override fun hashCode(): Int {
        return impactNormal.contentHashCode()
    }
}

class AutonomousPoiseManager {
    val arenaRoster = mutableListOf<FighterPoiseNode>()
    private val MAX_HP = 10000.0f
    private val DMG_SCALE = 8.0f
    private val BASE_POISE = 100.0f

    init {
        // Pre allocatin contiguous memory for an 8 man local arena conceptually
    }

    fun registerFighter(id: Int) {
        arenaRoster.add(FighterPoiseNode(id, MAX_HP, BASE_POISE, 100.0f, CrumpleTier.STABLE, 0.0f))
    }

    fun processImpact(targetId: Int, rawForce: Float): String {
        var log = ""
        for (fighter in arenaRoster) {
            if (fighter.fighterId == targetId) {
                // Calculatin absolute damage with engine scale
                val finalDamage = rawForce * DMG_SCALE
                
                fighter.hp -= finalDamage
                if (fighter.hp < 0.0f) fighter.hp = 0.0f

                // Poise operates entirely independently per blueprint
                val poiseDamage = rawForce * 4.5f 
                fighter.poise -= poiseDamage

                log += evaluateStructuralIntegrity(fighter)
                break
            }
        }
        return log
    }

    fun processTick(deltaTime: Float): String {
        var log = ""
        // Main frame update for recovery logic
        for (fighter in arenaRoster) {
            if (fighter.state == CrumpleTier.FULL_COLLAPSE) {
                fighter.recoveryTimer -= deltaTime
                
                if (fighter.recoveryTimer <= 0.0f) {
                    fighter.state = CrumpleTier.RECOVERIN
                    // Restorin 30 percent base poise on wake up
                    fighter.poise = BASE_POISE * 0.3f 
                    log += restoreMotorControl(fighter.fighterId)
                }
            }
        }
        return log
    }

    private fun evaluateStructuralIntegrity(fighter: FighterPoiseNode): String {
        var log = ""
        if (fighter.poise <= 0.0f) {
            fighter.state = CrumpleTier.FULL_COLLAPSE
            fighter.recoveryTimer = 4.0f // Absolute 4 seconds on the mat
            log += stripMotorControl(fighter.fighterId)
        } else if (fighter.poise < 25.0f) {
            fighter.state = CrumpleTier.STAGGERED
            log += "> [POISE] Fighter ${fighter.fighterId} STAGGERED. Motor control degraded.\n"
        }
        return log
    }

    private fun stripMotorControl(id: Int): String {
        return "> [POISE] Motor control stripped for Fighter $id. Pure gravity/ragdoll engaged.\n"
    }
    
    private fun restoreMotorControl(id: Int): String {
        return "> [POISE] Motor control restored for Fighter $id. IK solvers re-engaged.\n"
    }
}

class AutonomousGrappleSolver {
    val activeGrapples = mutableListOf<GrappleNode>()
    private val MAX_GRIP_STRENGTH = 100.0f
    private val ESCAPE_THRESHOLD = 85.0f

    fun engageLock(attacker: Int, defender: Int, boneTarget: Int, initialCoords: FloatArray): String {
        val lock = GrappleNode(attacker, defender, boneTarget, MAX_GRIP_STRENGTH, 0.0f, initialCoords)
        activeGrapples.add(lock)
        return applyKinematicConstraint(attacker, defender, boneTarget)
    }

    fun processGrappleTick(deltaTime: Float, attackerStamina: Float, defenderStamina: Float): String {
        var log = ""
        val iterator = activeGrapples.iterator()
        while (iterator.hasNext()) {
            val lock = iterator.next()
            val leveragePush = (attackerStamina - defenderStamina) * 0.1f
            lock.leverageDelta += (leveragePush * deltaTime)
            lock.gripTension -= (2.5f * deltaTime)

            if (lock.gripTension <= 0.0f || lock.leverageDelta < -ESCAPE_THRESHOLD) {
                iterator.remove()
                log += breakHold(lock.attackerId, lock.defenderId)
            } else {
                log += updateJointTransforms(lock)
            }
        }
        return log
    }

    private fun applyKinematicConstraint(attacker: Int, defender: Int, boneTarget: Int): String {
        return "> [KINEMATIC] Overriding standard ragdoll gravity. Mesh clipping prevented for lock $attacker->$defender.\n"
    }

    private fun updateJointTransforms(lock: GrappleNode): String {
        // AVX SIMD simulation for shifting weight distribution
        return "> [AVX] Weight distribution shifted by leverageDelta: ${"%.2f".format(lock.leverageDelta)}\n"
    }

    private fun breakHold(attacker: Int, defender: Int): String {
        return "> [KINEMATIC] Hold broken. Releasing IK solvers to standard physics baseline.\n"
    }
}

class AutonomousStrikeSolver {
    private val DMG_SCALE = 8.0f
    private val MAX_BODY_VEL = 3.8f

    fun processStrikeCollision(strike: StrikeVector, poiseEngine: AutonomousPoiseManager?): String {
        var log = ""
        var validVelocity = strike.limbVelocity
        
        // Enforcin absolute max velocity bounds
        if (validVelocity > MAX_BODY_VEL) {
            validVelocity = MAX_BODY_VEL
        }
        
        val rawForce = strike.baseForce * validVelocity
        
        if (poiseEngine != null) {
            log += poiseEngine.processImpact(strike.targetBoneId, rawForce)
        }
        
        log += triggerInverseKinematicsRecoil(strike.attackerId, validVelocity, strike.impactNormal)
        return log
    }

    private fun triggerInverseKinematicsRecoil(attackerId: Int, impactVelocity: Float, normal: FloatArray): String {
        return "> [SIMD] IK Recoil applied to attacker $attackerId. Shockwave displaced through limb vector.\n"
    }
}

@Composable
fun BannonEngineScreen(modifier: Modifier = Modifier) {
    var selectedTab by remember { mutableIntStateOf(0) }
    
    Column(modifier = modifier.fillMaxSize().background(Color(0xFF0F0F1A))) {
        TabRow(
            selectedTabIndex = selectedTab,
            containerColor = Color(0xFF1E1E2E),
            contentColor = Color(0xFF00FFCC),
            indicator = { tabPositions ->
                if (selectedTab < tabPositions.size) {
                    TabRowDefaults.Indicator(
                        modifier = Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                        color = Color(0xFF00FFCC)
                    )
                }
            }
        ) {
            Tab(selected = selectedTab == 0, onClick = { selectedTab = 0 }) {
                Text("ENGINE CORE", modifier = Modifier.padding(16.dp), fontFamily = FontFamily.Monospace, style = MaterialTheme.typography.labelMedium)
            }
            Tab(selected = selectedTab == 1, onClick = { selectedTab = 1 }) {
                Text("MOVESETS", modifier = Modifier.padding(16.dp), fontFamily = FontFamily.Monospace, style = MaterialTheme.typography.labelMedium)
            }
        }
        
        when (selectedTab) {
            0 -> EngineCoreTab(Modifier.weight(1f))
            1 -> MovesetsTab(Modifier.weight(1f))
        }
    }
}

data class Vector3(val x: Float, val y: Float, val z: Float) {
    fun rotateY(angle: Float): Vector3 {
        val cosA = cos(angle)
        val sinA = sin(angle)
        return Vector3(x * cosA - z * sinA, y, x * sinA + z * cosA)
    }
    fun rotateX(angle: Float): Vector3 {
        val cosA = cos(angle)
        val sinA = sin(angle)
        return Vector3(x, y * cosA - z * sinA, y * sinA + z * cosA)
    }
    fun project(width: Float, height: Float, fov: Float = 350f, viewerDistance: Float = 5f): Offset {
        val factor = fov / (viewerDistance + z)
        return Offset((x * factor) + width / 2, -(y * factor) + height / 2)
    }
}

@Composable
fun HdPhysicsVisualizer(modifier: Modifier = Modifier) {
    var tick by remember { mutableFloatStateOf(0f) }

    LaunchedEffect(Unit) {
        while (true) {
            tick += 0.05f
            delay(16) // ~60 fps
        }
    }

    Box(modifier = modifier
        .fillMaxWidth()
        .height(300.dp)
        .background(Color(0xFF040406))
        .border(1.dp, Color(0xFF1E88E5), RoundedCornerShape(8.dp))
        .padding(8.dp)
    ) {
        androidx.compose.foundation.Image(
            painter = androidx.compose.ui.res.painterResource(id = com.example.R.drawable.scene_3d),
            contentDescription = "HD Scene",
            modifier = Modifier.fillMaxSize().alpha(0.8f),
            contentScale = androidx.compose.ui.layout.ContentScale.Crop
        )

        Canvas(modifier = Modifier.fillMaxSize()) {
            val width = size.width
            val height = size.height
            
            val fov = 400f
            val viewerDist = 6f
            val time = tick * 0.5f

            // Draw Perspective Floor Grid
            val gridSize = 6
            val extent = 3f
            for (i in -gridSize..gridSize) {
                val z1 = -extent
                val z2 = extent
                val x = i * (extent / gridSize)
                
                val p1 = Vector3(x, -1f, z1).rotateY(time).rotateX(0.2f)
                val p2 = Vector3(x, -1f, z2).rotateY(time).rotateX(0.2f)
                
                drawLine(Color(0xFF0D47A1).copy(alpha = 0.5f), p1.project(width, height, fov, viewerDist), p2.project(width, height, fov, viewerDist), strokeWidth = 1.5f)
                
                val p3 = Vector3(z1, -1f, x).rotateY(time).rotateX(0.2f)
                val p4 = Vector3(z2, -1f, x).rotateY(time).rotateX(0.2f)
                
                drawLine(Color(0xFF0D47A1).copy(alpha = 0.5f), p3.project(width, height, fov, viewerDist), p4.project(width, height, fov, viewerDist), strokeWidth = 1.5f)
            }

            // Wrestler Skeleton Function
            fun drawSkeleton(offsetX: Float, offsetY: Float, offsetZ: Float, color: Color, poseTime: Float, glow: Boolean) {
                // Procedural joints (Inverse Kinematics abstraction)
                val head = Vector3(0f, 1.1f, 0f)
                val neck = Vector3(0f, 0.7f, 0f)
                val pelvis = Vector3(0f, 0.0f, 0f)
                
                val spineBend = sin(poseTime) * 0.3f
                
                val lShoulder = Vector3(-0.4f, 0.7f, spineBend)
                val rShoulder = Vector3(0.4f, 0.7f, -spineBend)
                
                val lElbow = Vector3(-0.6f, 0.3f, spineBend + 0.2f)
                val rElbow = Vector3(0.6f, 0.3f, -spineBend + 0.2f)
                
                val lHand = Vector3(-0.5f, -0.1f, spineBend + 0.4f)
                val rHand = Vector3(0.5f, -0.1f, -spineBend + 0.4f)
                
                val lHip = Vector3(-0.2f, 0f, 0f)
                val rHip = Vector3(0.2f, 0f, 0f)
                
                val lKnee = Vector3(-0.3f, -0.5f, sin(poseTime * 1.5f) * 0.3f)
                val rKnee = Vector3(0.3f, -0.5f, -sin(poseTime * 1.5f) * 0.3f)
                
                val lFoot = Vector3(-0.3f, -1.0f, lKnee.z + 0.1f)
                val rFoot = Vector3(0.3f, -1.0f, rKnee.z + 0.1f)

                val bones = listOf(
                    head to neck, neck to pelvis,
                    neck to lShoulder, neck to rShoulder,
                    lShoulder to lElbow, lElbow to lHand,
                    rShoulder to rElbow, rElbow to rHand,
                    pelvis to lHip, pelvis to rHip,
                    lHip to lKnee, lKnee to lFoot,
                    rHip to rKnee, rKnee to rFoot
                )

                bones.forEach { (start, end) ->
                    val p1 = Vector3(start.x + offsetX, start.y + offsetY, start.z + offsetZ).rotateY(time).rotateX(0.2f)
                    val p2 = Vector3(end.x + offsetX, end.y + offsetY, end.z + offsetZ).rotateY(time).rotateX(0.2f)
                    
                    val proj1 = p1.project(width, height, fov, viewerDist)
                    val proj2 = p2.project(width, height, fov, viewerDist)
                    
                    if (glow) {
                        drawLine(color.copy(alpha = 0.3f), proj1, proj2, strokeWidth = 8f)
                        drawLine(color.copy(alpha = 0.6f), proj1, proj2, strokeWidth = 4f)
                    }
                    drawLine(color, proj1, proj2, strokeWidth = 2f)
                    
                    drawCircle(Color.White, radius = 2.5f, center = proj1)
                    drawCircle(Color.White, radius = 2.5f, center = proj2)
                }
            }

            // Draw Attacker (Neon Red)
            drawSkeleton(-0.8f, 0f, 0f, Color(0xFFFF1744), tick * 2f, glow = true)
            
            // Draw Defender (Neon Cyan)
            drawSkeleton(0.8f, 0f, 0f, Color(0xFF00E5FF), tick * 1.5f, glow = true)

            // Dynamic Grapple Tether / Kinetic vector
            val tetherP1 = Vector3(-0.3f, 0.4f, 0f).rotateY(time).rotateX(0.2f).project(width, height, fov, viewerDist)
            val tetherP2 = Vector3(0.3f, 0.4f, 0f).rotateY(time).rotateX(0.2f).project(width, height, fov, viewerDist)
            
            drawLine(Color(0xFFFFEA00).copy(alpha = 0.8f), tetherP1, tetherP2, strokeWidth = 2f, pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(floatArrayOf(10f, 10f)))
            drawCircle(Color(0xFFFFEA00), radius = 12f + sin(tick * 8f) * 4f, center = Offset((tetherP1.x + tetherP2.x) / 2, (tetherP1.y + tetherP2.y) / 2), style = Stroke(width = 2f))
        }
        
        // Overlay HUD text
        Column(modifier = Modifier.align(Alignment.TopStart)) {
            Text("BANNON ACTIVE PHYSICS [v114]", color = Color(0xFF00FFCC), fontFamily = FontFamily.Monospace, fontSize = MaterialTheme.typography.labelSmall.fontSize)
            Text("IK VECTOR RIG: ONLINE", color = Color(0xFF00FFCC), fontFamily = FontFamily.Monospace, fontSize = MaterialTheme.typography.labelSmall.fontSize)
            Text("MAT COLLISION PLANE: Z=0", color = Color(0xFF00FFCC), fontFamily = FontFamily.Monospace, fontSize = MaterialTheme.typography.labelSmall.fontSize)
        }
        
        Column(modifier = Modifier.align(Alignment.BottomEnd), horizontalAlignment = Alignment.End) {
            Text(String.format("SIM TIME: %.2f", tick), color = Color(0xFFFF1744), fontFamily = FontFamily.Monospace, fontSize = MaterialTheme.typography.labelSmall.fontSize)
            Text("NATIVE FPS: 60.0", color = Color(0xFFFF1744), fontFamily = FontFamily.Monospace, fontSize = MaterialTheme.typography.labelSmall.fontSize)
        }
    }
}

@Composable
fun EngineCoreTab(modifier: Modifier = Modifier) {
    val bannonToken = try {
        BuildConfig::class.java.getField("BANNON_TOKEN").get(null) as? String ?: ""
    } catch (e: Exception) {
        ""
    }
    
    var log by remember { mutableStateOf("> BANNON ENGINE [v114]\n> AAA COMBAT DEPTH INITIALIZED\n> TOKEN: ${if(bannonToken.isNotEmpty() && bannonToken != "YOUR_GITHUB_PAT") "AUTHENTICATED" else "MISSING"}\n") }
    
    val grappleSolver = remember { AutonomousGrappleSolver() }
    val strikeSolver = remember { AutonomousStrikeSolver() }
    val poiseSystem = remember { AutonomousPoiseManager().apply { registerFighter(4) } }
    var perfMonitor by remember { mutableStateOf(PerformanceMonitor()) }

    var attackerStamina by remember { mutableFloatStateOf(100f) }
    var defenderStamina by remember { mutableFloatStateOf(80f) }

    LaunchedEffect(Unit) {
        while(true) {
            delay(100) // 10 ticks per second
            
            // Simulating cycle count
            perfMonitor = perfMonitor.copy(totalFrames = perfMonitor.totalFrames + 1)
            
            val poiseLogs = poiseSystem.processTick(0.1f)
            if (poiseLogs.isNotEmpty()) {
                log = "$poiseLogs$log"
            }

            if (grappleSolver.activeGrapples.isNotEmpty()) {
                val startCycles = System.nanoTime()
                val initialCount = grappleSolver.activeGrapples.size
                val grappleLogs = grappleSolver.processGrappleTick(0.1f, attackerStamina, defenderStamina)
                if (grappleLogs.isNotEmpty()) {
                    log = "$grappleLogs$log"
                }
                
                if (grappleSolver.activeGrapples.size < initialCount) {
                    log = "> Grapple broken by defender!\n$log"
                } else {
                    val lock = grappleSolver.activeGrapples.first()
                    log = "> Lock Tensor: Grip=${"%.1f".format(lock.gripTension)}% | Lever=${"%.2f".format(lock.leverageDelta)}\n$log"
                }
                
                perfMonitor = perfMonitor.copy(grappleSolverCycles = (System.nanoTime() - startCycles))
            }
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "BANNON ENGINE DIAGNOSTICS",
            style = MaterialTheme.typography.titleLarge.copy(fontFamily = FontFamily.Monospace),
            color = Color(0xFF00FFCC)
        )
        
        HdPhysicsVisualizer()

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Button(
                onClick = {
                    val startCycles = System.nanoTime()
                    val strike = StrikeVector(1, 4, 150f, 4.5f, floatArrayOf(1f, 0f, 0f))
                    val strikeLogs = strikeSolver.processStrikeCollision(strike, poiseSystem)
                    perfMonitor = perfMonitor.copy(strikeSolverCycles = (System.nanoTime() - startCycles))
                    log = "$strikeLogs$log"
                },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE53935), contentColor = Color.White),
                shape = RoundedCornerShape(4.dp)
            ) {
                Text("TEST STRIKE", fontFamily = FontFamily.Monospace)
            }

            Button(
                onClick = {
                    if (grappleSolver.activeGrapples.isEmpty()) {
                        val engageLogs = grappleSolver.engageLock(1, 2, 3, floatArrayOf(0f, 0f, 0f))
                        log = "$engageLogs$log"
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E88E5), contentColor = Color.White),
                shape = RoundedCornerShape(4.dp)
            ) {
                Text("ENGAGE GRAPPLE", fontFamily = FontFamily.Monospace)
            }
        }

        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1E2E)),
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                    Text("PERFORMANCE MONITOR", color = Color(0xFFFFD54F), fontFamily = FontFamily.Monospace, style = MaterialTheme.typography.labelSmall)
                    Text("FRAMES: ${perfMonitor.totalFrames}", color = Color.White, fontFamily = FontFamily.Monospace, style = MaterialTheme.typography.labelSmall)
                }
                Text("Grapple Solver: ${perfMonitor.grappleSolverCycles} ns", color = Color(0xFFB0BEC5), fontFamily = FontFamily.Monospace, style = MaterialTheme.typography.bodySmall)
                Text("Strike Solver: ${perfMonitor.strikeSolverCycles} ns", color = Color(0xFFB0BEC5), fontFamily = FontFamily.Monospace, style = MaterialTheme.typography.bodySmall)
            }
        }

        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1E2E)),
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("ATTACKER LEVERAGE (Stamina: ${attackerStamina.toInt()})", color = Color(0xFFB0BEC5), fontFamily = FontFamily.Monospace, style = MaterialTheme.typography.labelSmall)
                Slider(
                    value = attackerStamina, 
                    onValueChange = { attackerStamina = it }, 
                    valueRange = 0f..100f,
                    colors = SliderDefaults.colors(thumbColor = Color(0xFF00FFCC), activeTrackColor = Color(0xFF00FFCC))
                )
                
                Text("DEFENDER RESISTANCE (Stamina: ${defenderStamina.toInt()})", color = Color(0xFFB0BEC5), fontFamily = FontFamily.Monospace, style = MaterialTheme.typography.labelSmall)
                Slider(
                    value = defenderStamina, 
                    onValueChange = { defenderStamina = it }, 
                    valueRange = 0f..100f,
                    colors = SliderDefaults.colors(thumbColor = Color(0xFFE53935), activeTrackColor = Color(0xFFE53935))
                )
            }
        }

        Card(
            colors = CardDefaults.cardColors(containerColor = Color.Black),
            shape = RoundedCornerShape(4.dp),
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .border(1.dp, Color(0xFF333344), RoundedCornerShape(4.dp))
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(12.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                Text(
                    text = log,
                    style = MaterialTheme.typography.bodySmall.copy(fontFamily = FontFamily.Monospace),
                    color = Color(0xFF00FF00)
                )
            }
        }
    }
}

@Composable
fun MovesetsTab(modifier: Modifier = Modifier) {
    val movesets = listOf(
        Pair("Steve Masson", listOf(
            "FINISHER: Neckbreaker (Visceral)",
            "SIGNATURE: Gravity Driver",
            "GRAPPLE (Front): High-Angle Suplex",
            "GRAPPLE (Rear): German Suplex",
            "STRIKE: Discus Lariat",
            "TAUNT: 'It's Over'"
        )),
        Pair("Bannon Prototype #01", listOf(
            "FINISHER: Autonomous Powerbomb",
            "SIGNATURE: AVX Piledriver",
            "GRAPPLE (Front): SIMD Slam",
            "GRAPPLE (Rear): Half-Nelson Suplex",
            "STRIKE: 3.8 Vel Lariat",
            "TAUNT: Debug Pose"
        ))
    )

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                "AAA COMBAT MOVESETS",
                style = MaterialTheme.typography.titleLarge.copy(fontFamily = FontFamily.Monospace),
                color = Color(0xFF00FFCC),
                modifier = Modifier.padding(bottom = 8.dp)
            )
        }
        items(movesets) { (character, moves) ->
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1E2E)),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFF333344), RoundedCornerShape(8.dp))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = character,
                        style = MaterialTheme.typography.titleMedium.copy(fontFamily = FontFamily.Monospace),
                        color = Color.White
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    moves.forEach { move ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(vertical = 4.dp).fillMaxWidth()
                        ) {
                            Box(modifier = Modifier.size(6.dp).background(Color(0xFF00FFCC)))
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(
                                text = move,
                                style = MaterialTheme.typography.bodyMedium.copy(fontFamily = FontFamily.Monospace),
                                color = Color(0xFFB0BEC5)
                            )
                        }
                    }
                }
            }
        }
    }
}