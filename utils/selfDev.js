import { __awaiter } from "tslib";
import { TFile, Notice } from 'obsidian';
export function appendSelfDevelopmentTask(app, file, task = '- [ ] New task') {
    return __awaiter(this, void 0, void 0, function* () {
        if (file instanceof TFile) {
            try {
                console.log('Appending to file:', file.path);
                yield app.vault.append(file, `${task}\n`);
                new Notice('New task added to Self Development!');
            }
            catch (error) {
                console.error('Failed to append to file:', error);
                new Notice('Failed to add task.');
            }
        }
        else {
            new Notice('Error: File is not a TFile.');
            console.log('File type error:', file);
        }
        // // Проверяем тип файла и добавляем задачу
        // if (file instanceof TFile) {
        //     console.log('Appending to file:', file.path);
        //     await this.app.vault.append(file, "- [ ] New task\n");
        //     new Notice('New task added!');
        // } else {
        //     new Notice('Error: File is not a TFile or could not be created.');
        //     console.log('File type error:', file);
        // }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZkRldi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3V0aWxzL3NlbGZEZXYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBTyxLQUFLLEVBQUUsTUFBTSxFQUE2QixNQUFNLFVBQVUsQ0FBQztBQUV6RSxNQUFNLFVBQWdCLHlCQUF5QixDQUFDLEdBQVEsRUFBRSxJQUFXLEVBQUUsT0FBZSxnQkFBZ0I7O1FBQ2xHLElBQUksSUFBSSxZQUFZLEtBQUssRUFBRTtZQUN2QixJQUFJO2dCQUNBLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM3QyxNQUFNLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxHQUFHLElBQUksSUFBSSxDQUFDLENBQUM7Z0JBQzFDLElBQUksTUFBTSxDQUFDLHFDQUFxQyxDQUFDLENBQUM7YUFDckQ7WUFBQyxPQUFPLEtBQUssRUFBRTtnQkFDWixPQUFPLENBQUMsS0FBSyxDQUFDLDJCQUEyQixFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNsRCxJQUFJLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO2FBQ3JDO1NBQ0o7YUFBTTtZQUNILElBQUksTUFBTSxDQUFDLDZCQUE2QixDQUFDLENBQUM7WUFDMUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUN6QztRQUVELDRDQUE0QztRQUN4QywrQkFBK0I7UUFDL0Isb0RBQW9EO1FBQ3BELDZEQUE2RDtRQUM3RCxxQ0FBcUM7UUFDckMsV0FBVztRQUNYLHlFQUF5RTtRQUN6RSw2Q0FBNkM7UUFDN0MsSUFBSTtJQUNaLENBQUM7Q0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcCwgVEZpbGUsIE5vdGljZSwgU2V0dGluZywgUGx1Z2luU2V0dGluZ1RhYiB9IGZyb20gJ29ic2lkaWFuJztcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhcHBlbmRTZWxmRGV2ZWxvcG1lbnRUYXNrKGFwcDogQXBwLCBmaWxlOiBURmlsZSwgdGFzazogc3RyaW5nID0gJy0gWyBdIE5ldyB0YXNrJykge1xyXG4gICAgaWYgKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBcHBlbmRpbmcgdG8gZmlsZTonLCBmaWxlLnBhdGgpO1xyXG4gICAgICAgICAgICBhd2FpdCBhcHAudmF1bHQuYXBwZW5kKGZpbGUsIGAke3Rhc2t9XFxuYCk7XHJcbiAgICAgICAgICAgIG5ldyBOb3RpY2UoJ05ldyB0YXNrIGFkZGVkIHRvIFNlbGYgRGV2ZWxvcG1lbnQhJyk7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIGFwcGVuZCB0byBmaWxlOicsIGVycm9yKTtcclxuICAgICAgICAgICAgbmV3IE5vdGljZSgnRmFpbGVkIHRvIGFkZCB0YXNrLicpO1xyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbmV3IE5vdGljZSgnRXJyb3I6IEZpbGUgaXMgbm90IGEgVEZpbGUuJyk7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ0ZpbGUgdHlwZSBlcnJvcjonLCBmaWxlKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyAvLyDQn9GA0L7QstC10YDRj9C10Lwg0YLQuNC/INGE0LDQudC70LAg0Lgg0LTQvtCx0LDQstC70Y/QtdC8INC30LDQtNCw0YfRg1xyXG4gICAgICAgIC8vIGlmIChmaWxlIGluc3RhbmNlb2YgVEZpbGUpIHtcclxuICAgICAgICAvLyAgICAgY29uc29sZS5sb2coJ0FwcGVuZGluZyB0byBmaWxlOicsIGZpbGUucGF0aCk7XHJcbiAgICAgICAgLy8gICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmFwcGVuZChmaWxlLCBcIi0gWyBdIE5ldyB0YXNrXFxuXCIpO1xyXG4gICAgICAgIC8vICAgICBuZXcgTm90aWNlKCdOZXcgdGFzayBhZGRlZCEnKTtcclxuICAgICAgICAvLyB9IGVsc2Uge1xyXG4gICAgICAgIC8vICAgICBuZXcgTm90aWNlKCdFcnJvcjogRmlsZSBpcyBub3QgYSBURmlsZSBvciBjb3VsZCBub3QgYmUgY3JlYXRlZC4nKTtcclxuICAgICAgICAvLyAgICAgY29uc29sZS5sb2coJ0ZpbGUgdHlwZSBlcnJvcjonLCBmaWxlKTtcclxuICAgICAgICAvLyB9XHJcbn1cclxuIl19