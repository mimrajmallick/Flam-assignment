# Interactive Bézier Curve with Physics & Sensor Control

## Overview
This project implements an interactive cubic Bézier curve that behaves like a flexible rope.  
The curve responds smoothly to user input using a custom physics model and is rendered in real time.

All mathematics, motion logic, and rendering are implemented manually without using external libraries.

---

## Bézier Curve Mathematics
The curve is generated using the standard cubic Bézier equation with four control points:

B(t) = (1−t)³P₀ + 3(1−t)²tP₁ + 3(1−t)t²P₂ + t³P₃

The curve is drawn by sampling values of `t` from 0 to 1 at small intervals.

---

## Physics Model
The two middle control points follow a spring-damping system to create smooth, natural motion:

acceleration = -k × (position − target) − damping × velocity

This model simulates elastic behavior similar to a rope and prevents sudden or rigid movement.

---

## Tangent Visualization
Tangent vectors are computed using the derivative of the Bézier curve and drawn at intervals along the curve to visualize direction and curvature.

---

## Design Choices
- Manual implementation of all math and physics logic
- No use of built-in Bézier or physics libraries
- Real-time interaction at 60 FPS using Canvas rendering
- Clear separation between math, physics, input handling, and rendering

---

## Author
Samim Mallick  
B.Tech, NIT Agartala
