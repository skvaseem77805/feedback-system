import { validateRegistrationNo } from './validation';

export interface StudentImportPreviewRow {
  rowNumber: number;
  rollNumber: string;
  name: string;
  year: number | null;
  yearLabel: string;
  branch: string;
  email: string;
  phone: string;
  status: 'new' | 'update' | 'updated' | 'UPDATED' | 'invalid';
  existing: boolean;
  errors: string[];
  valid: boolean;
}

function normalizeText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
  return '';
}

function normalizeRollNumber(value: unknown): string {
  const v = normalizeText(value).toUpperCase();
  return v.replace(/[^A-Z0-9._-]/g, '');
}

function normalizeYear(value: unknown): { year: number | null; yearLabel: string } {
  const raw = normalizeText(value).toLowerCase();
  if (!raw) return { year: null, yearLabel: '' };
  const normalized = raw.replace(/\s+/g, '');
  const mapping: Record<string, number> = {
    '1': 1,
    '1st': 1,
    'first': 1,
    '2': 2,
    '2nd': 2,
    'second': 2,
    '3': 3,
    '3rd': 3,
    'third': 3,
    '4': 4,
    '4th': 4,
    'final': 4,
    'finalyear': 4,
  };
  if (mapping[normalized] !== undefined) {
    const year = mapping[normalized];
    return {
      year,
      yearLabel: year === 4 ? 'Final' : `${year}st`.
        replace('1st', '1st')
        .replace('2st', '2nd')
        .replace('3st', '3rd')
        .replace('4st', '4th'),
    };
  }
  const numeric = Number.parseInt(raw, 10);
  if (Number.isFinite(numeric) && numeric >= 1 && numeric <= 4) {
    return {
      year: numeric,
      yearLabel: numeric === 4 ? 'Final' : `${numeric}${numeric === 1 ? 'st' : numeric === 2 ? 'nd' : numeric === 3 ? 'rd' : 'th'}`,
    };
  }
  return { year: null, yearLabel: '' };
}

function normalizeBranch(value: unknown): string {
  return normalizeText(value).replace(/\s+/g, ' ').trim();
}

function normalizeEmail(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function normalizePhone(value: unknown): string {
  return normalizeText(value);
}

export function normalizeRowKeys(row: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Roll Number (Explicitly exclude uniqueId and userId)
    if ([
      'regno', 'rollno', 'rollnumber', 'registrationno', 'registrationnumber', 
      'studentid', 'id', 'regdno', 'registration', 'roll'
    ].includes(cleanKey) && cleanKey !== 'uniqueid' && cleanKey !== 'userid') {
      normalized.rollNumber = value;
    }
    // Name
    else if (['studentname', 'name', 'fullname'].includes(cleanKey)) {
      normalized.name = value;
    }
    // Department
    else if (['deptcode', 'department', 'dept', 'branch', 'course'].includes(cleanKey)) {
      normalized.branch = value;
    }
    // Year
    else if (['year', 'academicyear', 'studyyear', 'yearofstudy'].includes(cleanKey)) {
      normalized.year = value;
    }
    // Email
    else if (['email', 'emailaddress', 'mail'].includes(cleanKey)) {
      normalized.email = value;
    }
    // Phone / Mobile (Keep but ignore for validation)
    else if (['phone', 'phonenumber', 'mobile', 'mobileno', 'contactnumber'].includes(cleanKey)) {
      normalized.phone = value;
    }
    
    // Preserve original key
    normalized[key] = value;
  }
  return normalized;
}

export function buildStudentImportPreviewRows(
  rows: Record<string, unknown>[],
  existingRollNumbers: Set<string>
): StudentImportPreviewRow[] {
  const seenRollNumbers = new Set<string>();
  return rows.map((row, index) => {
    // 1. Normalize the row keys
    const normalizedRow = normalizeRowKeys(row);

    // 2. Convert parsed row into normalized student object
    const student = {
      rollNumber: normalizeRollNumber(normalizedRow.rollNumber ?? ''),
      name: normalizeText(normalizedRow.name ?? ''),
      department: normalizeBranch(normalizedRow.branch ?? ''),
      yearInfo: normalizeYear(normalizedRow.year ?? ''),
      email: normalizeEmail(normalizedRow.email ?? '')
    };

    const phone = normalizePhone(normalizedRow.phone ?? '');

    const department = student.department;
    const year = student.yearInfo.year;
    console.log({
      rawRow: row,
      rollNumber: student.rollNumber,
      name: student.name,
      department,
      year,
      email: student.email
    });

    // 3. Run validation ONLY on this normalized object
    const errors: string[] = [];
    const isExisting = student.rollNumber && existingRollNumbers.has(student.rollNumber);

    if (!student.rollNumber) {
      errors.push('Roll number is required');
    } else {
      const validation = validateRegistrationNo(student.rollNumber);
      if (!validation.isValid) {
        errors.push(validation.error || 'Invalid Registration Number format');
      }
    }
    if (!student.name) errors.push('Student name is required');
    if (!student.yearInfo.year) errors.push('Valid year is required');
    if (!student.department) errors.push('Branch is required');
    
    // Validate email format ONLY when a non-empty, non-whitespace email value exists
    const emailVal = student.email ? student.email.trim() : '';
    if (emailVal && emailVal !== 'null' && emailVal !== 'undefined') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
        errors.push('Email format is invalid');
      }
    }

    if (student.rollNumber && seenRollNumbers.has(student.rollNumber)) {
      errors.push('Duplicate roll number in uploaded file');
    } else if (student.rollNumber) {
      seenRollNumbers.add(student.rollNumber);
    }

    // Determine if row is valid:
    // It is valid if there are no critical validation errors
    const isValid = errors.length === 0;

    // If it's valid, but already exists in the database, we add the info message
    if (isValid && isExisting) {
      errors.push('Existing student record will be updated.');
    }

    // Determine status
    let status: 'new' | 'update' | 'updated' | 'UPDATED' | 'invalid' = 'new';
    if (!isValid) {
      status = 'invalid';
    } else if (isExisting) {
      status = 'UPDATED';
    }

    // 4. Return formatted StudentImportPreviewRow
    return {
      rowNumber: index + 2,
      rollNumber: student.rollNumber,
      name: student.name,
      year: student.yearInfo.year,
      yearLabel: student.yearInfo.yearLabel,
      branch: student.department,
      email: student.email,
      phone: phone,
      status: status,
      existing: !!isExisting,
      errors,
      valid: isValid,
    };
  });
}

export function extractRowsFromPdfText(text: string): Record<string, unknown>[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const headers = lines.find((line) => /roll|name|year|branch|email|phone/i.test(line));
  if (!headers) {
    return [];
  }

  const normalizedHeaders = headers
    .split(/\s{2,}|\t|\|/)
    .filter(Boolean)
    .map((header) => header.toLowerCase());

  if (normalizedHeaders.length < 3) {
    return [];
  }

  return lines
    .filter((line) => line !== headers)
    .map((line) => {
      const values = line.split(/\s{2,}|\t|\|/).filter(Boolean);
      const record: Record<string, unknown> = {};
      normalizedHeaders.forEach((header, index) => {
        record[header] = values[index] ?? '';
      });
      return record;
    })
    .filter((row) => Object.values(row).some(Boolean));
}

export function toYearLabel(year: number | null): string {
  if (!year) return '';
  if (year === 1) return '1st';
  if (year === 2) return '2nd';
  if (year === 3) return '3rd';
  return 'Final';
}
