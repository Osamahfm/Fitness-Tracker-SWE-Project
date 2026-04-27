<div align="center">
  <h3 align="center">Fitness Tracker</h3>
  <p align="center">
    A modern, glassmorphic React application for tracking daily fitness activities, monitoring caloric expenditure, and achieving your health goals.
    <br />
    <br />
    <a href="#"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="#">View Demo</a>
    ·
    <a href="#">Report Bug</a>
    ·
    <a href="#">Request Feature</a>
  </p>
</div>

<br />

<div align="center">

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white)
![Framer](https://img.shields.io/badge/Framer-Black?style=for-the-badge&logo=framer&logoColor=blue)

</div>

## 📋 Table of Contents
- [About The Project](#-about-the-project)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Architecture](#-project-architecture)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 About The Project

Fitness Tracker is a state-of-the-art client-side application designed to give users a premium experience while monitoring their physical health. Built without the need for a complex backend infrastructure, the application leverages browser-native `localStorage` securely synced through a centralized React Context to provide instantaneous, offline-capable tracking.

## ✨ Key Features

* **Real-time Caloric Engine:** Algorithmically estimates calories burned utilizing standardized Metabolic Equivalent of Task (MET) values tailored to user weight and perceived effort levels.
* **Smart Recommendations:** Context-aware meal and goal suggestion system that adapts dynamically to your daily energy expenditure.
* **Activity Alarms:** Fully integrated background interval checking to remind users of upcoming fitness routines via interactive toasts.
* **Fluid UI/UX:** Built with a custom glassmorphism design system featuring seamless hardware-accelerated page transitions powered by Framer Motion.
* **Data Persistence:** Complete offline capabilities with robust local storage state management ensuring no data is ever lost across sessions.

## 💻 Tech Stack

| Category | Technology |
| --- | --- |
| **Framework** | [React 18](https://reactjs.org/) |
| **Build System** | [Vite](https://vitejs.dev/) |
| **Routing** | [React Router v6](https://reactrouter.com/) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **Styling** | Vanilla CSS (CSS Grid, Flexbox, Custom Properties) |

## 🚀 Getting Started

Follow these steps to get a local copy up and running on your machine.

### Prerequisites

Ensure you have Node.js (v16.0.0 or higher) installed.
* npm
  ```sh
  npm install npm@latest -g
  ```

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/Osamahfm/Fitness-Tracker-SWE-Project.git
   ```
2. Navigate into the directory
   ```sh
   cd Fitness-Tracker-SWE-Project
   ```
3. Install NPM packages
   ```sh
   npm install
   ```
4. Start the development server
   ```sh
   npm run dev
   ```

## 🏗️ Project Architecture

```text
src/
├── components/      # Reusable presentational components (Layout)
├── context/         # Global state management (AppContext)
├── pages/           # Route-level components (Dashboard, Profile, Reports, etc.)
├── App.jsx          # Router configuration and application wrapper
├── index.css        # Global CSS, tokens, and glassmorphism styling
└── main.jsx         # React DOM entry point
```

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
