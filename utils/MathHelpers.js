/**
 * MathHelpers.js
 * 
 * Utility module for mathematical operations and tactical calculations.
 * Provides vector math, interpolation, and football-specific calculations.
 * 
 * ARCHITECTURAL DECISION:
 * - Centralize math operations to avoid duplicate code
 * - Performance-optimized functions for frequent calculations
 * - Pure functions (no side effects) for predictability
 */

const MathHelpers = {
    
    /**
     * Calculate distance between two points
     * Used for: proximity checks, tactical positioning
     */
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },
    
    /**
     * Calculate angle between two points (in radians)
     * Used for: player orientation, shooting direction
     */
    angleBetween(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },
    
    /**
     * Normalize vector to unit length
     * Returns: { x, y } with length = 1
     */
    normalize(x, y) {
        const length = Math.sqrt(x * x + y * y);
        if (length === 0) return { x: 0, y: 0 };
        return {
            x: x / length,
            y: y / length
        };
    },
    
    /**
     * Linear interpolation between two values
     * t = 0 returns start, t = 1 returns end
     * Used for: smooth transitions, AI decisions
     */
    lerp(start, end, t) {
        return start + (end - start) * t;
    },
    
    /**
     * Clamp value between min and max
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },
    
    /**
     * Calculate interception point for moving target
     * Used by AI to predict ball trajectory
     * 
     * @param {Object} chaser - {x, y, speed}
     * @param {Object} target - {x, y, vx, vy}
     * @returns {Object} - {x, y} interception point
     */
    calculateInterception(chaser, target) {
        const dx = target.x - chaser.x;
        const dy = target.y - chaser.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        const targetSpeed = Math.sqrt(target.vx * target.vx + target.vy * target.vy);
        
        if (targetSpeed === 0) {
            return { x: target.x, y: target.y };
        }
        
        // Predict time to interception
        const timeToIntercept = dist / (chaser.speed + targetSpeed);
        
        return {
            x: target.x + target.vx * timeToIntercept,
            y: target.y + target.vy * timeToIntercept
        };
    },
    
    /**
     * Check if point is inside rectangle
     * Used for: zone management, field bounds
     */
    pointInRect(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && 
               py >= ry && py <= ry + rh;
    },
    
    /**
     * Get closest point on line segment to given point
     * Used for: defensive positioning, blocking passing lanes
     */
    closestPointOnLine(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lengthSquared = dx * dx + dy * dy;
        
        if (lengthSquared === 0) {
            return { x: x1, y: y1 };
        }
        
        let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
        t = Math.max(0, Math.min(1, t));
        
        return {
            x: x1 + t * dx,
            y: y1 + t * dy
        };
    },
    
    /**
     * Calculate if player can intercept pass
     * Returns: probability (0-1)
     */
    calculateInterceptProbability(player, ballPos, passTarget, ballSpeed) {
        const closestPoint = this.closestPointOnLine(
            player.x, player.y,
            ballPos.x, ballPos.y,
            passTarget.x, passTarget.y
        );
        
        const distToLine = this.distance(player.x, player.y, closestPoint.x, closestPoint.y);
        const distBallToPoint = this.distance(ballPos.x, ballPos.y, closestPoint.x, closestPoint.y);
        
        const timeForBall = distBallToPoint / ballSpeed;
        const timeForPlayer = distToLine / player.stats.speed;
        
        // Player needs to be faster than ball to intercept
        if (timeForPlayer >= timeForBall) return 0;
        
        // Calculate probability based on time difference
        const timeDiff = timeForBall - timeForPlayer;
        return Math.min(1, timeDiff / 0.5); // 0.5s window = 100% probability
    },
    
    /**
     * Random value with gaussian distribution
     * More realistic than uniform random for human-like behavior
     */
    randomGaussian(mean = 0, stdDev = 1) {
        // Box-Muller transform
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        return z0 * stdDev + mean;
    },
    
    /**
     * Calculate shooting angle accuracy
     * Returns angle with human-like error based on pressure and stamina
     */
    calculateShootingAngle(shooterX, shooterY, targetX, targetY, pressure, stamina) {
        const baseAngle = this.angleBetween(shooterX, shooterY, targetX, targetY);
        
        // Error increases with pressure and low stamina
        const pressureFactor = pressure * 0.3; // Max 30% error from pressure
        const staminaFactor = (1 - stamina) * 0.2; // Max 20% error from fatigue
        const totalError = (pressureFactor + staminaFactor) * Math.PI * 0.15; // Max ~27° error
        
        const error = this.randomGaussian(0, totalError);
        return baseAngle + error;
    },
    
    /**
     * Smooth damp - spring-like movement
     * Used for: camera following, smooth AI movement
     */
    smoothDamp(current, target, velocity, smoothTime, deltaTime, maxSpeed = Infinity) {
        smoothTime = Math.max(0.0001, smoothTime);
        const omega = 2 / smoothTime;
        const x = omega * deltaTime;
        const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
        
        let change = current - target;
        const originalTo = target;
        const maxChange = maxSpeed * smoothTime;
        
        change = this.clamp(change, -maxChange, maxChange);
        target = current - change;
        
        const temp = (velocity + omega * change) * deltaTime;
        velocity = (velocity - omega * temp) * exp;
        let output = target + (change + temp) * exp;
        
        // Prevent overshooting
        if (originalTo - current > 0.0 === output > originalTo) {
            output = originalTo;
            velocity = (output - originalTo) / deltaTime;
        }
        
        return { value: output, velocity: velocity };
    }
};
