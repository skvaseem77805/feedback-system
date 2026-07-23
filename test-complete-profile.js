const { queryOne, query } = require('./lib/db');

(async () => {
  try {
    const registrationNo = '24B81A05Q5'; // Let's use a seeded registration number
    const department = 'CSE';
    const year = '2nd Year';
    const section = 'E';

    // 1. Get user info
    const user = await queryOne(
      'SELECT name, email, password_hash FROM students WHERE registration_no = ? LIMIT 1',
      [registrationNo]
    );
    console.log('User fetched:', user);

    let numericYear = 2;
    if (year.includes('1')) numericYear = 1;
    else if (year.includes('2')) numericYear = 2;
    else if (year.includes('3')) numericYear = 3;
    else if (year.includes('4')) numericYear = 4;

    const courseName = `B.Tech- ${department}`;

    // 3. Update the student record in students table
    console.log('Updating student...');
    await query(
      `UPDATE students 
       SET department = ?, year = ?, course = ?, section = ?, email_verified = 1 
       WHERE registration_no = ?`,
      [department, numericYear, courseName, section, registrationNo]
    );

    // Get the actual students.id
    console.log('Getting student row...');
    const studentRow = await queryOne(
      'SELECT id FROM students WHERE registration_no = ? LIMIT 1',
      [registrationNo]
    );
    console.log('Student row:', studentRow);

    // 5. Initialize user stats
    console.log('Inserting into student_stats...');
    await query(
      `INSERT IGNORE INTO student_stats (student_id, projects_uploaded, connections, collaborations)
       VALUES (?, 0, 0, 0)`,
      [studentRow.id]
    );
    console.log('SUCCESS!');
  } catch (error) {
    console.error('CRASHED:', error);
  }
})();
