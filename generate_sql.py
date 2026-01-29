
import csv
import json

def escape_sql(val):
    if not val:
        return 'NULL'
    return "'" + val.replace("'", "''").strip() + "'"

def process_csv():
    input_file = '/Users/ratnaprakashbabup/Downloads/2nd_year_cse_section E students.csv'
    output_file = '/Users/ratnaprakashbabup/Desktop/hanish /feedback-system/import_students.sql'

    print(f"Reading {input_file}...")
    
    values_list = []
    
    try:
        with open(input_file, 'r', encoding='utf-8-sig') as f: # Use utf-8-sig to handle BOM
            reader = csv.DictReader(f)
            print(f"Headers: {reader.fieldnames}")
            for row in reader:
                # print(f"Row keys: {list(row.keys())}") # Debug first row
                
                # Try to find key loosely
                uid = row.get('userId') or row.get('ï»¿userId') # Handle BOM if utf-8-sig doesn't catch it logic
                if not uid:
                     # Check all keys
                     for k in row.keys():
                         if k and 'userId' in k:
                             uid = row[k]
                             break
                
                if not uid: continue
                
                name = row.get('name', '').strip()
                reg_no = row.get('reg_no', '').strip()
                unique_id = row.get('uniqueId', '').strip()
                year = row.get('year', '2').strip()
                course = row.get('course', '').strip()
                email = row.get('email', '').strip().lower()
                mobile = row.get('mobile_no', '').strip()
                dept = row.get('dept_code', 'CSE').strip()
                section = row.get('section', 'E').strip()
                
                # Validation / Cleanup
                if not year.isdigit(): year = '2'
                
                # Password hash is NULL (we use userId login bypass)
                
                val = f"({escape_sql(uid)}, {escape_sql(name)}, {escape_sql(reg_no)}, {escape_sql(unique_id)}, {year}, {escape_sql(course)}, {escape_sql(email)}, {escape_sql(mobile)}, {escape_sql(dept)}, {escape_sql(section)})"
                values_list.append(val)
                
    except Exception as e:
        print(f"Error: {e}")
        return

    if not values_list:
        print("No data found.")
        return

    # Write SQL
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("-- Bulk Import Students from CSV\n")
        f.write("INSERT INTO public.students (id, name, registration_no, unique_id, year, course, email, mobile_no, department, section) VALUES\n")
        f.write(",\n".join(values_list))
        f.write("\nON CONFLICT (id) DO UPDATE SET\n")
        f.write("  name = EXCLUDED.name,\n")
        f.write("  email = EXCLUDED.email,\n")
        f.write("  mobile_no = EXCLUDED.mobile_no,\n")
        f.write("  section = EXCLUDED.section;\n\n")
        
        f.write("-- Initialize Stats\n")
        f.write("INSERT INTO public.student_stats (student_id, projects_uploaded, connections, collaborations)\n")
        f.write("SELECT id, 0, 0, 0 FROM public.students\n")
        f.write("ON CONFLICT (student_id) DO NOTHING;\n")
        
    print(f"Generated {output_file} with {len(values_list)} records.")

if __name__ == '__main__':
    process_csv()
