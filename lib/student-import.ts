export interface StudentImportPreviewRow {
  rowNumber: number;
  rollNumber: string;
  name: string;
  year: number | null;
  yearLabel: string;
  branch: string;
  email: string;
  phone: string;
  status: 'new' | 'update' | 'invalid';
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

export function buildStudentImportPreviewRows(
  rows: Record<string, unknown>[],
  existingRollNumbers: Set<string>
): StudentImportPreviewRow[] {
  const seenRollNumbers = new Set<string>();
  return rows.map((row, index) => {
    const rollNumber = normalizeRollNumber(
      row.rollNumber ?? row.roll_no ?? row.roll ?? row.registrationNo ?? row.registration_no ?? row.studentId ?? row.id ?? ''
    );
    const name = normalizeText(
      row.studentName ?? row.name ?? row.fullName ?? row.student_name ?? row.full_name ?? ''
    );
    const yearInfo = normalizeYear(
      row.year ?? row.academicYear ?? row.yearOfStudy ?? row.studyYear ?? ''
    );
    const branch = normalizeBranch(
      row.branch ?? row.department ?? row.course ?? row.branchName ?? ''
    );
    const email = normalizeEmail(
      row.email ?? row.emailId ?? row.studentEmail ?? ''
    );
    const phone = normalizePhone(
      row.phone ?? row.phoneNumber ?? row.mobile ?? row.mobileNo ?? row.contactNumber ?? ''
    );

    const errors: string[] = [];
    if (!rollNumber) errors.push('Roll number is required');
    if (!name) errors.push('Student name is required');
    if (!yearInfo.year) errors.push('Valid year is required');
    if (!branch) errors.push('Branch is required');
    if (!email) errors.push('Email is required');
    if (!phone) errors.push('Phone is required');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Email format is invalid');
    if (phone && !/^\+?[0-9\-\s]{7,15}$/.test(phone)) errors.push('Phone format is invalid');

    if (rollNumber && seenRollNumbers.has(rollNumber)) {
      errors.push('Duplicate roll number in uploaded file');
    } else if (rollNumber) {
      seenRollNumbers.add(rollNumber);
    }

    if (rollNumber && existingRollNumbers.has(rollNumber)) {
      errors.push('Existing student record will be updated');
    }

    return {
      rowNumber: index + 2,
      rollNumber,
      name,
      year: yearInfo.year,
      yearLabel: yearInfo.yearLabel,
      branch,
      email,
      phone,
      status: errors.length > 0 ? 'invalid' : existingRollNumbers.has(rollNumber) ? 'update' : 'new',
      existing: existingRollNumbers.has(rollNumber),
      errors,
      valid: errors.length === 0,
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
