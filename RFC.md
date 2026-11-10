# Engineering RFC: Core Simulation Systems Patch & Refactoring

## Module 1: Showroom Camera Constraints & Vehicle Inspect Mode

### 1\. Issue Description

# 

-   The showroom camera controller lacks vertical polar angle constraints. Vertical dragging past normal thresholds triggers gimbal lock and flips the scene upside down.
    
      
    
-   The showroom lacks an isolated inspection mode; background track geometry and UI clutter obstruct the vehicle presentation.
    
      
    

### 2\. Implementation Specifications

#### A. Default Turntable Mode

# 

-   **Orbit Constraints**: Restrict camera pitch to near-horizontal limits (`minPolarAngle: ~75°`, `maxPolarAngle: ~85°`), preventing the camera from flipping overhead or clipping below the ground plane.
    
      
    
-   **Auto-Rotation**: Enable low-speed horizontal rotation (0.8–1.2 RPM) along the target origin.
    
      
    
-   **Input Clamping**: Disable scroll-wheel zooming and camera panning in the default state to maintain presentation framing.
    
      
    

#### B. Focus/Inspect Mode Transition

# 

-   **Raycasting & Interaction**: Attach a pointer event listener. Cast a ray from the camera to detect intersections with the car body mesh (`Raycaster.intersectObjects`).
    
      
    
-   **Camera Lerp Transition**: On click, smoothly interpolate (`lerp`/slerp) the camera position and focus target toward the vehicle center-of-mass.
    
      
    
-   **Unconstrained Azimuth & Clamped Pitch**: Allow full $360^\\circ$ horizontal orbit while keeping pitch safely clamped (`minPolarAngle: 15°`, `maxPolarAngle: 85°`).
    
      
    
-   **Distance Bounds**: Enable zoom with strict bounds (`minDistance: 3.5m`, `maxDistance: 8.0m`) to prevent clipping into interior geometry.
    
      
    
-   **Visual Isolation**: Set `visible = false` (or fade alpha) on background circuit elements, props, and redundant HUD panels. Enable a clean studio environment (dark gradient dome, soft ground shadow plane, dedicated rim/key spotlights). Provide a persistent UI toggle to exit Inspect Mode.
    
      
    

| Parameter | Default Showroom Mode | Focus / Inspect Mode |
| --- | --- | --- |
| Auto-Rotate | Enabled (0.8–1.2 RPM) | Disabled (User manual control) |
| Polar Angle Clamping | min: 75°, max: 85° | min: 15°, max: 85° |
| Distance (Zoom) | Fixed / Disabled | Clamped (min: 3.5m, max: 8.0m) |
| Scene Environment | Full Track & HUD Visible | Isolated Vehicle, Studio Keylights |

## Module 2: Surface Physics Feedback Refactor (Eliminating Screen Shake)

### 1\. Issue Description

# 

-   Contacting kerbs, grass, or run-off zones currently injects high-frequency random noise vectors directly into the camera projection matrix, causing severe screen jitter and visual disorientation.
    
      
    

### 2\. Alternative Simulation Architecture

# 

                       ```
                       ┌─ 1. Suspension Deflection: Local mesh vertical oscillation
Surface State Detection ┼─ 2. Surface Friction Scaling: Drag increase & slip factor
(Kerb / Grass / Gravel) └─ 3. Audio & Haptics: 35-50Hz sub-bass loop + Gamepad vibration
```

1.  **Suspension Displacement (Decoupled Camera)**:
    
      
    -   Remove all direct random translational noise from the camera rig.
        
          
        
    -   Model chassis response via local suspension displacement: apply a damped harmonic oscillation ($y = A e^{-\\gamma t} \\cos(\\omega t)$) to the vehicle chassis mesh when contacting kerb geometry.
        
          
        
    -   Maintain the camera tracking rig via a spring-damper system to isolate the player's view from chassis vibration.
        
          
        
