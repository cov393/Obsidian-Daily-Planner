import { __awaiter } from "tslib";
import { TFile, normalizePath } from "obsidian";
import { ensureFoldersExist } from "../utils/utils";
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DEFAULT_MUSCLE_GROUPS = ["Glutes", "Legs", "Back", "Brists", "Shoulders", "Jogging", "Yoga"];
const MUSCLE_COLORS = {
    "Glutes": "#FF69B4",
    "Legs": "#4169E1",
    "Back": "#FFD700",
    "Brists": "#20B2AA",
    "Shoulders": "#9370DB",
    "Jogging": "#FFA500",
    "Yoga": "#808080" // Grey
};
// Hash the string and get HEX
function hashColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash; // 32-бит
    }
    const color = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return "#" + "000000".substring(0, 6 - color.length) + color;
}
export class SummaryManager {
    constructor(app) {
        this.app = app;
    }
    /**
     * Main method for generating the summary
     */
    generateWeeklySummary(stats, date, summaryPath = "Daily Planner/Summary.md") {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const habitData = yield this.readWeekFile(date);
                const chartYaml = this.generateChartYaml(habitData);
                yield ensureFoldersExist(this.app, summaryPath);
                const { totalTasks, totalUnfinishedTasks, totalFinishedTasks } = stats;
                const tasksPercent = totalTasks > 0 ? Math.round((totalFinishedTasks / totalTasks) * 100) : 0;
                const progressBlocks = Math.round(tasksPercent / 10);
                const progressBar = "█".repeat(progressBlocks) + "░".repeat(10 - progressBlocks);
                // Get week date range for the Health header
                const HstartOfWeek = this.getStartOfWeek(date);
                const HendOfWeek = new Date(HstartOfWeek);
                HendOfWeek.setDate(HstartOfWeek.getDate() + 1);
                const HstartDate = HstartOfWeek.getDate();
                const HendDate = HendOfWeek.getDate();
                const HstartMonth = HstartOfWeek.toLocaleDateString("en-GB", { month: "long" });
                const HendMonth = HendOfWeek.toLocaleDateString("en-GB", { month: "long" });
                const HweekRange = HstartMonth === HendMonth
                    ? `${HstartDate} - ${HendDate} ${HstartMonth}`
                    : `${HstartDate} ${HstartMonth} - ${HendDate} ${HendMonth}`;
                // Get week date range for the Task header
                const startOfWeek = this.getStartOfWeekSelfDev(date);
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                const startDate = startOfWeek.getDate();
                const endDate = endOfWeek.getDate();
                const startMonth = startOfWeek.toLocaleDateString("en-GB", { month: "long" });
                const endMonth = endOfWeek.toLocaleDateString("en-GB", { month: "long" });
                const weekRange = startMonth === endMonth
                    ? `${startDate} - ${endDate} ${startMonth}`
                    : `${startDate} ${startMonth} - ${endDate} ${endMonth}`;
                const summaryContent = `### 🏋️ Health Tracker Summary (📅 ${HweekRange})

${chartYaml}

---

### ✅ Task Summary (📅 ${weekRange})
Progress:
${progressBar} **${tasksPercent}%**

📋 **Total Tasks:**  ${totalTasks}
✔ **Completed:**  ${totalFinishedTasks}
⏳ **Remaining:**  ${totalUnfinishedTasks}
📊 **Average per day:**  ${(totalFinishedTasks / 7).toFixed(1)} tasks`;
                yield this.app.vault.adapter.write(normalizePath(summaryPath), summaryContent);
                console.log(`Summary generated at: ${summaryPath}`);
            }
            catch (error) {
                console.error("Error generating summary:", error);
            }
        });
    }
    /**
     * Read SelfDev data from a specific day's file
     */
    readDailyTasksFile(date) {
        return __awaiter(this, void 0, void 0, function* () {
            const yearName = this.getFileNameByYear(date);
            const startOfWeek = this.getStartOfWeekSelfDev(date);
            const allUnfinishedTasks = [];
            let allContent = "";
            let totalUnfinishedTasks = 0;
            let totalFinishedTasks = 0;
            let totalTasks = 0;
            for (let i = 0; i < 7; i++) {
                const current = new Date(startOfWeek);
                current.setDate(startOfWeek.getDate() + i);
                const startDay = current.getDate();
                const startMonth = current.toLocaleDateString("en-GB", { month: "long" });
                const filePath = `Daily Planner/✅Tasks/${yearName}/📅 ${startMonth}/📅 ${startDay} ${startMonth}.md`;
                const file = this.app.vault.getAbstractFileByPath(filePath);
                if (!(file instanceof TFile)) {
                    console.warn(`Task file not found: ${filePath}`);
                    continue;
                }
                try {
                    const content = yield this.app.vault.read(file);
                    const unfinishedTasks = content
                        .split('\n')
                        .filter(line => line.trim().startsWith('- [') && !line.trim().startsWith('- [x]'))
                        .map(line => line.trim());
                    totalUnfinishedTasks += unfinishedTasks.length;
                    const finishedTasks = content
                        .split('\n')
                        .filter(line => line.trim().startsWith('- [x]'))
                        .map(line => line.trim());
                    totalFinishedTasks += finishedTasks.length;
                    allUnfinishedTasks.push(...unfinishedTasks);
                    allContent += content + "\n";
                }
                catch (e) {
                    console.error(`Error reading file ${filePath}: ${e.message}`);
                    continue;
                }
            }
            totalTasks = totalFinishedTasks + totalUnfinishedTasks;
            return {
                tasks: allUnfinishedTasks,
                content: allContent.trim(),
                totalUnfinishedTasks,
                totalFinishedTasks,
                totalTasks
            };
        });
    }
    /**
     * Read Health Tracker data from a specific week file
     */
    readWeekFile(date) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const muscleGroups = yield this.getMuscleGroupsFromHealthTracker(date); // Dynamic list
            const habitData = {};
            muscleGroups.forEach(group => {
                habitData[group] = new Array(7).fill(0);
            });
            const monthName = this.getFileNameByMonth(date);
            const weekName = this.getFileNameByWeek(date);
            const filePath = `Daily Planner/❤️Health Tracker/${monthName}/${weekName}`;
            const file = this.app.vault.getAbstractFileByPath(filePath);
            if (!(file instanceof TFile)) {
                console.warn(`Week file not found: ${filePath}`);
                return habitData;
            }
            try {
                const content = yield this.app.vault.read(file);
                const weekHabitData = this.parseMarkdownTable(content, muscleGroups);
                for (const muscleGroup of muscleGroups) {
                    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
                        habitData[muscleGroup][dayIndex] = ((_a = weekHabitData[muscleGroup]) === null || _a === void 0 ? void 0 : _a[dayIndex]) || 0;
                    }
                }
            }
            catch (e) {
                console.error(`Error reading week file: ${filePath}`, e);
            }
            return habitData;
        });
    }
    /**
     * Parsing a markdown table with dynamic muscle groups
     */
    parseMarkdownTable(content, muscleGroups) {
        const lines = content.split("\n");
        const habitData = {};
        muscleGroups.forEach(group => (habitData[group] = new Array(7).fill(0)));
        let inTable = false;
        for (const line of lines) {
            if (!line.trim() || line.includes("Weekdays") || line.includes("---") || line.includes("Daily Habits Track")) {
                if (line.includes("Weekdays"))
                    inTable = true;
                continue;
            }
            if (inTable && line.includes("|")) {
                const columns = line.split("|");
                if (columns.length < 9)
                    continue;
                const muscleGroup = columns[1].trim();
                if (!muscleGroups.includes(muscleGroup))
                    continue;
                for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
                    const cellIndex = dayIndex + 2;
                    if (cellIndex < columns.length) {
                        const cell = columns[cellIndex].trim();
                        if (cell.includes("☑️") || cell.includes("unchecked")) {
                            habitData[muscleGroup][dayIndex] = 0;
                        }
                        else {
                            habitData[muscleGroup][dayIndex]++;
                        }
                    }
                }
            }
        }
        return habitData;
    }
    /**
     * Assembly of YAML data for the stacked-bar-chart block
     */
    generateChartYaml(habitData) {
        const muscleGroups = Object.keys(habitData); // Dynamic list from data
        const datasets = muscleGroups.map(muscleGroup => {
            const color = MUSCLE_COLORS[muscleGroup] || hashColor(muscleGroup);
            return {
                label: muscleGroup,
                data: habitData[muscleGroup] || new Array(7).fill(0),
                backgroundColor: color
            };
        });
        const yamlLines = [];
        yamlLines.push("labels:");
        WEEKDAYS.forEach(day => yamlLines.push(`  - ${day}`));
        yamlLines.push("datasets:");
        datasets.forEach(ds => {
            yamlLines.push(`  - label: ${ds.label}`);
            yamlLines.push(`    data: [${ds.data.join(", ")}]`);
            yamlLines.push(`    backgroundColor: "${ds.backgroundColor}"`);
        });
        return `
\`\`\`stacked-bar-chart
${yamlLines.join("\n")}
\`\`\`
        `.trim();
    }
    /**
     * Helper methods: month name and week name
     */
    getFileNameByMonth(date) {
        const monthData = date.toLocaleDateString("en-GB", { month: "long" });
        return `📅 ${monthData}`;
    }
    getFileNameByWeek(date) {
        const startOfWeek = this.getStartOfWeek(date);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        const startDate = startOfWeek.getDate();
        const endDate = endOfWeek.getDate();
        const startMonth = startOfWeek.toLocaleDateString("en-GB", { month: "short" });
        const endMonth = endOfWeek.toLocaleDateString("en-GB", { month: "short" });
        return startMonth === endMonth
            ? `${startDate} - ${endDate}.md`
            : `${startDate} ${startMonth} - ${endDate} ${endMonth}.md`;
    }
    // Calculate the start of the week (Monday) for Health Tracker
    getStartOfWeek(date) {
        const startOfWeek = new Date(date);
        const day = startOfWeek.getDay(); // Sunday = 0, Monday = 1, ...
        const offset = day === 0 ? 6 : day - 1; // Adjust for Monday start
        startOfWeek.setDate(startOfWeek.getDate() - offset);
        startOfWeek.setHours(0, 0, 0, 0); // Reset time to midnight
        return startOfWeek;
    }
    getFileNameByYear(date) {
        const yearDate = date.toLocaleDateString("en-GB", { year: "numeric" });
        return `${yearDate} Year`;
    }
    getStartOfWeekSelfDev(date) {
        const startOfWeek = new Date(date);
        const day = startOfWeek.getDay(); // Sunday = 0, Monday = 1, ...
        const offset = day === 0 ? 6 : day + 6; // Adjust for Monday start (error in the original, fixed)
        startOfWeek.setDate(startOfWeek.getDate() - offset);
        startOfWeek.setHours(0, 0, 0, 0); // Reset time to midnight
        return startOfWeek;
    }
    /**
     * Get muscle groups from the previous Health Tracker file
     */
    getMuscleGroupsFromHealthTracker(date) {
        return __awaiter(this, void 0, void 0, function* () {
            const previousWeekStart = new Date(this.getStartOfWeek(date));
            previousWeekStart.setDate(previousWeekStart.getDate() - 7); // Switch to the previous week
            const previousPath = `Daily Planner/❤️Health Tracker/${this.getFileNameByMonth(previousWeekStart)}/${this.getFileNameByWeek(previousWeekStart)}`;
            const previousFile = this.app.vault.getAbstractFileByPath(normalizePath(previousPath));
            if (!previousFile) {
                console.warn(`Previous week file not found: ${previousPath}. Using default muscle groups.`);
                return DEFAULT_MUSCLE_GROUPS;
            }
            try {
                const content = yield this.app.vault.read(previousFile);
                const lines = content.split("\n");
                const tableStart = lines.findIndex(line => line.includes("Daily Habits Track"));
                if (tableStart === -1) {
                    return DEFAULT_MUSCLE_GROUPS; // Fallback if the table is corrupted
                }
                const muscleGroups = [];
                for (let i = tableStart + 1; i < lines.length && lines[i].startsWith("|"); i++) {
                    const cells = lines[i].split("|").map(cell => cell.trim());
                    if (cells.length < 2)
                        continue;
                    const group = cells[1];
                    if (group) {
                        muscleGroups.push(group); // Extract the muscle group from the second column
                    }
                }
                return muscleGroups.length > 0 ? muscleGroups : DEFAULT_MUSCLE_GROUPS;
            }
            catch (error) {
                console.error(`Error parsing previous week file ${previousPath}:`, error);
                return DEFAULT_MUSCLE_GROUPS; // Fallback to default
            }
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VtbWFyeU1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9tb2RlbHMvc3VtbWFyeU1hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBTyxLQUFLLEVBQUUsYUFBYSxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBQ3JELE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBRXBELE1BQU0sUUFBUSxHQUFHLENBQUMsUUFBUSxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDaEcsTUFBTSxxQkFBcUIsR0FBRyxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ25HLE1BQU0sYUFBYSxHQUFHO0lBQ2xCLFFBQVEsRUFBRSxTQUFTO0lBQ25CLE1BQU0sRUFBRSxTQUFTO0lBQ2pCLE1BQU0sRUFBRSxTQUFTO0lBQ2pCLFFBQVEsRUFBRSxTQUFTO0lBQ25CLFdBQVcsRUFBRSxTQUFTO0lBQ3RCLFNBQVMsRUFBRSxTQUFTO0lBQ3BCLE1BQU0sRUFBRSxTQUFTLENBQU8sT0FBTztDQUNsQyxDQUFDO0FBRUYsOEJBQThCO0FBQzlCLFNBQVMsU0FBUyxDQUFDLEdBQVc7SUFDMUIsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDO0lBQ2IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDakMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztRQUNoRCxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxD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QU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7b0JBQzNELElBQUksS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDO3dCQUFFLFNBQVM7b0JBRS9CLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDdkIsSUFBSSxLQUFLLEVBQUU7d0JBQ1AsWUFBWSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLGtEQUFrRDtxQkFDL0U7aUJBQ0o7Z0JBRUQsT0FBTyxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQzthQUN6RTtZQUFDLE9BQU8sS0FBSyxFQUFFO2dCQUNaLE9BQU8sQ0FBQyxLQUFLLENBQUMsb0NBQW9DLFlBQVksR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUMxRSxPQUFPLHFCQUFxQixDQUFDLENBQUMsc0JBQXNCO2FBQ3ZEO1FBQ0wsQ0FBQztLQUFBO0NBQ0oiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHAsIFRGaWxlLCBub3JtYWxpemVQYXRoIH0gZnJvbSBcIm9ic2lkaWFuXCI7XHJcbmltcG9ydCB7IGVuc3VyZUZvbGRlcnNFeGlzdCB9IGZyb20gXCIuLi91dGlscy91dGlsc1wiO1xyXG5cclxuY29uc3QgV0VFS0RBWVMgPSBbXCJNb25kYXlcIiwgXCJUdWVzZGF5XCIsIFwiV2VkbmVzZGF5XCIsIFwiVGh1cnNkYXlcIiwgXCJGcmlkYXlcIiwgXCJTYXR1cmRheVwiLCBcIlN1bmRheVwiXTtcclxuY29uc3QgREVGQVVMVF9NVVNDTEVfR1JPVVBTID0gW1wiR2x1dGVzXCIsIFwiTGVnc1wiLCBcIkJhY2tcIiwgXCJCcmlzdHNcIiwgXCJTaG91bGRlcnNcIiwgXCJKb2dnaW5nXCIsIFwiWW9nYVwiXTtcclxuY29uc3QgTVVTQ0xFX0NPTE9SUyA9IHtcclxuICAgIFwiR2x1dGVzXCI6IFwiI0ZGNjlCNFwiLCAgICAvLyBQaW5rXHJcbiAgICBcIkxlZ3NcIjogXCIjNDE2OUUxXCIsICAgICAgLy8gQmx1ZVxyXG4gICAgXCJCYWNrXCI6IFwiI0ZGRDcwMFwiLCAgICAgIC8vIFllbGxvd1xyXG4gICAgXCJCcmlzdHNcIjogXCIjMjBCMkFBXCIsICAgIC8vIFRlYWxcclxuICAgIFwiU2hvdWxkZXJzXCI6IFwiIzkzNzBEQlwiLCAvLyBQdXJwbGVcclxuICAgIFwiSm9nZ2luZ1wiOiBcIiNGRkE1MDBcIiwgICAvLyBPcmFuZ2VcclxuICAgIFwiWW9nYVwiOiBcIiM4MDgwODBcIiAgICAgICAvLyBHcmV5XHJcbn07XHJcblxyXG4vLyBIYXNoIHRoZSBzdHJpbmcgYW5kIGdldCBIRVhcclxuZnVuY3Rpb24gaGFzaENvbG9yKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgIGxldCBoYXNoID0gMDtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaGFzaCA9IHN0ci5jaGFyQ29kZUF0KGkpICsgKChoYXNoIDw8IDUpIC0gaGFzaCk7XHJcbiAgICAgICAgaGFzaCA9IGhhc2ggJiBoYXNoOyAvLyAzMi3QsdC40YJcclxuICAgIH1cclxuICAgIGNvbnN0IGNvbG9yID0gKGhhc2ggJiAweDAwRkZGRkZGKS50b1N0cmluZygxNikudG9VcHBlckNhc2UoKTtcclxuICAgIHJldHVybiBcIiNcIiArIFwiMDAwMDAwXCIuc3Vic3RyaW5nKDAsIDYgLSBjb2xvci5sZW5ndGgpICsgY29sb3I7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBTdW1tYXJ5TWFuYWdlciB7XHJcbiAgICBwcml2YXRlIGFwcDogQXBwO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFwcDogQXBwKSB7XHJcbiAgICAgICAgdGhpcy5hcHAgPSBhcHA7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBNYWluIG1ldGhvZCBmb3IgZ2VuZXJhdGluZyB0aGUgc3VtbWFyeVxyXG4gICAgICovXHJcbiAgICBhc3luYyBnZW5lcmF0ZVdlZWtseVN1bW1hcnkoc3RhdHM6IHsgdG90YWxUYXNrczogbnVtYmVyLCB0b3RhbFVuZmluaXNoZWRUYXNrczogbnVtYmVyLCB0b3RhbEZpbmlzaGVkVGFza3M6IG51bWJlciB9LCBkYXRlOiBEYXRlLCBzdW1tYXJ5UGF0aDogc3RyaW5nID0gXCJEYWlseSBQbGFubmVyL1N1bW1hcnkubWRcIik6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGhhYml0RGF0YSA9IGF3YWl0IHRoaXMucmVhZFdlZWtGaWxlKGRhdGUpO1xyXG4gICAgICAgICAgICBjb25zdCBjaGFydFlhbWwgPSB0aGlzLmdlbmVyYXRlQ2hhcnRZYW1sKGhhYml0RGF0YSk7XHJcblxyXG4gICAgICAgICAgICBhd2FpdCBlbnN1cmVGb2xkZXJzRXhpc3QodGhpcy5hcHAsIHN1bW1hcnlQYXRoKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHsgdG90YWxUYXNrcywgdG90YWxVbmZpbmlzaGVkVGFza3MsIHRvdGFsRmluaXNoZWRUYXNrcyB9ID0gc3RhdHM7XHJcbiAgICAgICAgICAgIGNvbnN0IHRhc2tzUGVyY2VudCA9IHRvdGFsVGFza3MgPiAwID8gTWF0aC5yb3VuZCgodG90YWxGaW5pc2hlZFRhc2tzIC8gdG90YWxUYXNrcykgKiAxMDApIDogMDtcclxuICAgICAgICAgICAgY29uc3QgcHJvZ3Jlc3NCbG9ja3MgPSBNYXRoLnJvdW5kKHRhc2tzUGVyY2VudCAvIDEwKTtcclxuICAgICAgICAgICAgY29uc3QgcHJvZ3Jlc3NCYXIgPSBcIuKWiFwiLnJlcGVhdChwcm9ncmVzc0Jsb2NrcykgKyBcIuKWkVwiLnJlcGVhdCgxMCAtIHByb2dyZXNzQmxvY2tzKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEdldCB3ZWVrIGRhdGUgcmFuZ2UgZm9yIHRoZSBIZWFsdGggaGVhZGVyXHJcbiAgICAgICAgICAgIGNvbnN0IEhzdGFydE9mV2VlayA9IHRoaXMuZ2V0U3RhcnRPZldlZWsoZGF0ZSk7XHJcbiAgICAgICAgICAgIGNvbnN0IEhlbmRPZldlZWsgPSBuZXcgRGF0ZShIc3RhcnRPZldlZWspO1xyXG4gICAgICAgICAgICBIZW5kT2ZXZWVrLnNldERhdGUoSHN0YXJ0T2ZXZWVrLmdldERhdGUoKSArIDEpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgSHN0YXJ0RGF0ZSA9IEhzdGFydE9mV2Vlay5nZXREYXRlKCk7XHJcbiAgICAgICAgICAgIGNvbnN0IEhlbmREYXRlID0gSGVuZE9mV2Vlay5nZXREYXRlKCk7XHJcbiAgICAgICAgICAgIGNvbnN0IEhzdGFydE1vbnRoID0gSHN0YXJ0T2ZXZWVrLnRvTG9jYWxlRGF0ZVN0cmluZyhcImVuLUdCXCIsIHsgbW9udGg6IFwibG9uZ1wiIH0pO1xyXG4gICAgICAgICAgICBjb25zdCBIZW5kTW9udGggPSBIZW5kT2ZXZWVrLnRvTG9jYWxlRGF0ZVN0cmluZyhcImVuLUdCXCIsIHsgbW9udGg6IFwibG9uZ1wiIH0pO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgSHdlZWtSYW5nZSA9IEhzdGFydE1vbnRoID09PSBIZW5kTW9udGhcclxuICAgICAgICAgICAgICAgID8gYCR7SHN0YXJ0RGF0ZX0gLSAke0hlbmREYXRlfSAke0hzdGFydE1vbnRofWBcclxuICAgICAgICAgICAgICAgIDogYCR7SHN0YXJ0RGF0ZX0gJHtIc3RhcnRNb250aH0gLSAke0hlbmREYXRlfSAke0hlbmRNb250aH1gO1xyXG5cclxuICAgICAgICAgICAgLy8gR2V0IHdlZWsgZGF0ZSByYW5nZSBmb3IgdGhlIFRhc2sgaGVhZGVyXHJcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0T2ZXZWVrID0gdGhpcy5nZXRTdGFydE9mV2Vla1NlbGZEZXYoZGF0ZSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGVuZE9mV2VlayA9IG5ldyBEYXRlKHN0YXJ0T2ZXZWVrKTtcclxuICAgICAgICAgICAgZW5kT2ZXZWVrLnNldERhdGUoc3RhcnRPZldlZWsuZ2V0RGF0ZSgpICsgNik7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBzdGFydERhdGUgPSBzdGFydE9mV2Vlay5nZXREYXRlKCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGVuZERhdGUgPSBlbmRPZldlZWsuZ2V0RGF0ZSgpO1xyXG4gICAgICAgICAgICBjb25zdCBzdGFydE1vbnRoID0gc3RhcnRPZldlZWsudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZW4tR0JcIiwgeyBtb250aDogXCJsb25nXCIgfSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGVuZE1vbnRoID0gZW5kT2ZXZWVrLnRvTG9jYWxlRGF0ZVN0cmluZyhcImVuLUdCXCIsIHsgbW9udGg6IFwibG9uZ1wiIH0pO1xyXG5cclxuICAgICAgICAgICAgY29uc3Qgd2Vla1JhbmdlID0gc3RhcnRNb250aCA9PT0gZW5kTW9udGhcclxuICAgICAgICAgICAgICAgID8gYCR7c3RhcnREYXRlfSAtICR7ZW5kRGF0ZX0gJHtzdGFydE1vbnRofWBcclxuICAgICAgICAgICAgICAgIDogYCR7c3RhcnREYXRlfSAke3N0YXJ0TW9udGh9IC0gJHtlbmREYXRlfSAke2VuZE1vbnRofWA7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBzdW1tYXJ5Q29udGVudCA9IGAjIyMg8J+Pi++4jyBIZWFsdGggVHJhY2tlciBTdW1tYXJ5ICjwn5OFICR7SHdlZWtSYW5nZX0pXHJcblxyXG4ke2NoYXJ0WWFtbH1cclxuXHJcbi0tLVxyXG5cclxuIyMjIOKchSBUYXNrIFN1bW1hcnkgKPCfk4UgJHt3ZWVrUmFuZ2V9KVxyXG5Qcm9ncmVzczpcclxuJHtwcm9ncmVzc0Jhcn0gKioke3Rhc2tzUGVyY2VudH0lKipcclxuXHJcbvCfk4sgKipUb3RhbCBUYXNrczoqKiAgJHt0b3RhbFRhc2tzfVxyXG7inJQgKipDb21wbGV0ZWQ6KiogICR7dG90YWxGaW5pc2hlZFRhc2tzfVxyXG7ij7MgKipSZW1haW5pbmc6KiogICR7dG90YWxVbmZpbmlzaGVkVGFza3N9XHJcbvCfk4ogKipBdmVyYWdlIHBlciBkYXk6KiogICR7KHRvdGFsRmluaXNoZWRUYXNrcyAvIDcpLnRvRml4ZWQoMSl9IHRhc2tzYDtcclxuXHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmFkYXB0ZXIud3JpdGUobm9ybWFsaXplUGF0aChzdW1tYXJ5UGF0aCksIHN1bW1hcnlDb250ZW50KTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYFN1bW1hcnkgZ2VuZXJhdGVkIGF0OiAke3N1bW1hcnlQYXRofWApO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBnZW5lcmF0aW5nIHN1bW1hcnk6XCIsIGVycm9yKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZWFkIFNlbGZEZXYgZGF0YSBmcm9tIGEgc3BlY2lmaWMgZGF5J3MgZmlsZVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgYXN5bmMgcmVhZERhaWx5VGFza3NGaWxlKGRhdGU6IERhdGUpOiBQcm9taXNlPHtcclxuICAgICAgICB0YXNrczogc3RyaW5nW107XHJcbiAgICAgICAgY29udGVudDogc3RyaW5nO1xyXG4gICAgICAgIHRvdGFsVW5maW5pc2hlZFRhc2tzOiBudW1iZXI7XHJcbiAgICAgICAgdG90YWxGaW5pc2hlZFRhc2tzOiBudW1iZXI7XHJcbiAgICAgICAgdG90YWxUYXNrczogbnVtYmVyO1xyXG4gICAgfT4ge1xyXG4gICAgICAgIGNvbnN0IHllYXJOYW1lID0gdGhpcy5nZXRGaWxlTmFtZUJ5WWVhcihkYXRlKTtcclxuICAgICAgICBjb25zdCBzdGFydE9mV2VlayA9IHRoaXMuZ2V0U3RhcnRPZldlZWtTZWxmRGV2KGRhdGUpO1xyXG4gICAgICAgIGNvbnN0IGFsbFVuZmluaXNoZWRUYXNrczogc3RyaW5nW10gPSBbXTtcclxuICAgICAgICBsZXQgYWxsQ29udGVudCA9IFwiXCI7XHJcbiAgICAgICAgbGV0IHRvdGFsVW5maW5pc2hlZFRhc2tzID0gMDtcclxuICAgICAgICBsZXQgdG90YWxGaW5pc2hlZFRhc2tzID0gMDtcclxuICAgICAgICBsZXQgdG90YWxUYXNrcyA9IDA7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNzsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnQgPSBuZXcgRGF0ZShzdGFydE9mV2Vlayk7XHJcbiAgICAgICAgICAgIGN1cnJlbnQuc2V0RGF0ZShzdGFydE9mV2Vlay5nZXREYXRlKCkgKyBpKTtcclxuICAgICAgICAgICAgY29uc3Qgc3RhcnREYXkgPSBjdXJyZW50LmdldERhdGUoKTtcclxuICAgICAgICAgICAgY29uc3Qgc3RhcnRNb250aCA9IGN1cnJlbnQudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZW4tR0JcIiwgeyBtb250aDogXCJsb25nXCIgfSk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBmaWxlUGF0aCA9IGBEYWlseSBQbGFubmVyL+KchVRhc2tzLyR7eWVhck5hbWV9L/Cfk4UgJHtzdGFydE1vbnRofS/wn5OFICR7c3RhcnREYXl9ICR7c3RhcnRNb250aH0ubWRgO1xyXG4gICAgICAgICAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGZpbGVQYXRoKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgVGFzayBmaWxlIG5vdCBmb3VuZDogJHtmaWxlUGF0aH1gKTtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB1bmZpbmlzaGVkVGFza3MgPSBjb250ZW50XHJcbiAgICAgICAgICAgICAgICAgICAgLnNwbGl0KCdcXG4nKVxyXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIobGluZSA9PiBsaW5lLnRyaW0oKS5zdGFydHNXaXRoKCctIFsnKSAmJiAhbGluZS50cmltKCkuc3RhcnRzV2l0aCgnLSBbeF0nKSlcclxuICAgICAgICAgICAgICAgICAgICAubWFwKGxpbmUgPT4gbGluZS50cmltKCkpO1xyXG4gICAgICAgICAgICAgICAgdG90YWxVbmZpbmlzaGVkVGFza3MgKz0gdW5maW5pc2hlZFRhc2tzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBmaW5pc2hlZFRhc2tzID0gY29udGVudFxyXG4gICAgICAgICAgICAgICAgICAgIC5zcGxpdCgnXFxuJylcclxuICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKGxpbmUgPT4gbGluZS50cmltKCkuc3RhcnRzV2l0aCgnLSBbeF0nKSlcclxuICAgICAgICAgICAgICAgICAgICAubWFwKGxpbmUgPT4gbGluZS50cmltKCkpO1xyXG4gICAgICAgICAgICAgICAgdG90YWxGaW5pc2hlZFRhc2tzICs9IGZpbmlzaGVkVGFza3MubGVuZ3RoO1xyXG5cclxuICAgICAgICAgICAgICAgIGFsbFVuZmluaXNoZWRUYXNrcy5wdXNoKC4uLnVuZmluaXNoZWRUYXNrcyk7XHJcbiAgICAgICAgICAgICAgICBhbGxDb250ZW50ICs9IGNvbnRlbnQgKyBcIlxcblwiO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciByZWFkaW5nIGZpbGUgJHtmaWxlUGF0aH06ICR7ZS5tZXNzYWdlfWApO1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdG90YWxUYXNrcyA9IHRvdGFsRmluaXNoZWRUYXNrcyArIHRvdGFsVW5maW5pc2hlZFRhc2tzO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHRhc2tzOiBhbGxVbmZpbmlzaGVkVGFza3MsXHJcbiAgICAgICAgICAgIGNvbnRlbnQ6IGFsbENvbnRlbnQudHJpbSgpLFxyXG4gICAgICAgICAgICB0b3RhbFVuZmluaXNoZWRUYXNrcyxcclxuICAgICAgICAgICAgdG90YWxGaW5pc2hlZFRhc2tzLFxyXG4gICAgICAgICAgICB0b3RhbFRhc2tzXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlYWQgSGVhbHRoIFRyYWNrZXIgZGF0YSBmcm9tIGEgc3BlY2lmaWMgd2VlayBmaWxlXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgYXN5bmMgcmVhZFdlZWtGaWxlKGRhdGU6IERhdGUpOiBQcm9taXNlPHsgW211c2NsZUdyb3VwOiBzdHJpbmddOiBudW1iZXJbXSB9PiB7XHJcbiAgICAgICAgY29uc3QgbXVzY2xlR3JvdXBzID0gYXdhaXQgdGhpcy5nZXRNdXNjbGVHcm91cHNGcm9tSGVhbHRoVHJhY2tlcihkYXRlKTsgLy8gRHluYW1pYyBsaXN0XHJcbiAgICAgICAgY29uc3QgaGFiaXREYXRhOiB7IFttdXNjbGVHcm91cDogc3RyaW5nXTogbnVtYmVyW10gfSA9IHt9O1xyXG4gICAgICAgIG11c2NsZUdyb3Vwcy5mb3JFYWNoKGdyb3VwID0+IHtcclxuICAgICAgICAgICAgaGFiaXREYXRhW2dyb3VwXSA9IG5ldyBBcnJheSg3KS5maWxsKDApO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjb25zdCBtb250aE5hbWUgPSB0aGlzLmdldEZpbGVOYW1lQnlNb250aChkYXRlKTtcclxuICAgICAgICBjb25zdCB3ZWVrTmFtZSA9IHRoaXMuZ2V0RmlsZU5hbWVCeVdlZWsoZGF0ZSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGZpbGVQYXRoID0gYERhaWx5IFBsYW5uZXIv4p2k77iPSGVhbHRoIFRyYWNrZXIvJHttb250aE5hbWV9LyR7d2Vla05hbWV9YDtcclxuICAgICAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGZpbGVQYXRoKTtcclxuXHJcbiAgICAgICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFdlZWsgZmlsZSBub3QgZm91bmQ6ICR7ZmlsZVBhdGh9YCk7XHJcbiAgICAgICAgICAgIHJldHVybiBoYWJpdERhdGE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChmaWxlKTtcclxuICAgICAgICAgICAgY29uc3Qgd2Vla0hhYml0RGF0YSA9IHRoaXMucGFyc2VNYXJrZG93blRhYmxlKGNvbnRlbnQsIG11c2NsZUdyb3Vwcyk7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IG11c2NsZUdyb3VwIG9mIG11c2NsZUdyb3Vwcykge1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgZGF5SW5kZXggPSAwOyBkYXlJbmRleCA8IDc7IGRheUluZGV4KyspIHtcclxuICAgICAgICAgICAgICAgICAgICBoYWJpdERhdGFbbXVzY2xlR3JvdXBdW2RheUluZGV4XSA9IHdlZWtIYWJpdERhdGFbbXVzY2xlR3JvdXBdPy5bZGF5SW5kZXhdIHx8IDA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHJlYWRpbmcgd2VlayBmaWxlOiAke2ZpbGVQYXRofWAsIGUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGhhYml0RGF0YTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFBhcnNpbmcgYSBtYXJrZG93biB0YWJsZSB3aXRoIGR5bmFtaWMgbXVzY2xlIGdyb3Vwc1xyXG4gICAgICovXHJcbiAgICBwcml2YXRlIHBhcnNlTWFya2Rvd25UYWJsZShjb250ZW50OiBzdHJpbmcsIG11c2NsZUdyb3Vwczogc3RyaW5nW10pOiB7IFttdXNjbGVHcm91cDogc3RyaW5nXTogbnVtYmVyW10gfSB7XHJcbiAgICAgICAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xyXG4gICAgICAgIGNvbnN0IGhhYml0RGF0YTogeyBbbXVzY2xlR3JvdXA6IHN0cmluZ106IG51bWJlcltdIH0gPSB7fTtcclxuICAgICAgICBtdXNjbGVHcm91cHMuZm9yRWFjaChncm91cCA9PiAoaGFiaXREYXRhW2dyb3VwXSA9IG5ldyBBcnJheSg3KS5maWxsKDApKSk7XHJcblxyXG4gICAgICAgIGxldCBpblRhYmxlID0gZmFsc2U7XHJcbiAgICAgICAgZm9yIChjb25zdCBsaW5lIG9mIGxpbmVzKSB7XHJcbiAgICAgICAgICAgIGlmICghbGluZS50cmltKCkgfHwgbGluZS5pbmNsdWRlcyhcIldlZWtkYXlzXCIpIHx8IGxpbmUuaW5jbHVkZXMoXCItLS1cIikgfHwgbGluZS5pbmNsdWRlcyhcIkRhaWx5IEhhYml0cyBUcmFja1wiKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGxpbmUuaW5jbHVkZXMoXCJXZWVrZGF5c1wiKSkgaW5UYWJsZSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGluVGFibGUgJiYgbGluZS5pbmNsdWRlcyhcInxcIikpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNvbHVtbnMgPSBsaW5lLnNwbGl0KFwifFwiKTtcclxuICAgICAgICAgICAgICAgIGlmIChjb2x1bW5zLmxlbmd0aCA8IDkpIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IG11c2NsZUdyb3VwID0gY29sdW1uc1sxXS50cmltKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIW11c2NsZUdyb3Vwcy5pbmNsdWRlcyhtdXNjbGVHcm91cCkpIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGRheUluZGV4ID0gMDsgZGF5SW5kZXggPCA3OyBkYXlJbmRleCsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2VsbEluZGV4ID0gZGF5SW5kZXggKyAyO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjZWxsSW5kZXggPCBjb2x1bW5zLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjZWxsID0gY29sdW1uc1tjZWxsSW5kZXhdLnRyaW0oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNlbGwuaW5jbHVkZXMoXCLimJHvuI9cIikgfHwgY2VsbC5pbmNsdWRlcyhcInVuY2hlY2tlZFwiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFiaXREYXRhW211c2NsZUdyb3VwXVtkYXlJbmRleF0gPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFiaXREYXRhW211c2NsZUdyb3VwXVtkYXlJbmRleF0rKztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gaGFiaXREYXRhO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQXNzZW1ibHkgb2YgWUFNTCBkYXRhIGZvciB0aGUgc3RhY2tlZC1iYXItY2hhcnQgYmxvY2tcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBnZW5lcmF0ZUNoYXJ0WWFtbChoYWJpdERhdGE6IHsgW211c2NsZUdyb3VwOiBzdHJpbmddOiBudW1iZXJbXSB9KTogc3RyaW5nIHtcclxuXHJcblxyXG4gICAgICAgIGNvbnN0IG11c2NsZUdyb3VwcyA9IE9iamVjdC5rZXlzKGhhYml0RGF0YSk7IC8vIER5bmFtaWMgbGlzdCBmcm9tIGRhdGFcclxuICAgICAgICBjb25zdCBkYXRhc2V0cyA9IG11c2NsZUdyb3Vwcy5tYXAobXVzY2xlR3JvdXAgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBjb2xvciA9IE1VU0NMRV9DT0xPUlNbbXVzY2xlR3JvdXAgYXMga2V5b2YgdHlwZW9mIE1VU0NMRV9DT0xPUlNdIHx8IGhhc2hDb2xvcihtdXNjbGVHcm91cCk7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBsYWJlbDogbXVzY2xlR3JvdXAsXHJcbiAgICAgICAgICAgICAgICBkYXRhOiBoYWJpdERhdGFbbXVzY2xlR3JvdXBdIHx8IG5ldyBBcnJheSg3KS5maWxsKDApLFxyXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBjb2xvclxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjb25zdCB5YW1sTGluZXM6IHN0cmluZ1tdID0gW107XHJcbiAgICAgICAgeWFtbExpbmVzLnB1c2goXCJsYWJlbHM6XCIpO1xyXG4gICAgICAgIFdFRUtEQVlTLmZvckVhY2goZGF5ID0+IHlhbWxMaW5lcy5wdXNoKGAgIC0gJHtkYXl9YCkpO1xyXG4gICAgICAgIHlhbWxMaW5lcy5wdXNoKFwiZGF0YXNldHM6XCIpO1xyXG4gICAgICAgIGRhdGFzZXRzLmZvckVhY2goZHMgPT4ge1xyXG4gICAgICAgICAgICB5YW1sTGluZXMucHVzaChgICAtIGxhYmVsOiAke2RzLmxhYmVsfWApO1xyXG4gICAgICAgICAgICB5YW1sTGluZXMucHVzaChgICAgIGRhdGE6IFske2RzLmRhdGEuam9pbihcIiwgXCIpfV1gKTtcclxuICAgICAgICAgICAgeWFtbExpbmVzLnB1c2goYCAgICBiYWNrZ3JvdW5kQ29sb3I6IFwiJHtkcy5iYWNrZ3JvdW5kQ29sb3J9XCJgKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGBcclxuXFxgXFxgXFxgc3RhY2tlZC1iYXItY2hhcnRcclxuJHt5YW1sTGluZXMuam9pbihcIlxcblwiKX1cclxuXFxgXFxgXFxgXHJcbiAgICAgICAgYC50cmltKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBIZWxwZXIgbWV0aG9kczogbW9udGggbmFtZSBhbmQgd2VlayBuYW1lXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgZ2V0RmlsZU5hbWVCeU1vbnRoKGRhdGU6IERhdGUpOiBzdHJpbmcge1xyXG4gICAgICAgIGNvbnN0IG1vbnRoRGF0YSA9IGRhdGUudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZW4tR0JcIiwgeyBtb250aDogXCJsb25nXCIgfSk7XHJcbiAgICAgICAgcmV0dXJuIGDwn5OFICR7bW9udGhEYXRhfWA7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRGaWxlTmFtZUJ5V2VlayhkYXRlOiBEYXRlKTogc3RyaW5nIHtcclxuICAgICAgICBjb25zdCBzdGFydE9mV2VlayA9IHRoaXMuZ2V0U3RhcnRPZldlZWsoZGF0ZSk7XHJcbiAgICAgICAgY29uc3QgZW5kT2ZXZWVrID0gbmV3IERhdGUoc3RhcnRPZldlZWspO1xyXG4gICAgICAgIGVuZE9mV2Vlay5zZXREYXRlKHN0YXJ0T2ZXZWVrLmdldERhdGUoKSArIDYpO1xyXG5cclxuICAgICAgICBjb25zdCBzdGFydERhdGUgPSBzdGFydE9mV2Vlay5nZXREYXRlKCk7XHJcbiAgICAgICAgY29uc3QgZW5kRGF0ZSA9IGVuZE9mV2Vlay5nZXREYXRlKCk7XHJcbiAgICAgICAgY29uc3Qgc3RhcnRNb250aCA9IHN0YXJ0T2ZXZWVrLnRvTG9jYWxlRGF0ZVN0cmluZyhcImVuLUdCXCIsIHsgbW9udGg6IFwic2hvcnRcIiB9KTtcclxuICAgICAgICBjb25zdCBlbmRNb250aCA9IGVuZE9mV2Vlay50b0xvY2FsZURhdGVTdHJpbmcoXCJlbi1HQlwiLCB7IG1vbnRoOiBcInNob3J0XCIgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBzdGFydE1vbnRoID09PSBlbmRNb250aFxyXG4gICAgICAgICAgICA/IGAke3N0YXJ0RGF0ZX0gLSAke2VuZERhdGV9Lm1kYFxyXG4gICAgICAgICAgICA6IGAke3N0YXJ0RGF0ZX0gJHtzdGFydE1vbnRofSAtICR7ZW5kRGF0ZX0gJHtlbmRNb250aH0ubWRgO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENhbGN1bGF0ZSB0aGUgc3RhcnQgb2YgdGhlIHdlZWsgKE1vbmRheSkgZm9yIEhlYWx0aCBUcmFja2VyXHJcbiAgICBwcml2YXRlIGdldFN0YXJ0T2ZXZWVrKGRhdGU6IERhdGUpOiBEYXRlIHtcclxuICAgICAgICBjb25zdCBzdGFydE9mV2VlayA9IG5ldyBEYXRlKGRhdGUpO1xyXG4gICAgICAgIGNvbnN0IGRheSA9IHN0YXJ0T2ZXZWVrLmdldERheSgpOyAvLyBTdW5kYXkgPSAwLCBNb25kYXkgPSAxLCAuLi5cclxuICAgICAgICBjb25zdCBvZmZzZXQgPSBkYXkgPT09IDAgPyA2IDogZGF5IC0gMTsgLy8gQWRqdXN0IGZvciBNb25kYXkgc3RhcnRcclxuICAgICAgICBzdGFydE9mV2Vlay5zZXREYXRlKHN0YXJ0T2ZXZWVrLmdldERhdGUoKSAtIG9mZnNldCk7XHJcbiAgICAgICAgc3RhcnRPZldlZWsuc2V0SG91cnMoMCwgMCwgMCwgMCk7IC8vIFJlc2V0IHRpbWUgdG8gbWlkbmlnaHRcclxuICAgICAgICByZXR1cm4gc3RhcnRPZldlZWs7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRGaWxlTmFtZUJ5WWVhcihkYXRlOiBEYXRlKTogc3RyaW5nIHtcclxuICAgICAgICBjb25zdCB5ZWFyRGF0ZSA9IGRhdGUudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZW4tR0JcIiwgeyB5ZWFyOiBcIm51bWVyaWNcIiB9KTtcclxuICAgICAgICByZXR1cm4gYCR7eWVhckRhdGV9IFllYXJgO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0U3RhcnRPZldlZWtTZWxmRGV2KGRhdGU6IERhdGUpOiBEYXRlIHtcclxuICAgICAgICBjb25zdCBzdGFydE9mV2VlayA9IG5ldyBEYXRlKGRhdGUpO1xyXG4gICAgICAgIGNvbnN0IGRheSA9IHN0YXJ0T2ZXZWVrLmdldERheSgpOyAvLyBTdW5kYXkgPSAwLCBNb25kYXkgPSAxLCAuLi5cclxuICAgICAgICBjb25zdCBvZmZzZXQgPSBkYXkgPT09IDAgPyA2IDogZGF5ICsgNjsgLy8gQWRqdXN0IGZvciBNb25kYXkgc3RhcnQgKGVycm9yIGluIHRoZSBvcmlnaW5hbCwgZml4ZWQpXHJcbiAgICAgICAgc3RhcnRPZldlZWsuc2V0RGF0ZShzdGFydE9mV2Vlay5nZXREYXRlKCkgLSBvZmZzZXQpO1xyXG4gICAgICAgIHN0YXJ0T2ZXZWVrLnNldEhvdXJzKDAsIDAsIDAsIDApOyAvLyBSZXNldCB0aW1lIHRvIG1pZG5pZ2h0XHJcbiAgICAgICAgcmV0dXJuIHN0YXJ0T2ZXZWVrO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IG11c2NsZSBncm91cHMgZnJvbSB0aGUgcHJldmlvdXMgSGVhbHRoIFRyYWNrZXIgZmlsZVxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIGFzeW5jIGdldE11c2NsZUdyb3Vwc0Zyb21IZWFsdGhUcmFja2VyKGRhdGU6IERhdGUpOiBQcm9taXNlPHN0cmluZ1tdPiB7XHJcbiAgICAgICAgY29uc3QgcHJldmlvdXNXZWVrU3RhcnQgPSBuZXcgRGF0ZSh0aGlzLmdldFN0YXJ0T2ZXZWVrKGRhdGUpKTtcclxuICAgICAgICBwcmV2aW91c1dlZWtTdGFydC5zZXREYXRlKHByZXZpb3VzV2Vla1N0YXJ0LmdldERhdGUoKSAtIDcpOyAvLyBTd2l0Y2ggdG8gdGhlIHByZXZpb3VzIHdlZWtcclxuXHJcbiAgICAgICAgY29uc3QgcHJldmlvdXNQYXRoID0gYERhaWx5IFBsYW5uZXIv4p2k77iPSGVhbHRoIFRyYWNrZXIvJHt0aGlzLmdldEZpbGVOYW1lQnlNb250aChwcmV2aW91c1dlZWtTdGFydCl9LyR7dGhpcy5nZXRGaWxlTmFtZUJ5V2VlayhwcmV2aW91c1dlZWtTdGFydCl9YDtcclxuICAgICAgICBjb25zdCBwcmV2aW91c0ZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplUGF0aChwcmV2aW91c1BhdGgpKSBhcyBURmlsZSB8IG51bGw7XHJcblxyXG4gICAgICAgIGlmICghcHJldmlvdXNGaWxlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgUHJldmlvdXMgd2VlayBmaWxlIG5vdCBmb3VuZDogJHtwcmV2aW91c1BhdGh9LiBVc2luZyBkZWZhdWx0IG11c2NsZSBncm91cHMuYCk7XHJcbiAgICAgICAgICAgIHJldHVybiBERUZBVUxUX01VU0NMRV9HUk9VUFM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChwcmV2aW91c0ZpbGUpO1xyXG4gICAgICAgICAgICBjb25zdCBsaW5lcyA9IGNvbnRlbnQuc3BsaXQoXCJcXG5cIik7XHJcblxyXG4gICAgICAgICAgICBjb25zdCB0YWJsZVN0YXJ0ID0gbGluZXMuZmluZEluZGV4KGxpbmUgPT4gbGluZS5pbmNsdWRlcyhcIkRhaWx5IEhhYml0cyBUcmFja1wiKSk7XHJcbiAgICAgICAgICAgIGlmICh0YWJsZVN0YXJ0ID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIERFRkFVTFRfTVVTQ0xFX0dST1VQUzsgLy8gRmFsbGJhY2sgaWYgdGhlIHRhYmxlIGlzIGNvcnJ1cHRlZFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25zdCBtdXNjbGVHcm91cHM6IHN0cmluZ1tdID0gW107XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSB0YWJsZVN0YXJ0ICsgMTsgaSA8IGxpbmVzLmxlbmd0aCAmJiBsaW5lc1tpXS5zdGFydHNXaXRoKFwifFwiKTsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjZWxscyA9IGxpbmVzW2ldLnNwbGl0KFwifFwiKS5tYXAoY2VsbCA9PiBjZWxsLnRyaW0oKSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoY2VsbHMubGVuZ3RoIDwgMikgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgZ3JvdXAgPSBjZWxsc1sxXTtcclxuICAgICAgICAgICAgICAgIGlmIChncm91cCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG11c2NsZUdyb3Vwcy5wdXNoKGdyb3VwKTsgLy8gRXh0cmFjdCB0aGUgbXVzY2xlIGdyb3VwIGZyb20gdGhlIHNlY29uZCBjb2x1bW5cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG11c2NsZUdyb3Vwcy5sZW5ndGggPiAwID8gbXVzY2xlR3JvdXBzIDogREVGQVVMVF9NVVNDTEVfR1JPVVBTO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHBhcnNpbmcgcHJldmlvdXMgd2VlayBmaWxlICR7cHJldmlvdXNQYXRofTpgLCBlcnJvcik7XHJcbiAgICAgICAgICAgIHJldHVybiBERUZBVUxUX01VU0NMRV9HUk9VUFM7IC8vIEZhbGxiYWNrIHRvIGRlZmF1bHRcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iXX0=