import pandas as pd
import json
from datetime import datetime

# Load the Excel file
excel_file = 'IIPL - CRM (Ap25-Ma26) (3).xlsx'

# Read INQUIRY sheet with proper headers
inquiry_df = pd.read_excel(excel_file, sheet_name='INQUIRY', header=0)

# Clean column names - use the first row as headers
inquiry_df.columns = inquiry_df.iloc[0]
inquiry_df = inquiry_df[1:]  # Remove the header row from data

# Reset index
inquiry_df = inquiry_df.reset_index(drop=True)

# Convert to records and clean data
# Only process first 282 rows (rows after that are not valid records)
MAX_VALID_ROWS = 282

inquiry_records = []
row_count = 0

for _, row in inquiry_df.iterrows():
    # Stop after processing 284 valid rows
    if row_count >= MAX_VALID_ROWS:
        break
    
    # Check if the entire row is empty (all values are NaN or None)
    row_values = [v for v in row.values if pd.notna(v) and str(v).strip() != '']
    
    # Skip completely empty rows
    if len(row_values) == 0:
        continue
    
    record = {}
    for col in inquiry_df.columns:
        value = row[col]
        # Handle NaN values
        if pd.isna(value):
            record[str(col)] = None
        elif isinstance(value, (int, float)):
            record[str(col)] = value
        elif isinstance(value, datetime):
            record[str(col)] = value.strftime('%Y-%m-%d')
        else:
            record[str(col)] = str(value)
    inquiry_records.append(record)
    row_count += 1

# Save to JSON
output_data = {
    'inquiries': inquiry_records,
    'metadata': {
        'total_records': len(inquiry_records),
        'generated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'source_file': excel_file
    }
}

with open('iipl_data.json', 'w', encoding='utf-8') as f:
    json.dump(output_data, f, indent=2, ensure_ascii=False, default=str)

print(f"✓ Converted {len(inquiry_records)} inquiry records to JSON")
print(f"✓ Output saved to: iipl_data.json")
print(f"\nColumn names found:")
for i, col in enumerate(inquiry_df.columns, 1):
    print(f"  {i}. {col}")
