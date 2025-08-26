import { __awaiter } from "tslib";
// main.ts
import { Notice, Plugin, addIcon, TFolder } from 'obsidian';
import { SelfDevManager } from './models/selfDevModel';
import { HealthTrackerManager } from "./models/healthTrackerModel";
import { SummaryManager } from "./models/summaryManager";
import { TableChart } from './utils/stacked-bar-chart';
import { PassThrough } from 'stream';
export default class MyPlugin extends Plugin {
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('loading plugin 🚀');
            addIcon('circle', '<circle cx="50" cy="50" r="50" fill="currentColor"/>');
            // Initialize SummaryManager
            this.summaryManager = new SummaryManager(this.app);
            //================== Chart TEST ==========================
            this.chart = new TableChart();
            // Register the code block
            this.registerMarkdownCodeBlockProcessor("stacked-bar-chart", (source, el) => {
                this.chart.renderChart(source, el);
            });
            // Command for auto-creating a file
            this.addCommand({
                id: "create-stacked-bar-chart-file",
                name: "📊 Create Chart File",
            });
            //============================================
            this.selfDevManager = new SelfDevManager(this.app, {
                mainFileDirectory: "Daily Planner",
                taskFileDirectory: "✅Tasks"
            });
            // Adding tasks command
            this.addCommand({
                id: 'add-task',
                name: 'Add Task',
                callback: () => __awaiter(this, void 0, void 0, function* () {
                    yield this.selfDevManager.createDailyFile();
                    const tasks = yield this.selfDevManager.getTodayTasks();
                    new Notice(`Today tasks: ${tasks.length > 0 ? tasks.join(', ') : 'no tasks'}`);
                })
            });
            this.healthTrackerManager = new HealthTrackerManager(this.app, {
                mainFileDirectory: "Daily Planner",
                healthTrackerFileDirectory: "❤️Health Tracker"
            });
            // Adding Health Tracker command
            this.addCommand({
                id: 'track health',
                name: 'Create Weekly Health Tracker',
                callback: () => __awaiter(this, void 0, void 0, function* () {
                    yield this.healthTrackerManager.createWeeklyFile();
                    const tasks = yield this.healthTrackerManager.getThisWeekSummary();
                    new Notice(`Health Tracker created: ${tasks.length > 0 ? tasks.join(', ') : 'No content'}`);
                })
            });
            // Structure and tasks manager creation through 2ribbon icon"
            this.addRibbonIcon('circle', 'Manager', () => __awaiter(this, void 0, void 0, function* () {
                const folderPath = "Daily Planner";
                const folderSelfDevPath = "✅Tasks";
                const folderHealthTrackerPath = "❤️Health Tracker";
                const filePathSelfDev = `${folderPath}/${folderSelfDevPath}`;
                const folderPathHealth = `${folderPath}/${folderHealthTrackerPath}`;
                // Summary file
                const summaryFilePath = `${folderPath}/Summary.md`;
                // Folder checking and creation
                let folder = this.app.vault.getAbstractFileByPath(folderPath);
                if (!folder) {
                    console.log('Creating folder:', folderPath);
                    yield this.app.vault.createFolder(folderPath);
                    new Notice('Directory "Daily Planner" created!');
                    folder = this.app.vault.getAbstractFileByPath(folderPath);
                }
                //=================== TASKS ====================================
                // Creatin "Tasks" Folder
                if (!this.app.vault.getAbstractFileByPath(`${folderPath}/${folderSelfDevPath}`)) {
                    console.log(`Creating inside directory 'Tasks': ${folderSelfDevPath}`);
                    yield this.app.vault.createFolder(`${folderPath}/${folderSelfDevPath}`);
                    new Notice('Inside directory "✅Tasks" created!');
                }
                // Checking and Creation "Tasks" folder
                let fileSelfDev = this.app.vault.getAbstractFileByPath(filePathSelfDev);
                if (!fileSelfDev) {
                    console.log('✅ Creating file:', filePathSelfDev);
                    fileSelfDev = yield this.app.vault.createFolder(filePathSelfDev);
                    new Notice('✅ Direction "✅Tasks" created!');
                }
                if (fileSelfDev instanceof TFolder) {
                    yield this.selfDevManager.createDailyFile(); // Creating the section for today
                    const tasks = yield this.selfDevManager.getTodayTasks();
                    // Checking if tasks have been transferred today 
                    const today = new Date().toLocaleDateString("en-GB");
                    const todayFilePath = this.selfDevManager.getFilePathByDate(new Date());
                    const todayFile = this.app.vault.getAbstractFileByPath(todayFilePath);
                    if (todayFile) {
                        let content = yield this.app.vault.read(todayFile);
                        const migrationMarker = `Migrated: ${today}\n`;
                        if (!content.includes(migrationMarker)) {
                            try {
                                yield this.selfDevManager.migrateUnfinishedTasks();
                                yield this.app.vault.append(todayFile, `-----------------\n${migrationMarker}`);
                                new Notice(`Transferred unfinished tasks for today!`);
                            }
                            catch (error) {
                                new Notice(`Error mimgrating tasks: ${error.message}`);
                            }
                        }
                        else {
                            PassThrough;
                        }
                    }
                }
                // ================= HEALTH TRACKER ================================
                // Creating "Health Tracker" Folder 
                if (!this.app.vault.getAbstractFileByPath(`${folderPath}/${folderHealthTrackerPath}`)) {
                    yield this.app.vault.createFolder(`${folderPath}/${folderHealthTrackerPath}`);
                    new Notice('Inside directory "❤️Health Tracker" created!');
                }
                // Checking and Create "Health Tracker" folder
                let filePathHealthTracker = this.app.vault.getAbstractFileByPath(folderPathHealth);
                if (!filePathHealthTracker) {
                    filePathHealthTracker = yield this.app.vault.createFolder(folderPathHealth);
                    new Notice('✅ Direction "❤️Health Tracker" created!');
                }
                if (filePathHealthTracker instanceof TFolder) {
                    yield this.healthTrackerManager.createWeeklyFile();
                    const summary = yield this.healthTrackerManager.getThisWeekSummary();
                    new Notice(`${summary}`);
                    // Generate summary after creating the tracker
                    const dailyTasks = yield this.summaryManager.readDailyTasksFile(new Date());
                    yield this.summaryManager.generateWeeklySummary(dailyTasks, new Date(), "Daily Planner/Summary.md");
                }
                // Create or update Summary.md
                let summaryFile = this.app.vault.getAbstractFileByPath(summaryFilePath);
                if (!summaryFile) {
                    yield this.app.vault.create(summaryFilePath, "# Summary\n\nInitial summary content.");
                    new Notice('Summary.md created!');
                }
            }));
            //================== SUMMARY =========================
            // SummaryManager Initialization
            const summaryManager = new SummaryManager(this.app);
            const dailyTasks = yield summaryManager.readDailyTasksFile(new Date());
            yield summaryManager.generateWeeklySummary(dailyTasks, new Date(), "Daily Planner/Summary.md");
        });
    }
    onunload() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('unloading plugin ⛔');
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL21haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLFVBQVU7QUFDVixPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQWlCLE9BQU8sRUFBa0MsTUFBTSxVQUFVLENBQUM7QUFDM0csT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBQ3ZELE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLDZCQUE2QixDQUFDO0FBQ25FLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUN6RCxPQUFPLEVBQUMsVUFBVSxFQUFFLE1BQU0sMkJBQTJCLENBQUM7QUFDdEQsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLFFBQVEsQ0FBQztBQUdyQyxNQUFNLENBQUMsT0FBTyxPQUFPLFFBQVMsU0FBUSxNQUFNO0lBTWxDLE1BQU07O1lBRVIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBRWpDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsc0RBQXNELENBQUMsQ0FBQztZQUUxRSw0QkFBNEI7WUFDNUIsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLGNBQWMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFbkQsMERBQTBEO1lBRTFELElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxVQUFVLEVBQUUsQ0FBQTtZQUM3QiwwQkFBMEI7WUFDMUIsSUFBSSxDQUFDLGtDQUFrQyxDQUFDLG1CQUFtQixFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFO2dCQUN4RSxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDdkMsQ0FBQyxDQUFDLENBQUM7WUFFSCxtQ0FBbUM7WUFDbkMsSUFBSSxDQUFDLFVBQVUsQ0FBQztnQkFDWixFQUFFLEVBQUUsK0JBQStCO2dCQUNu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TUFBTSxjQUFjLEdBQUcsSUFBSSxjQUFjLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3BELE1BQU0sVUFBVSxHQUFHLE1BQU0sY0FBYyxDQUFDLGtCQUFrQixDQUFDLElBQUksSUFBSSxFQUFFLENBQUMsQ0FBQztZQUN2RSxNQUFNLGNBQWMsQ0FBQyxxQkFBcUIsQ0FBQyxVQUFVLEVBQUUsSUFBSSxJQUFJLEVBQUUsRUFBRSwwQkFBMEIsQ0FBQyxDQUFDO1FBQ25HLENBQUM7S0FBQTtJQUVLLFFBQVE7O1lBQ1YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBQ3RDLENBQUM7S0FBQTtDQUNKIiwic291cmNlc0NvbnRlbnQiOlsiLy8gbWFpbi50c1xyXG5pbXBvcnQgeyBOb3RpY2UsIFBsdWdpbiwgYWRkSWNvbiwgVEFic3RyYWN0RmlsZSwgVEZvbGRlciwgVEZpbGUsIFdvcmtzcGFjZUxlYWYsIEl0ZW1WaWV3IH0gZnJvbSAnb2JzaWRpYW4nO1xyXG5pbXBvcnQgeyBTZWxmRGV2TWFuYWdlciB9IGZyb20gJy4vbW9kZWxzL3NlbGZEZXZNb2RlbCc7XHJcbmltcG9ydCB7IEhlYWx0aFRyYWNrZXJNYW5hZ2VyIH0gZnJvbSBcIi4vbW9kZWxzL2hlYWx0aFRyYWNrZXJNb2RlbFwiO1xyXG5pbXBvcnQgeyBTdW1tYXJ5TWFuYWdlciB9IGZyb20gXCIuL21vZGVscy9zdW1tYXJ5TWFuYWdlclwiO1xyXG5pbXBvcnQge1RhYmxlQ2hhcnQgfSBmcm9tICcuL3V0aWxzL3N0YWNrZWQtYmFyLWNoYXJ0JztcclxuaW1wb3J0IHsgUGFzc1Rocm91Z2ggfSBmcm9tICdzdHJlYW0nO1xyXG5cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE15UGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcclxuICAgIHByaXZhdGUgc2VsZkRldk1hbmFnZXI6IFNlbGZEZXZNYW5hZ2VyO1xyXG4gICAgcHJpdmF0ZSBoZWFsdGhUcmFja2VyTWFuYWdlcjogSGVhbHRoVHJhY2tlck1hbmFnZXI7XHJcbiAgICBwcml2YXRlIHN1bW1hcnlNYW5hZ2VyOiBTdW1tYXJ5TWFuYWdlcjtcclxuICAgIHByaXZhdGUgY2hhcnQ6IFRhYmxlQ2hhcnQ7XHJcblxyXG4gICAgYXN5bmMgb25sb2FkKCkge1xyXG5cclxuICAgICAgICBjb25zb2xlLmxvZygnbG9hZGluZyBwbHVnaW4g8J+agCcpO1xyXG5cclxuICAgICAgICBhZGRJY29uKCdjaXJjbGUnLCAnPGNpcmNsZSBjeD1cIjUwXCIgY3k9XCI1MFwiIHI9XCI1MFwiIGZpbGw9XCJjdXJyZW50Q29sb3JcIi8+Jyk7XHJcblxyXG4gICAgICAgIC8vIEluaXRpYWxpemUgU3VtbWFyeU1hbmFnZXJcclxuICAgICAgICB0aGlzLnN1bW1hcnlNYW5hZ2VyID0gbmV3IFN1bW1hcnlNYW5hZ2VyKHRoaXMuYXBwKTtcclxuXHJcbiAgICAgICAgLy89PT09PT09PT09PT09PT09PT0gQ2hhcnQgVEVTVCA9PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuY2hhcnQgPSBuZXcgVGFibGVDaGFydCgpXHJcbiAgICAgICAgLy8gUmVnaXN0ZXIgdGhlIGNvZGUgYmxvY2tcclxuICAgICAgICB0aGlzLnJlZ2lzdGVyTWFya2Rvd25Db2RlQmxvY2tQcm9jZXNzb3IoXCJzdGFja2VkLWJhci1jaGFydFwiLCAoc291cmNlLCBlbCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmNoYXJ0LnJlbmRlckNoYXJ0KHNvdXJjZSwgZWwpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBDb21tYW5kIGZvciBhdXRvLWNyZWF0aW5nIGEgZmlsZVxyXG4gICAgICAgIHRoaXMuYWRkQ29tbWFuZCh7XHJcbiAgICAgICAgICAgIGlkOiBcImNyZWF0ZS1zdGFja2VkLWJhci1jaGFydC1maWxlXCIsXHJcbiAgICAgICAgICAgIG5hbWU6IFwi8J+TiiBDcmVhdGUgQ2hhcnQgRmlsZVwiLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuXHJcblxyXG4gICAgICAgIHRoaXMuc2VsZkRldk1hbmFnZXIgPSBuZXcgU2VsZkRldk1hbmFnZXIodGhpcy5hcHAsIHtcclxuICAgICAgICAgICAgbWFpbkZpbGVEaXJlY3Rvcnk6IFwiRGFpbHkgUGxhbm5lclwiLFxyXG4gICAgICAgICAgICB0YXNrRmlsZURpcmVjdG9yeTogXCLinIVUYXNrc1wiIFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBBZGRpbmcgdGFza3MgY29tbWFuZFxyXG4gICAgICAgIHRoaXMuYWRkQ29tbWFuZCh7XHJcbiAgICAgICAgaWQ6ICdhZGQtdGFzaycsXHJcbiAgICAgICAgbmFtZTogJ0FkZCBUYXNrJyxcclxuICAgICAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnNlbGZEZXZNYW5hZ2VyLmNyZWF0ZURhaWx5RmlsZSgpO1xyXG4gICAgICAgICAgICBjb25zdCB0YXNrcyA9IGF3YWl0IHRoaXMuc2VsZkRldk1hbmFnZXIuZ2V0VG9kYXlUYXNrcygpO1xyXG4gICAgICAgICAgICBuZXcgTm90aWNlKGBUb2RheSB0YXNrczogJHt0YXNrcy5sZW5ndGggPiAwID8gdGFza3Muam9pbignLCAnKSA6ICdubyB0YXNrcyd9YCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmhlYWx0aFRyYWNrZXJNYW5hZ2VyID0gbmV3IEhlYWx0aFRyYWNrZXJNYW5hZ2VyKHRoaXMuYXBwLCB7XHJcbiAgICAgICAgICAgIG1haW5GaWxlRGlyZWN0b3J5OiBcIkRhaWx5IFBsYW5uZXJcIixcclxuICAgICAgICAgICAgaGVhbHRoVHJhY2tlckZpbGVEaXJlY3Rvcnk6IFwi4p2k77iPSGVhbHRoIFRyYWNrZXJcIlxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBBZGRpbmcgSGVhbHRoIFRyYWNrZXIgY29tbWFuZFxyXG4gICAgICAgIHRoaXMuYWRkQ29tbWFuZCh7XHJcbiAgICAgICAgICAgIGlkOiAndHJhY2sgaGVhbHRoJyxcclxuICAgICAgICAgICAgbmFtZTogJ0NyZWF0ZSBXZWVrbHkgSGVhbHRoIFRyYWNrZXInLFxyXG4gICAgICAgICAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5oZWFsdGhUcmFja2VyTWFuYWdlci5jcmVhdGVXZWVrbHlGaWxlKCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0YXNrcyA9IGF3YWl0IHRoaXMuaGVhbHRoVHJhY2tlck1hbmFnZXIuZ2V0VGhpc1dlZWtTdW1tYXJ5KCk7XHJcbiAgICAgICAgICAgICAgICBuZXcgTm90aWNlKGBIZWFsdGggVHJhY2tlciBjcmVhdGVkOiAke3Rhc2tzLmxlbmd0aCA+IDAgPyB0YXNrcy5qb2luKCcsICcpIDogJ05vIGNvbnRlbnQnfWApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIFN0cnVjdHVyZSBhbmQgdGFza3MgbWFuYWdlciBjcmVhdGlvbiB0aHJvdWdoIDJyaWJib24gaWNvblwiXHJcbiAgICAgICAgdGhpcy5hZGRSaWJib25JY29uKCdjaXJjbGUnLCAnTWFuYWdlcicsIGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgZm9sZGVyUGF0aCA9IFwiRGFpbHkgUGxhbm5lclwiO1xyXG4gICAgICAgICAgICBjb25zdCBmb2xkZXJTZWxmRGV2UGF0aCA9IFwi4pyFVGFza3NcIjtcclxuICAgICAgICAgICAgY29uc3QgZm9sZGVySGVhbHRoVHJhY2tlclBhdGggPSBcIuKdpO+4j0hlYWx0aCBUcmFja2VyXCI7XHJcbiAgICAgICAgICAgIGNvbnN0IGZpbGVQYXRoU2VsZkRldiA9IGAke2ZvbGRlclBhdGh9LyR7Zm9sZGVyU2VsZkRldlBhdGh9YDtcclxuICAgICAgICAgICAgY29uc3QgZm9sZGVyUGF0aEhlYWx0aCA9IGAke2ZvbGRlclBhdGh9LyR7Zm9sZGVySGVhbHRoVHJhY2tlclBhdGh9YDtcclxuICAgICAgICAgICAgLy8gU3VtbWFyeSBmaWxlXHJcbiAgICAgICAgICAgIGNvbnN0IHN1bW1hcnlGaWxlUGF0aCA9IGAke2ZvbGRlclBhdGh9L1N1bW1hcnkubWRgO1xyXG5cclxuICAgICAgICAgICAgLy8gRm9sZGVyIGNoZWNraW5nIGFuZCBjcmVhdGlvblxyXG4gICAgICAgICAgICBsZXQgZm9sZGVyID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGZvbGRlclBhdGgpO1xyXG4gICAgICAgICAgICBpZiAoIWZvbGRlcikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0NyZWF0aW5nIGZvbGRlcjonLCBmb2xkZXJQYXRoKTtcclxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcihmb2xkZXJQYXRoKTtcclxuICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UoJ0RpcmVjdG9yeSBcIkRhaWx5IFBsYW5uZXJcIiBjcmVhdGVkIScpO1xyXG4gICAgICAgICAgICAgICAgZm9sZGVyID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGZvbGRlclBhdGgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLz09PT09PT09PT09PT09PT09PT0gVEFTS1MgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcblxyXG4gICAgICAgICAgICAvLyBDcmVhdGluIFwiVGFza3NcIiBGb2xkZXJcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoYCR7Zm9sZGVyUGF0aH0vJHtmb2xkZXJTZWxmRGV2UGF0aH1gKSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYENyZWF0aW5nIGluc2lkZSBkaXJlY3RvcnkgJ1Rhc2tzJzogJHtmb2xkZXJTZWxmRGV2UGF0aH1gKTtcclxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcihgJHtmb2xkZXJQYXRofS8ke2ZvbGRlclNlbGZEZXZQYXRofWApO1xyXG4gICAgICAgICAgICAgICAgbmV3IE5vdGljZSgnSW5zaWRlIGRpcmVjdG9yeSBcIuKchVRhc2tzXCIgY3JlYXRlZCEnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gQ2hlY2tpbmcgYW5kIENyZWF0aW9uIFwiVGFza3NcIiBmb2xkZXJcclxuICAgICAgICAgICAgbGV0IGZpbGVTZWxmRGV2ID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGZpbGVQYXRoU2VsZkRldik7XHJcbiAgICAgICAgICAgIGlmICghZmlsZVNlbGZEZXYpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCfinIUgQ3JlYXRpbmcgZmlsZTonLCBmaWxlUGF0aFNlbGZEZXYpO1xyXG4gICAgICAgICAgICAgICAgZmlsZVNlbGZEZXYgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGVGb2xkZXIoZmlsZVBhdGhTZWxmRGV2KTtcclxuICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UoJ+KchSBEaXJlY3Rpb24gXCLinIVUYXNrc1wiIGNyZWF0ZWQhJyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChmaWxlU2VsZkRldiBpbnN0YW5jZW9mIFRGb2xkZXIpIHtcclxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2VsZkRldk1hbmFnZXIuY3JlYXRlRGFpbHlGaWxlKCk7IC8vIENyZWF0aW5nIHRoZSBzZWN0aW9uIGZvciB0b2RheVxyXG4gICAgICAgICAgICAgICAgY29uc3QgdGFza3MgPSBhd2FpdCB0aGlzLnNlbGZEZXZNYW5hZ2VyLmdldFRvZGF5VGFza3MoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBDaGVja2luZyBpZiB0YXNrcyBoYXZlIGJlZW4gdHJhbnNmZXJyZWQgdG9kYXkgXHJcbiAgICAgICAgICAgICAgICBjb25zdCB0b2RheSA9IG5ldyBEYXRlKCkudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZW4tR0JcIik7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRvZGF5RmlsZVBhdGggPSB0aGlzLnNlbGZEZXZNYW5hZ2VyLmdldEZpbGVQYXRoQnlEYXRlKG5ldyBEYXRlKCkpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdG9kYXlGaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHRvZGF5RmlsZVBhdGgpIGFzIFRGaWxlO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0b2RheUZpbGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgY29udGVudCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQodG9kYXlGaWxlKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBtaWdyYXRpb25NYXJrZXIgPSBgTWlncmF0ZWQ6ICR7dG9kYXl9XFxuYDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWNvbnRlbnQuaW5jbHVkZXMobWlncmF0aW9uTWFya2VyKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2VsZkRldk1hbmFnZXIubWlncmF0ZVVuZmluaXNoZWRUYXNrcygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuYXBwZW5kKHRvZGF5RmlsZSxgLS0tLS0tLS0tLS0tLS0tLS1cXG4ke21pZ3JhdGlvbk1hcmtlcn1gKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UgKGBUcmFuc2ZlcnJlZCB1bmZpbmlzaGVkIHRhc2tzIGZvciB0b2RheSFgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UgKGBFcnJvciBtaW1ncmF0aW5nIHRhc2tzOiAke2Vycm9yLm1lc3NhZ2V9YCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2V7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFBhc3NUaHJvdWdoXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyA9PT09PT09PT09PT09PT09PSBIRUFMVEggVFJBQ0tFUiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG5cclxuICAgICAgICAgICAgLy8gQ3JlYXRpbmcgXCJIZWFsdGggVHJhY2tlclwiIEZvbGRlciBcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoYCR7Zm9sZGVyUGF0aH0vJHtmb2xkZXJIZWFsdGhUcmFja2VyUGF0aH1gKSkge1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlRm9sZGVyKGAke2ZvbGRlclBhdGh9LyR7Zm9sZGVySGVhbHRoVHJhY2tlclBhdGh9YCk7XHJcbiAgICAgICAgICAgICAgICBuZXcgTm90aWNlKCdJbnNpZGUgZGlyZWN0b3J5IFwi4p2k77iPSGVhbHRoIFRyYWNrZXJcIiBjcmVhdGVkIScpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBDaGVja2luZyBhbmQgQ3JlYXRlIFwiSGVhbHRoIFRyYWNrZXJcIiBmb2xkZXJcclxuICAgICAgICAgICAgbGV0IGZpbGVQYXRoSGVhbHRoVHJhY2tlciA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChmb2xkZXJQYXRoSGVhbHRoKTtcclxuICAgICAgICAgICAgaWYgKCFmaWxlUGF0aEhlYWx0aFRyYWNrZXIpIHtcclxuICAgICAgICAgICAgICAgIGZpbGVQYXRoSGVhbHRoVHJhY2tlciA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcihmb2xkZXJQYXRoSGVhbHRoKTtcclxuICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UoJ+KchSBEaXJlY3Rpb24gXCLinaTvuI9IZWFsdGggVHJhY2tlclwiIGNyZWF0ZWQhJyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChmaWxlUGF0aEhlYWx0aFRyYWNrZXIgaW5zdGFuY2VvZiBURm9sZGVyKSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmhlYWx0aFRyYWNrZXJNYW5hZ2VyLmNyZWF0ZVdlZWtseUZpbGUoKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHN1bW1hcnkgPSAgYXdhaXQgdGhpcy5oZWFsdGhUcmFja2VyTWFuYWdlci5nZXRUaGlzV2Vla1N1bW1hcnkoKTtcclxuICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UgKGAke3N1bW1hcnl9YCk7XHJcbiAgICAgICAgICAgICAgICAvLyBHZW5lcmF0ZSBzdW1tYXJ5IGFmdGVyIGNyZWF0aW5nIHRoZSB0cmFja2VyXHJcbiAgICAgICAgICAgICAgICBjb25zdCBkYWlseVRhc2tzID0gYXdhaXQgdGhpcy5zdW1tYXJ5TWFuYWdlci5yZWFkRGFpbHlUYXNrc0ZpbGUobmV3IERhdGUoKSk7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnN1bW1hcnlNYW5hZ2VyLmdlbmVyYXRlV2Vla2x5U3VtbWFyeShkYWlseVRhc2tzLCBuZXcgRGF0ZSgpLCBcIkRhaWx5IFBsYW5uZXIvU3VtbWFyeS5tZFwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gQ3JlYXRlIG9yIHVwZGF0ZSBTdW1tYXJ5Lm1kXHJcbiAgICAgICAgICAgIGxldCBzdW1tYXJ5RmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChzdW1tYXJ5RmlsZVBhdGgpIGFzIFRGaWxlIHwgbnVsbDtcclxuICAgICAgICAgICAgaWYgKCFzdW1tYXJ5RmlsZSkge1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlKHN1bW1hcnlGaWxlUGF0aCwgXCIjIFN1bW1hcnlcXG5cXG5Jbml0aWFsIHN1bW1hcnkgY29udGVudC5cIik7XHJcbiAgICAgICAgICAgICAgICBuZXcgTm90aWNlKCdTdW1tYXJ5Lm1kIGNyZWF0ZWQhJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgIFxyXG4gICAgICAgIC8vPT09PT09PT09PT09PT09PT09IFNVTU1BUlkgPT09PT09PT09PT09PT09PT09PT09PT09PVxyXG5cclxuICAgICAgICAvLyBTdW1tYXJ5TWFuYWdlciBJbml0aWFsaXphdGlvblxyXG4gICAgICAgIGNvbnN0IHN1bW1hcnlNYW5hZ2VyID0gbmV3IFN1bW1hcnlNYW5hZ2VyKHRoaXMuYXBwKTtcclxuICAgICAgICBjb25zdCBkYWlseVRhc2tzID0gYXdhaXQgc3VtbWFyeU1hbmFnZXIucmVhZERhaWx5VGFza3NGaWxlKG5ldyBEYXRlKCkpO1xyXG4gICAgICAgIGF3YWl0IHN1bW1hcnlNYW5hZ2VyLmdlbmVyYXRlV2Vla2x5U3VtbWFyeShkYWlseVRhc2tzLCBuZXcgRGF0ZSgpLCBcIkRhaWx5IFBsYW5uZXIvU3VtbWFyeS5tZFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBvbnVubG9hZCgpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygndW5sb2FkaW5nIHBsdWdpbiDim5QnKTtcclxuICAgIH1cclxufVxyXG5cclxuIl19