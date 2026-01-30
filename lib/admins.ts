export interface AdminRecord {
  email: string;
  password: string;
  id?: string;
}

const DEFAULT_ADMINS: AdminRecord[] = [
  { email: 'sudhakarmatta53@gmail.com', password: 'sanchari@123', id: 'admin-1' },
  { email: 'rajeshraj76010@gmail.com', password: 'sanchari@123', id: 'admin-2' },
  { email: 'skvaseem68@gmail.com', password: 'sanchari@123', id: 'admin-3' },
  { email: 'rajpolimetla5462@gmail.com', password: 'sanchari@123', id: 'admin-4' },
];

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function seedAdminsIfMissing() {
  if (!isBrowser()) return;
  try {
    if (!localStorage.getItem('admins')) {
      localStorage.setItem('admins', JSON.stringify(DEFAULT_ADMINS));
    }
  } catch (err) {
    // ignore localStorage errors
    console.warn('Could not seed admins:', err);
  }
}

export function getAdmins(): AdminRecord[] {
  if (!isBrowser()) return DEFAULT_ADMINS;
  seedAdminsIfMissing();
  try {
    const raw = localStorage.getItem('admins');
    if (!raw) return DEFAULT_ADMINS;
    return JSON.parse(raw) as AdminRecord[];
  } catch (err) {
    return DEFAULT_ADMINS;
  }
}

export function validateAdmin(email: string, password: string): { valid: boolean; admin?: AdminRecord; reason?: string } {
  if (!isBrowser()) return { valid: false, reason: 'not_browser' };
  const admins = getAdmins();
  const found = admins.find(a => a.email.toLowerCase() === email.toLowerCase());
  if (!found) return { valid: false, reason: 'not_found' };
  if (found.password !== password) return { valid: false, reason: 'invalid_password' };
  return { valid: true, admin: found };
}
