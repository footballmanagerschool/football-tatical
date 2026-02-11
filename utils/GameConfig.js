/**
 * GameConfig.js
 * 
 * Centralized configuration for game constants and tactical parameters.
 * 
 * ARCHITECTURAL DECISION:
 * - Single source of truth for game balance
 * - Easy to tweak and test different configurations
 * - Prepared for future save/load systems
 */

const GameConfig = {
    
    // ============================================
    // FIELD DIMENSIONS
    // ============================================
    FIELD: {
        WIDTH: 1100,
        HEIGHT: 600,
        X: 50,
        Y: 100,
        BOUNDS: {
            minX: 70,
            maxX: 1130,
            minY: 120,
            maxY: 680
        },
        // Tactical zones (for AI positioning)
        ZONES: {
            DEFENSIVE_THIRD: 400,      // X coordinate
            MIDFIELD_START: 400,
            MIDFIELD_END: 800,
            ATTACKING_THIRD: 800
        }
    },
    
    // ============================================
    // GOAL CONFIGURATION
    // ============================================
    GOALS: {
        LEFT: { x: 50, y: 325, width: 20, height: 150 },
        RIGHT: { x: 1130, y: 325, width: 20, height: 150 }
    },
    
    // ============================================
    // PLAYER ROLES & STATS
    // ============================================
    ROLES: {
        DEFENDER: {
            statModifiers: {
                speed: 0.85,
                defense: 1.3,
                aggression: 1.2,
                reaction: 1.1
            },
            visualScale: 1.0,
            bodyWidth: 1.1  // Wider/more robust
        },
        SPEED: {
            statModifiers: {
                speed: 1.4,
                defense: 0.7,
                aggression: 0.9,
                reaction: 1.2
            },
            visualScale: 0.95,
            bodyWidth: 0.85  // Slim/athletic
        },
        SHOOTER: {
            statModifiers: {
                speed: 0.95,
                defense: 0.8,
                aggression: 1.1,
                reaction: 1.0,
                shootPower: 1.3
            },
            visualScale: 1.0,
            bodyWidth: 1.0
        },
        DRIBBLER: {
            statModifiers: {
                speed: 1.1,
                defense: 0.75,
                aggression: 0.8,
                reaction: 1.3,
                dribble: 1.4
            },
            visualScale: 0.9,
            bodyWidth: 0.9  // Lower center of gravity
        }
    },
    
    // ============================================
    // AI TACTICAL PARAMETERS
    // ============================================
    AI: {
        // Decision-making intervals (ms)
        DECISION_INTERVAL: 150,        // How often AI re-evaluates
        REACTION_TIME_MIN: 200,        // Minimum human-like delay
        REACTION_TIME_MAX: 400,        // Maximum delay
        
        // Defensive priorities
        PRESSING_DISTANCE: 250,        // When to press ball carrier
        COVERING_DISTANCE: 180,        // When to cover teammate
        INTERCEPT_DISTANCE: 200,       // When to attempt interception
        
        // Formation compactness
        MAX_LINE_WIDTH: 400,           // Maximum spread of defensive line
        MIN_LINE_WIDTH: 250,           // Minimum spread (compact)
        VERTICAL_SPACING: 120,         // Distance between defensive lines
        
        // Role-based distances
        MARKING_DISTANCE: {
            tight: 30,                 // Very close marking
            normal: 60,                // Standard distance
            loose: 90                  // Zonal marking
        },
        
        // Stamina thresholds
        STAMINA_CRITICAL: 20,          // Force RECOVERING state
        STAMINA_LOW: 40,               // Reduce intensity
        STAMINA_RECOVERY_RATE: 0.3,    // Per second when resting
        
        // Zone abandonment rules
        ZONE_ABANDON_THRESHOLD: 0.7,   // Probability to leave zone when needed
        BALL_IN_ZONE_PRIORITY: 1.5     // Priority multiplier for ball in zone
    },
    
    // ============================================
    // PHYSICS & MOVEMENT
    // ============================================
    PHYSICS: {
        BALL: {
            BOUNCE: 0.7,
            DRAG: 0.97,
            MAX_SPEED: 800
        },
        PLAYER: {
            ACCELERATION: 12,
            DRAG: 0.98,
            FRICTION: 0.1,
            BOUNCE: 0.2,
            COLLISION_RADIUS: 12
        },
        GOALKEEPER: {
            COLLISION_RADIUS: 15,
            MOVEMENT_RANGE_X: 150,
            MOVEMENT_RANGE_Y: { min: 325, max: 475 }
        }
    },
    
    // ============================================
    // GAMEPLAY TIMING
    // ============================================
    TIMING: {
        MATCH_DURATION: 180,           // Seconds
        KICK_COOLDOWN: 300,            // MS between kicks
        ABILITY_DURATION: 7000,        // Special ability duration
        ABILITY_COOLDOWN: 10000        // Time before ability can be used again
    },
    
    // ============================================
    // VISUAL CONFIGURATION
    // ============================================
    VISUAL: {
        PLAYER_SCALE: 0.8,
        GOALKEEPER_SCALE: 0.9,
        BALL_SCALE: 1.0,
        
        // Animation parameters
        RUN_LEAN_ANGLE: 0.15,          // Radians of lean when running
        RUN_BOUNCE_AMPLITUDE: 2,       // Pixels of vertical bounce
        RUN_BOUNCE_FREQUENCY: 8,       // Bounces per second
        
        // State visual feedback
        PRESSING_GLOW: 0xffff00,
        COVERING_GLOW: 0x00ffff,
        INTERCEPTING_GLOW: 0xff00ff,
        RECOVERING_TINT: 0x888888
    },
    
    // ============================================
    // TEAM FORMATIONS
    // ============================================
    FORMATIONS: {
        // 3 players formation (current)
        THREE_PLAYERS: {
            team1: [
                { role: 'SPEED', x: 250, y: 350 },
                { role: 'DRIBBLER', x: 350, y: 250 },
                { role: 'SHOOTER', x: 350, y: 450 }
            ],
            team2: [
                { role: 'SPEED', x: 950, y: 350 },
                { role: 'DRIBBLER', x: 850, y: 250 },
                { role: 'SHOOTER', x: 850, y: 450 }
            ]
        },
        // Ready for expansion to 5v5, 7v7, 11v11
        FIVE_PLAYERS: {
            // Future implementation
        }
    },
    
    // ============================================
    // DEBUG & DEVELOPMENT
    // ============================================
    DEBUG: {
        SHOW_ZONES: false,
        SHOW_STATES: true,
        SHOW_DECISION_RAYS: false,
        LOG_STATE_TRANSITIONS: false
    }
};