2.  **Surface Friction & Drag Penalties**:
    
      
    -   **Kerbs**: Reduce tire friction coefficient to 85%; apply moderate steering resistance.
        
          
        
    -   **Grass / Run-Off**: Reduce grip to 35%–50%; increase rolling resistance coefficient ($C\_{rr}$) by a factor of 3 to force deceleration. Excess throttle should produce wheelspin and loss of traction rather than visual shaking.
        
          
        
3.  **Audio & Peripheral Haptics**:
    
      
    -   Trigger a rhythmic 35–50 Hz low-frequency audio loop matching vehicle ground velocity when running over grooved kerbs.
        
          
        
    -   Route rumble signals to controller actuators via the HTML5 Gamepad API (`vibrationActuator.playEffect`), preserving visual stability.
        
          
        

## Module 3: Sequential Checkpoint & Anti-Cheat Validation System

### 1\. Issue Description

# 

-   The timing system relies on a single finish line trigger box without forward velocity verification or circuit coverage checks. Reversing over the line immediately registers an artificial lap under 1 second.
    
      
    

### 2\. Implementation Specifications

#### A. Sector Gate Pipeline & State Machine

# 

Partition the circuit into sequential virtual trigger planes ($CP\_0, CP\_1, CP\_2, \\dots, CP\_n$). Lap progression must satisfy strict sequential transitions:

  
```
[Start Line: CP_0] ──(Forward)──> [Gate: CP_1] ──(Forward)──> [Gate: CP_n] ──(Forward)──> [Finish Line: CP_0]
        │                               │                             │                                │
        └───────────────────────────────┴──── Missed Gate / Reverse ──┴────────────────────────────────┴──> [Invalidate Lap]
```

#### B. Directional Dot Product Validation

# 

Each checkpoint plane defines a normalized forward track vector $\\vec{N}$. When the vehicle bounding box intersects checkpoint $k$, evaluate the dot product against vehicle velocity $\\vec{V}\_{car}$:

  

$$\\vec{V}\_{car} \\cdot \\vec{N} > 0$$

-   **Positive ($> 0$)**: Valid forward entry. Register gate $k$ as cleared.
    
      
    
-   **Negative or Zero ($\\le 0$)**: Reverse entry detected. Ignore trigger, suppress lap completion, and issue a "WRONG WAY" state flag.
    
      
    

#### C. Validation Logic Checklist

# 

-   **Sequential Index Matching**: Enforce strict gate ordering ($Index\_{next} = Index\_{current} + 1$). Reaching $CP\_0$ without clearing all intermediate gates ($0 \\dots n$) rejects lap completion.
    
      
    
-   **Minimum Sector Threshold (Anti-Teleport/Shortcut)**: Define theoretical minimum durations for each sector ($\\Delta t\_{min}$). If $(t\_{k} - t\_{k-1}) < \\Delta t\_{min}$, invalidate the current lap timing.
    
      
    
-   **Start-Line Reverse Lock**: Reversing backward across $CP\_0$ directly after a race start is flagged as an invalid collision; timer reset and lap increments are explicitly blocked.
    

## Delivery Phases & Acceptance Criteria

# 

| Phase | Milestone | Acceptance Criteria |
| --- | --- | --- |
| Phase 1 | Checkpoint & Anti-Cheat Pipeline (Highest Priority) | Reversing over the start line does not log a lap. Bypassing any gate prevents lap completion. Laps completed below the absolute physical circuit threshold are marked INVALID. |
| Phase 2 | Showroom Camera & Focus Mode | Camera orientation cannot invert vertically. Clicking the car smoothly transitions into inspect mode with zoom limits, isolating the vehicle and hiding exterior props. |
| Phase 3 | Surface Physics & Suspension Dampening | Camera shake vectors completely removed. Kerb contact produces chassis suspension deflection, audio rumble, and traction loss on grass/gravel surfaces. |
