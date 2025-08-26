import { __awaiter } from "tslib";
/**
 * Recursively creates all folders in the specified path if they do not exist.
 * @param app - Instance of Obsidian `App`
 * @param filePath - Full path to the file (including the file name)
 */
export function ensureFoldersExist(app, filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const parts = filePath.split("/");
        parts.pop(); // remove the file name
        let currentPath = "";
        for (const part of parts) {
            currentPath += (currentPath ? "/" : "") + part;
            if (!app.vault.getAbstractFileByPath(currentPath)) {
                yield app.vault.createFolder(currentPath);
            }
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi91dGlscy91dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBRUE7Ozs7R0FJRztBQUNILE1BQU0sVUFBZ0Isa0JBQWtCLENBQUMsR0FBUSxFQUFFLFFBQWdCOztRQUNsRSxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2xDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLHVCQUF1QjtRQUNwQyxJQUFJLFdBQVcsR0FBRyxFQUFFLENBQUM7UUFFckIsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUU7WUFDekIsV0FBVyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQztZQUMvQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxXQUFXLENBQUMsRUFBRTtnQkFDbEQsTUFBTSxHQUFHLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQzthQUMxQztTQUNEO0lBQ0YsQ0FBQztDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwIH0gZnJvbSBcIm9ic2lkaWFuXCI7XHJcblxyXG4vKipcclxuICogUmVjdXJzaXZlbHkgY3JlYXRlcyBhbGwgZm9sZGVycyBpbiB0aGUgc3BlY2lmaWVkIHBhdGggaWYgdGhleSBkbyBub3QgZXhpc3QuXHJcbiAqIEBwYXJhbSBhcHAgLSBJbnN0YW5jZSBvZiBPYnNpZGlhbiBgQXBwYFxyXG4gKiBAcGFyYW0gZmlsZVBhdGggLSBGdWxsIHBhdGggdG8gdGhlIGZpbGUgKGluY2x1ZGluZyB0aGUgZmlsZSBuYW1lKVxyXG4gKi9cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGVuc3VyZUZvbGRlcnNFeGlzdChhcHA6IEFwcCwgZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xyXG5cdGNvbnN0IHBhcnRzID0gZmlsZVBhdGguc3BsaXQoXCIvXCIpO1xyXG5cdHBhcnRzLnBvcCgpOyAvLyByZW1vdmUgdGhlIGZpbGUgbmFtZVxyXG5cdGxldCBjdXJyZW50UGF0aCA9IFwiXCI7XHJcblxyXG5cdGZvciAoY29uc3QgcGFydCBvZiBwYXJ0cykge1xyXG5cdFx0Y3VycmVudFBhdGggKz0gKGN1cnJlbnRQYXRoID8gXCIvXCIgOiBcIlwiKSArIHBhcnQ7XHJcblx0XHRpZiAoIWFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoY3VycmVudFBhdGgpKSB7XHJcblx0XHRcdGF3YWl0IGFwcC52YXVsdC5jcmVhdGVGb2xkZXIoY3VycmVudFBhdGgpO1xyXG5cdFx0fVxyXG5cdH1cclxufVxyXG4iXX0=