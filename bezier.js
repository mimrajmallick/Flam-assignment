/**
 * INTERACTIVE BÉZIER CURVE WITH PHYSICS
 * Complete implementation from scratch - no external libraries
 * Cubic Bézier formula + Spring physics + Dual input modes
 */

//  VECTOR MATH 
class Vector2 {
    constructor(x = 0, y = 0) { this.x = x; this.y = y; }
    add(v) { return new Vector2(this.x + v.x, this.y + v.y); }
    subtract(v) { return new Vector2(this.x - v.x, this.y - v.y); }
    multiply(s) { return new Vector2(this.x * s, this.y * s); }
    length() { return Math.sqrt(this.x * this.x + this.y * this.y); }
    normalize() { 
        const len = this.length();
        return len === 0 ? new Vector2(0, 0) : new Vector2(this.x / len, this.y / len);
    }
    distanceTo(v) { return this.subtract(v).length(); }
    copy() { return new Vector2(this.x, this.y); }
}

//  PHYSICS CONTROL POINT 
class ControlPoint {
    constructor(x, y, fixed = false) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(0, 0);
        this.target = new Vector2(x, y);
        this.isFixed = fixed;
        this.isDragging = false;
        this.radius = 10;
    }
    
    applyPhysics(stiffness, damping, dt) {
        if (this.isFixed || this.isDragging) return;
        
        const springForce = this.target.subtract(this.position).multiply(stiffness);
        const dampingForce = this.velocity.multiply(-damping);
        const acceleration = springForce.add(dampingForce);
        
        this.velocity = this.velocity.add(acceleration.multiply(dt));
        this.position = this.position.add(this.velocity.multiply(dt));
        this.velocity = this.velocity.multiply(0.99);
    }
    
    contains(point) { return this.position.distanceTo(point) <= this.radius; }
    
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.isDragging ? '#ff4081' : 
                       this.isFixed ? '#64ffda' : '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        if (!this.isFixed && !this.isDragging) {
            ctx.beginPath();
            ctx.arc(this.target.x, this.target.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 64, 129, 0.5)';
            ctx.fill();
        }
    }
}

//  BÉZIER CURVE MATH 
class BezierCurve {
    constructor(p0, p1, p2, p3) {
        this.points = [p0, p1, p2, p3];
        this.curve = [];
        this.tangents = [];
        this.segments = 100;
    }
    
    calculatePoint(t) {
        const u = 1 - t;
        const tt = t * t;
        const uu = u * u;
        const uuu = uu * u;
        const ttt = tt * t;
        
        const p0 = this.points[0].position.multiply(uuu);
        const p1 = this.points[1].position.multiply(3 * uu * t);
        const p2 = this.points[2].position.multiply(3 * u * tt);
        const p3 = this.points[3].position.multiply(ttt);
        
        return p0.add(p1).add(p2).add(p3);
    }
    
    calculateTangent(t) {
        const u = 1 - t;
        const p0 = this.points[0].position;
        const p1 = this.points[1].position;
        const p2 = this.points[2].position;
        const p3 = this.points[3].position;
        
        const term1 = p1.subtract(p0).multiply(3 * u * u);
        const term2 = p2.subtract(p1).multiply(6 * u * t);
        const term3 = p3.subtract(p2).multiply(3 * t * t);
        
        return term1.add(term2).add(term3);
    }
    
    update() {
        this.curve = [];
        this.tangents = [];
        
        for (let i = 0; i <= this.segments; i++) {
            const t = i / this.segments;
            this.curve.push(this.calculatePoint(t));
            
            if (i % 10 === 0) {
                const tangent = this.calculateTangent(t);
                const normalized = tangent.normalize();
                const point = this.calculatePoint(t);
                this.tangents.push({ point: point, vector: normalized });
            }
        }
    }
    
    draw(ctx) {
        ctx.strokeStyle = 'rgba(100, 255, 218, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        ctx.moveTo(this.points[0].position.x, this.points[0].position.y);
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].position.x, this.points[i].position.y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.strokeStyle = '#64ffda';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.curve[0].x, this.curve[0].y);
        for (let i = 1; i < this.curve.length; i++) {
            ctx.lineTo(this.curve[i].x, this.curve[i].y);
        }
        ctx.stroke();
        
        ctx.strokeStyle = '#ff4081';
        ctx.lineWidth = 2;
        for (const tangent of this.tangents) {
            const start = tangent.point;
            const end = start.add(tangent.vector.multiply(30));
            
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
            
            const angle = Math.atan2(end.y - start.y, end.x - start.x);
            const size = 8;
            
            ctx.beginPath();
            ctx.moveTo(end.x, end.y);
            ctx.lineTo(end.x - size * Math.cos(angle - Math.PI / 6), end.y - size * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(end.x, end.y);
            ctx.lineTo(end.x - size * Math.cos(angle + Math.PI / 6), end.y - size * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
        }
        
        for (const point of this.points) {
            point.draw(ctx);
        }
    }
}

//  MAIN APP 
class BezierApp {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 500;
        
        this.p0 = new ControlPoint(this.canvas.width * 0.2, this.canvas.height * 0.5, true);
        this.p1 = new ControlPoint(this.canvas.width * 0.4, this.canvas.height * 0.3);
        this.p2 = new ControlPoint(this.canvas.width * 0.6, this.canvas.height * 0.7);
        this.p3 = new ControlPoint(this.canvas.width * 0.8, this.canvas.height * 0.5, true);
        
        this.curve = new BezierCurve(this.p0, this.p1, this.p2, this.p3);
        
