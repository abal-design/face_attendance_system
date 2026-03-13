# Student Import Guide

## How to Import Students for Attendance

### Supported File Formats
- CSV (.csv)
- Excel (.xlsx, .xls)
- Text files (.txt)

### File Format Requirements

The file should have **two columns** in the following order:
1. **Roll No** - Student's roll number or ID
2. **Name** - Student's full name

### CSV Format Example

```csv
Roll No,Name
001,John Doe
002,Jane Smith
003,Mike Johnson
004,Sarah Williams
005,Tom Brown
```

### Important Notes

1. **Header Row Required**: First row should contain column headers (Roll No, Name)
2. **Comma Separated**: Values should be separated by commas
3. **No Empty Rows**: Remove any empty rows from the file
4. **Unique Roll Numbers**: Duplicate roll numbers will be skipped

### Steps to Import

1. Click the **"Import"** button in the Students section
2. Select your CSV or Excel file
3. Review the imported students in the preview modal
4. Click **"Add Students"** to add them to the attendance list
5. Students will be added with "pending" status

### Download Sample File

Click the **"Download Sample CSV"** button in the import modal to get a template file.

### Troubleshooting

**Issue**: "No valid student data found in file"
- Check if your file has the correct format (Roll No, Name)
- Ensure there's data after the header row

**Issue**: "Please upload a CSV, Excel, or TXT file"
- Only files with extensions .csv, .xlsx, .xls, or .txt are supported

**Issue**: Students not appearing
- Check if the roll numbers already exist in the current list
- Duplicate roll numbers are automatically skipped
