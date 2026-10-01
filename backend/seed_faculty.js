const bcrypt = require('bcryptjs');
const User = require('./models/user');

async function seedFaculty() {
  try {
    const defaultPasswordHash = await bcrypt.hash('faculty@123', 10);

    const facultyMembers = [
      {
        first_name: 'Arvind',
        last_name: 'Menon',
        user_name: 'faculty',
        email: 'faculty@navnext.edu',
        password: defaultPasswordHash,
        user_type: 'faculty',
        department: 'Computer Science & Engineering',
        qualification: 'M.Tech, Ph.D in Computer Science',
        experience: '12',
        mobile: '9876543210',
        dob: '1985-05-15',
      },
      {
        first_name: 'Sunita',
        last_name: 'Rao',
        user_name: 'faculty1',
        email: 'faculty1@navnext.edu',
        password: defaultPasswordHash,
        user_type: 'faculty',
        department: 'Information Technology',
        qualification: 'M.E in Database Systems',
        experience: '8',
        mobile: '9876543211',
        dob: '1989-08-20',
      },
      {
        first_name: 'Rajesh',
        last_name: 'Khanna',
        user_name: 'rajesh123',
        email: 'rajesh@navnext.edu',
        password: defaultPasswordHash,
        user_type: 'faculty',
        department: 'Computer Science & Engineering',
        qualification: 'M.Tech (Network Systems)',
        experience: '10',
        mobile: '9876543212',
        dob: '1987-11-10',
      }
    ];

    for (const f of facultyMembers) {
      const existing = await User.findOne({
        where: { user_name: f.user_name }
      });

      if (existing) {
        await existing.update({
          password: defaultPasswordHash,
          user_type: 'faculty',
          department: f.department,
          qualification: f.qualification,
          experience: f.experience,
        });
        console.log(`Updated faculty: ${f.user_name} / faculty@123`);
      } else {
        await User.create(f);
        console.log(`Created faculty: ${f.user_name} / faculty@123`);
      }
    }

    console.log('All faculty accounts ready!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding faculty:', err);
    process.exit(1);
  }
}

seedFaculty();
