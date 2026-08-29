# Contributing to WearOS Manager

Thank you for your interest in contributing to **WearOS Manager**! This document provides guidelines and instructions for contributing to this project.

---

## 📜 Table of Contents
- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Translations & Localization](#translations--localization)
  - [Code Contributions](#code-contributions)
- [Development Workflow](#development-workflow)
  - [Prerequisites](#prerequisites)
  - [Setting Up Your Local Environment](#setting-up-your-local-environment)
  - [Running the Project](#running-the-project)
  - [Running Tests & Linters](#running-tests--linters)
- [Coding Standards & Conventions](#coding-standards--conventions)
  - [Rust (Backend)](#rust-backend)
  - [TypeScript & React (Frontend)](#typescript--react-frontend)
  - [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)

---

## 🤝 Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free experience for everyone. Please be respectful, constructive, and considerate when interacting with maintainers and other contributors.

---

## 🛠️ How Can I Contribute?

### Reporting Bugs
Before submitting a bug report:
1. Check the [Issue Tracker](https://github.com/your-username/wearos-manager/issues) to ensure the issue hasn't already been reported.
2. Verify that your watch has **Wireless Debugging** enabled and is connected to the same Wi-Fi network.
3. Open an issue using the **Bug Report** template and include:
   - Your smartwatch model (e.g. Galaxy Watch 6, Pixel Watch 2).
   - Wear OS and Android version.
   - Host OS (Windows 11, macOS Sequoia, Ubuntu 24.04, etc.).
   - Exact steps to reproduce the issue.
   - Relevant ADB or application log output (available in the Console drawer).

### Suggesting Features
We welcome ideas for new watch tweaks, customization tools, or workflow improvements!
- Open a feature suggestion on the [Issue Tracker](https://github.com/your-username/wearos-manager/issues) using the **Feature Request** template.
- Describe the problem it solves, how it benefits Wear OS users, and any technical ADB commands or APIs involved.

### Translations & Localization
WearOS Manager uses `i18next` for internationalization. Translations are stored in JSON files:
* `src/i18n/locales/en.json` (English - source)
* `src/i18n/locales/es.json` (Spanish)

To add a new language:
1. Copy `src/i18n/locales/en.json` to `src/i18n/locales/<lang_code>.json`.
2. Translate the string values.
3. Register the new locale in `src/i18n/config.ts`.
4. Open a Pull Request!

---

## 💻 Development Workflow

### Prerequisites
Ensure you have the following installed:
* [Rust](https://rustup.rs/) (v1.75+)
* [Bun](https://bun.sh/) (preferred) or [Node.js](https://nodejs.org/) (v18+)
* [Android SDK Platform Tools](https://developer.android.com/tools/releases/platform-tools) (`adb`)
* Operating System specific dependencies:
  * **Windows**: WebView2 Runtime & Visual Studio C++ Build Tools
  * **Linux**: `libwebkit2gtk-4.1-dev`, `libssl-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`
  * **macOS**: Xcode Command Line Tools

### Setting Up Your Local Environment
```bash
# 1. Clone the repository
git clone https://github.com/your-username/wearos-manager.git
cd wearos-manager

# 2. Install dependencies
bun install
```

### Running the Project
```bash
# Start development server with live reload
bun run tauri dev
```

### Running Tests & Linters
```bash
# Frontend typecheck
bun run build

# Rust backend tests & formatting
cd src-tauri
cargo test
cargo fmt --check
cargo clippy
```

---

## 📐 Coding Standards & Conventions

### Rust (Backend)
* Keep ADB commands modular and encapsulated within `src-tauri/src/adb/`.
* Handle errors gracefully by returning `Result<T, String>` from Tauri commands.
* Avoid blocking the async runtime: use `tokio::process::Command` or `tokio::task::spawn_blocking` where appropriate.
* Run `cargo fmt` and `cargo clippy` before committing.

### TypeScript & React (Frontend)
* Use functional components with React 19 hooks and TypeScript typing.
* Manage shared state using Zustand stores in `src/store/`.
* Style components using Tailwind CSS utility classes; avoid inline styles.
* Use `lucide-react` for consistent iconography.
* Wrap all user-facing strings in `t('...')` translation calls.

### Commit Messages
We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
* `feat: add screen density preset selector`
* `fix: handle dynamic pairing ports correctly on Wear OS 5`
* `docs: update wireless debugging guide for Pixel Watch`
* `refactor: extract adb runner logic into reusable helper`
* `chore: update dependencies`

---

## 🚀 Pull Request Process

1. Create a descriptive branch from `main`:
   ```bash
   git checkout -b feat/my-new-feature
   ```
2. Commit your changes with clear messages.
3. Test your changes against a real or emulated Wear OS device if possible.
4. Ensure all TypeScript checks and Rust tests pass.
5. Push to your fork and submit a Pull Request targeting `main`.
6. Link any related issues in the PR description.
7. Maintainers will review your PR and provide constructive feedback!
