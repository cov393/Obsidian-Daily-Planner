# Daily Planner Obsidian Plugin Documentation

Welcome to the documentation for the Daily Planner Obsidian plugin! This plugin helps users manage tasks, track health habits (e.g., workouts), and generate weekly summaries with visualizations. It automates file creation, task migration, and reporting in your Obsidian vault.
The plugin is built in TypeScript and integrates with Obsidian's API to create structured folders, daily/weekly files, and interactive elements like checkboxes and stacked bar charts.

## Table of Contents

- Overview
- Features
- Installation
- Usage

	- Ribbon Icon and Commands
	- Folder Structure
	- Tasks
	- Health Tracker
	- Weekly Summaries
	- Charts and Visualizations


- Configuration
- Code Structure
- Troubleshooting
- Contributing
- License

## Overview
This plugin creates a structured system in your Obsidian vault under the "Daily Planner" folder. It includes:

- **Tasks:** Daily task lists with automatic migration of unfinished tasks.
- **Health Tracker:** Weekly tables for tracking habits like workouts, with checkboxes (requires "Markdown Table Checkboxes" plugin for full interactivity).
- **Summaries:** Weekly overviews with progress bars, task statistics, and stacked bar charts for habits.

The plugin uses Obsidian's markdown features for checklists and custom code blocks for charts. It ensures folders are created dynamically and handles date-based file naming.
Screenshots of example outputs:

- **Health Tracker Summary:** A stacked bar chart showing completed habits per day.
<img width="1511" height="854" alt="image" src="https://github.com/user-attachments/assets/86ec4d8d-5904-4473-93b3-da925d407009" />

- **Task Summary:** Progress bar and stats for completed tasks.
<img width="1524" height="604" alt="image" src="https://github.com/user-attachments/assets/76adc6b1-b3e1-4c70-8ab5-0dd562f8ac01" />


- **Health Tracker Table:** Weekly grid with checkboxes for habits.
<img width="1608" height="1049" alt="image" src="https://github.com/user-attachments/assets/9f290733-fb50-43e0-a2df-fa0c25108623" />

- **Tasks List:** Daily checklist of tasks.
<img width="1782" height="1049" alt="image" src="https://github.com/user-attachments/assets/42fff976-889e-47e5-aa02-eb348cabd62c" />


## Features

- **Automatic File Creation:** Creates daily files for tasks and weekly files for health tracking.
- **Task Migration:** Moves unfinished tasks from yesterday to today's file.
- **Habit Tracking:** Weekly tables with dynamic muscle groups/habits (inherits from previous weeks or uses defaults), requiring "Markdown Table Checkboxes" for interactive checkboxes.
- **Summaries and Stats:** Generates a "Summary.md" file with:

	- Task completion percentage and averages.
	- Stacked bar charts for habit completion.


- **Custom Charts:** Renders stacked bar charts from YAML code blocks.
- **Notifications:** Uses Obsidian's Notice system for feedback (e.g., "File created!").
- **Dynamic Inheritance:** Health tracker pulls muscle groups from the previous week's file.
- **No External Dependencies:** Relies on Obsidian's API and built-in libraries like Chart.js (imported in `stacked-bar-chart.ts`), except for the "Markdown Table Checkboxes" plugin.

## Installation

1. Download the Plugin:

	- Clone or download the repository to your local machine.
	- Copy the plugin files (e.g., `main.ts`, `manifest.json`, etc.) to your Obsidian vault's plugins folder: `your-vault/.obsidian/plugins/daily-planner/`.


2. Manifest File:
	- Ensure you have a `manifest.json` file in the plugin folder. Example:

```json
	{
  "id": "daily-planner",
  "name": "Daily Planner",
  "version": "1.0.0",
  "minAppVersion": "0.15.0",
  "description": "Manage tasks, health tracking, and summaries in Obsidian.",
  "author": "Diana Percatkina",
  "isDesktopOnly": false
}
```
3. Enable the Plugin:

	- Open Obsidian > Settings > Community Plugins > Browse (if not installed via BRAT).
	- Or use the Beta Reviewers Auto-update Tester (BRAT) plugin to install from GitHub.
	- Enable "Daily Planner" in the plugin list.

5. Install Required Plugin:
	❗❗❗
	- Install the **"Markdown Table Checkboxes"** plugin from the Obsidian Community Plugins to enable interactive checkboxes in the health tracker tables.
	- Navigate to Settings > Community Plugins, search for **"Markdown Table Checkboxes"**, install, and enable it.

5. Build (if developing):

	- Install dependencies: `npm install` (requires Node.js).
	- Build: `npm run build`.
	- Reload Obsidian.

## Usage
### Ribbon Icon and Commands

- **Ribbon Icon:** Click the circle icon (added via `addIcon('circle', ...)`) to initialize the plugin. This creates the "Daily Planner" folder structure, migrates tasks, generates health trackers, and updates summaries.
- **Commands** (accessible via Command Palette - Ctrl/Cmd + P):

	- **Add Task:** Creates today's tasks file and lists tasks.
	- **Create Weekly Health Tracker:** Generates the weekly health table (interactive checkboxes require "Markdown Table Checkboxes" plugin).
	- **Create Chart File:** (For testing) Creates a demo stacked bar chart file.