        this.physics = { stiffness: 0.08, damping: 0.92 };
        this.mode = 'mouse';
        this.dragged = null;
        this.mousePos = new Vector2(this.canvas.width / 2, this.canvas.height / 2);
        this.lastTime = 0;
        this.fps = 60;
        
        this.setupEvents();
        this.initMotion();
        requestAnimationFrame((t) => this.loop(t));
    }
    
    setupEvents() {
        this.canvas.addEventListener('mousedown', (e) => this.mouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.mouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.mouseUp());
        this.canvas.addEventListener('mouseleave', () => this.mouseUp());
        
        document.getElementById('stiffness').addEventListener('input', (e) => {
            this.physics.stiffness = parseFloat(e.target.value);
            document.getElementById('stiffnessValue').textContent = this.physics.stiffness.toFixed(2);
        });
        
        document.getElementById('damping').addEventListener('input', (e) => {
            this.physics.damping = parseFloat(e.target.value);
            document.getElementById('dampingValue').textContent = this.physics.damping.toFixed(2);
        });
        
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('modeBtn').addEventListener('click', () => this.switchMode());
    }
    
    initMotion() {
        if ('DeviceMotionEvent' in window) {
            if (typeof DeviceMotionEvent.requestPermission === 'function') {
                document.getElementById('modeBtn').addEventListener('click', async () => {
                    try {
                        const perm = await DeviceMotionEvent.requestPermission();
                        if (perm === 'granted') {
                            window.addEventListener('devicemotion', (e) => this.handleMotion(e));
                        }
                    } catch (e) { console.log('Motion denied'); }
                });
            } else {
                window.addEventListener('devicemotion', (e) => this.handleMotion(e));
            }
        }
    }
    
    handleMotion(e) {
        if (this.mode !== 'motion') return;
        if (e.rotationRate) {
            const beta = e.rotationRate.beta || 0;
            const gamma = e.rotationRate.gamma || 0;
            const sens = 8;
            
            this.p1.target.x += gamma * sens;
            this.p1.target.y += beta * sens;
            this.p2.target.x -= gamma * sens * 0.7;
            this.p2.target.y -= beta * sens * 0.7;
            
            this.clampTargets();
        }
    }
    
    clampTargets() {
        const margin = 50;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        this.p1.target.x = Math.max(margin, Math.min(this.p1.target.x, w - margin));
        this.p1.target.y = Math.max(margin, Math.min(this.p1.target.y, h - margin));
        this.p2.target.x = Math.max(margin, Math.min(this.p2.target.x, w - margin));
        this.p2.target.y = Math.max(margin, Math.min(this.p2.target.y, h - margin));
    }
    
    mouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const pos = new Vector2(e.clientX - rect.left, e.clientY - rect.top);
        
        for (const point of this.curve.points) {
            if (!point.isFixed && point.contains(pos)) {
                this.dragged = point;
                point.isDragging = true;
                break;
            }
        }
    }
    
    mouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const pos = new Vector2(e.clientX - rect.left, e.clientY - rect.top);
        
        this.mousePos = pos.copy();
        
        if (this.dragged) {
            this.dragged.position = pos.copy();
            this.dragged.target = pos.copy();
            this.dragged.velocity = new Vector2(0, 0);
        } else if (this.mode === 'mouse') {
            const center = new Vector2(this.canvas.width / 2, this.canvas.height / 2);
            const offset = pos.subtract(center).multiply(0.005);
            
            this.p1.target = new Vector2(
                this.canvas.width * 0.4 + offset.x * 200,
                this.canvas.height * 0.3 + offset.y * 200
            );
            
            this.p2.target = new Vector2(
                this.canvas.width * 0.6 - offset.x * 150,
                this.canvas.height * 0.7 - offset.y * 150
            );
            
            this.clampTargets();
        }
    }
    
    mouseUp() {
        if (this.dragged) {
            this.dragged.isDragging = false;
            this.dragged = null;
        }
    }
    
    switchMode() {
        this.mode = this.mode === 'mouse' ? 'motion' : 'mouse';
        document.getElementById('mode').textContent = `Mode: ${this.mode.charAt(0).toUpperCase() + this.mode.slice(1)}`;
        document.getElementById('modeBtn').textContent = 
            this.mode === 'mouse' ? 'Enable Motion Control' : 'Enable Mouse Control';
    }
    
    reset() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        this.p1.position = new Vector2(w * 0.4, h * 0.3);
        this.p1.target = this.p1.position.copy();
        this.p1.velocity = new Vector2(0, 0);
        
        this.p2.position = new Vector2(w * 0.6, h * 0.7);
        this.p2.target = this.p2.position.copy();
        this.p2.velocity = new Vector2(0, 0);
        
        this.dragged = null;
    }
    
    updatePhysics(dt) {
        for (const point of this.curve.points) {
            point.applyPhysics(this.physics.stiffness, this.physics.damping, dt);
        }
    }
    
    draw() {
        this.ctx.fillStyle = '#0a192f';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.curve.draw(this.ctx);
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '14px monospace';
        this.ctx.fillText(`Mode: ${this.mode}`, 10, 25);
        this.ctx.fillText(`Stiffness: ${this.physics.stiffness.toFixed(2)}`, 10, 45);
        this.ctx.fillText(`Damping: ${this.physics.damping.toFixed(2)}`, 10, 65);
    }
    
    loop(timestamp) {
        const dt = this.lastTime === 0 ? 1/60 : (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;
        
        const stableDt = Math.min(dt, 1/30);
        
        this.updatePhysics(stableDt);
        this.curve.update();
        this.draw();
        
        requestAnimationFrame((ts) => this.loop(ts));
    }
}

// Start the app
window.addEventListener('load', () => {
    new BezierApp();
});