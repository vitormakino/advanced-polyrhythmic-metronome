# Advanced Polyrhythmic Metronome

A professional-grade rhythmic practice tool designed for musicians to master complex polyrhythms through precise audio timing and intuitive geometric visualization.

**[🌐 Live Demo](https://vitormakino.github.io/advanced-polyrhythmic-metronome/)**

## 🚀 Key Features

### 1. Advanced Polyrhythm Engine
- **Unlimited Pulses:** Add as many simultaneous rhythms as needed to study complex interactions (e.g., 4:3, 5:4, 7:11).
- **Independent Control:** Each pulse is treated as a unique layer with its own subdivision, sound, and intensity profile.
- **Relational Timing:** All pulses are mathematically synchronized based on a master BPM, ensuring perfect alignment at the start of every measure.

### 2. Deep Customization per Beat
- **4-Level Velocity:** Toggle individual beat intensities between **Mute**, **Soft**, **Medium**, and **Hard** (Accent).
- **Sound Profiles:** Choose from 4 distinct high-fidelity synthesis models:
  - **Sine:** Pure, clean classic metronome beep.
  - **Wood:** Percussive, acoustic woodblock feel.
  - **Bell:** Harmonic-rich bell with longer sustain.
  - **Electronic:** Modern, sharp synth pulse with low-pass filtering.

### 3. Geometric Visualization (Rhythm Topology)
- **Dynamic Shapes:** Visual representation where each pulse forms a unique polygon layer.
- **Coincidence Indicators:** A central flash and "Sync State" indicator highlight exactly when all rhythms intersect (the "one").
- **Real-time Feedback:** Smooth, spring-animated beat indicators that react to the audio engine's precision.

### 4. Precision Controls
- **BPM Range:** 40 to 300 BPM with single-beat precision.
- **Tap Tempo:** Intuitive tap-to-set BPM functionality with multi-tap averaging.
- **Hardware Simulation UI:** A dark, sleek interface optimized for low-latency visual performance.

## 🛠 Technical Stack

- **Framework:** React 19 + TypeScript
- **Audio:** Web Audio API (Low-latency scheduling with lookahead)
- **Animations:** Motion (Framer Motion)
- **Styling:** Tailwind CSS 4.0
- **Icons:** Lucide React

## 📖 Usage Tip

To study a specific polyrhythm, let Pulse A be your base (e.g., 4) and Pulse B be your counter-rhythm (e.g., 3). Use the **Beat Velocity** settings to accent the "1" of each rhythm to help internalize the crossing patterns.

---

Built with precision by **Pulse Science** using Google AI Studio.