### Folder Structure
The plugin creates the following structure in your vault:

```text
Daily Planner/
├── ✅ Tasks/
│   ├── YYYY Year/
│   │   ├── 📅 Month/
│   │   │   └── 📅 DD Month.md  (Daily task files)
├── ❤️ Health Tracker/
│   ├── 📅 Month/
│   │   └── DD - DD.md  (Weekly habit tables)
└── Summary.md  (Weekly summary with charts and stats)
```

### Tasks

- Daily files are created in `Daily Planner/✅ Tasks/YYYY Year/📅 Month/📅 DD Month.md`.
- Tasks are markdown checklists (e.g.,` - [ ] Task description`).
- Unfinished tasks (`- [ ]`) migrate automatically to the next day when the ribbon icon is clicked.
- Add tasks programmatically via `appendSelfDevelopmentTask(app, file, task)` from `selfDev.ts`.

Example file content:

```text
# ✅ Tasks - DD/MM/YYYY

- [x] test-1
- [x] test-2
- [ ] test-3
```

### Health Tracker

- Weekly files are created in `Daily Planner/❤️ Health Tracker/📅 Month/DD - DD.md`.
- Table format with checkboxes for habits (e.g., Glutes, Legs). Interactive checkboxes require the "Markdown Table Checkboxes" plugin.
- Habits inherit from the previous week's file or use defaults: ["Glutes", "Legs", "Back", "Brists", "Shoulders", "Jogging", "Yoga"].
- Checkboxes are HTML inputs for interactivity, fully functional with the required plugin.

Example table (as shown in the screenshot):
| Weekdays           | Mo                                           | Tu                                           | We                                           | Th                                           | Fr                                           | Sa                                           | Su                                           |
| ------------------ | -------------------------------------------- | -------------------------------------------- | -------------------------------------------- | -------------------------------------------- | -------------------------------------------- | -------------------------------------------- | -------------------------------------------- |
| Daily Habits Track | 11 Aug                                       | 12 Aug                                       | 13 Aug                                       | 14 Aug                                       | 15 Aug                                       | 16 Aug                                       | 17 Aug                                       |
| Glutes             |  ✅  |✅  |    |  |  |    |  |
| Legs               |    |  | ✅   |  |  |    | ✅  |
| Back               |    |  |    |  |  |    |  |
| Brists             |    |  |    | ✅ |  |    ✅ |  |
| Shoulders          |    |  |    |  | ✅ |    |  |
| Jogging            |  ✅  |  |    |  |  |    |  |
| Yoga               |    |  |    | ✅ |  |    |  |


### Weekly Summaries

- Generated in `Daily Planner/Summary.md`.
- Includes:

	- Health Tracker chart (stacked bar for habits).
	- Task progress bar (e.g., █████░░░░░ 50%).
	- Stats: Total tasks, completed, remaining, average per day.


- Updated when ribbon icon is clicked or via commands.

### Charts and Visualizations

- Uses a custom `stacked-bar-chart` code block in markdown.
- Parses YAML for labels, datasets, and colors.
- Renders with Chart.js.
- Example YAML:

```text
stacked-bar-chart
labels:
  - Monday
  - Tuesday
datasets:
  - label: Glutes
    data: [1, 0]
    backgroundColor: "#FF69B4"
```

## Configuration

- Hardcoded paths in managers (e.g., `mainFileDirectory: "Daily Planner"`, `taskFileDirectory: "✅ Tasks"`, `healthTrackerFileDirectory: "❤️ Health Tracker"`). Edit in `selfDevModel.ts`, `healthTrackerModel.ts`, etc.
- Default habits and colors in `summaryManager.ts` and `healthTrackerModel.ts`.
- No user-facing settings tab yet (add via `PluginSettingTab` if needed).

## Code Structure

- **main.ts:** Plugin entry point. Initializes managers, adds commands/icons, handles onload/unload.
- **selfDevModel.ts:** Manages daily task files, creation, migration, and reading.
- **healthTrackerModel.ts:** Manages weekly health files, dynamic habits, and summaries.
- **summaryManager.ts:** Generates summaries, reads tasks/habits, creates YAML for charts.
- **selfDev.ts:** Utility to append tasks.
- **stacked-bar-chart.ts:** Chart rendering logic with Chart.js and YAML parsing.
- **utils.ts:** Folder creation utility.

## Key Classes:

- `SelfDevManager:` Task handling.
- `HealthTrackerManager:` Habit tracking.
- `SummaryManager:` Reporting and charts.

## Troubleshooting

- **File Not Found:** Ensure the ribbon icon is clicked to create folders/files.
- **Chart Not Rendering:** Check YAML syntax in code blocks; use demo data for testing.
- **Migration Issues:** Verify date formats and file paths.
- **Errors in Console:** Check Obsidian's developer console (Ctrl/Cmd + Shift + I) for logs.
- **Truncated Content:** Some code snippets are truncated in docs; refer to source files.
- **Checkboxes Not Working:** Ensure "Markdown Table Checkboxes" plugin is installed and enabled.

## Contributing

- Fork the repo on GitHub.
- Create a feature branch.
- Submit a pull request with changes.
- Issues: Report bugs or suggest features via GitHub Issues.

## License
MIT License. See LICENSE for details.
