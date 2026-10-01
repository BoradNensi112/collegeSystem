/**
 * Faculty Session Management Utility
 * Ensures clean isolation of Faculty data from Admin/Student sessions.
 */

export const KNOWN_FACULTY = [
  {
    user_id: 9,
    id: 9,
    first_name: "Arvind",
    last_name: "Menon",
    name: "Arvind Menon",
    user_name: "faculty",
    email: "faculty@navnext.edu",
    user_type: "faculty",
    role: "faculty",
    department: "Computer Science & Engineering",
    qualification: "M.Tech, Ph.D in Computer Science",
    experience: "12",
    mobile: "+91 98765 43210",
    phone: "+91 98765 43210",
    dob: "1985-05-15",
    gender: "Male",
    blood_group: "O+",
    address: "Faculty Quarters, NavNext University Campus",
    city: "Ahmedabad",
    state: "Gujarat",
    pincode: "380015",
    designation: "Professor & Head of Department",
    college: "NavNext University Institute of Technology",
    joining_year: "2018",
    employeeId: "FAC-0009",
    accountStatus: "Verified Active Faculty",
  },
  {
    user_id: 8,
    id: 8,
    first_name: "Sunita",
    last_name: "Sharma",
    name: "Sunita Sharma",
    user_name: "faculty1",
    email: "faculty1@college.com",
    user_type: "faculty",
    role: "faculty",
    department: "Information Technology",
    qualification: "M.E in Database Systems",
    experience: "8",
    mobile: "+91 98765 43211",
    phone: "+91 98765 43211",
    dob: "1989-08-20",
    gender: "Female",
    blood_group: "B+",
    address: "Sector 4, University Staff Residences",
    city: "Ahmedabad",
    state: "Gujarat",
    pincode: "380015",
    designation: "Associate Professor",
    college: "NavNext University Institute of Technology",
    joining_year: "2020",
    employeeId: "FAC-0008",
    accountStatus: "Verified Active Faculty",
  },
  {
    user_id: 10,
    id: 10,
    first_name: "Rajesh",
    last_name: "Khanna",
    name: "Rajesh Khanna",
    user_name: "rajesh123",
    email: "rajesh@navnext.edu",
    user_type: "faculty",
    role: "faculty",
    department: "Computer Science & Engineering",
    qualification: "M.Tech (Network Systems)",
    experience: "10",
    mobile: "+91 98765 43212",
    phone: "+91 98765 43212",
    dob: "1987-11-10",
    gender: "Male",
    blood_group: "A+",
    address: "Tower B, Campus Enclave",
    city: "Ahmedabad",
    state: "Gujarat",
    pincode: "380015",
    designation: "Assistant Professor",
    college: "NavNext University Institute of Technology",
    joining_year: "2019",
    employeeId: "FAC-0010",
    accountStatus: "Verified Active Faculty",
  }
];

export function getActiveFacultySession() {
  try {
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      const user = JSON.parse(rawUser);
      if (user && (user.user_type === "faculty" || user.role === "faculty")) {
        const uId = user.user_id || user.id || 9;
        const matched = KNOWN_FACULTY.find((f) => String(f.user_id) === String(uId)) || {};
        return {
          ...matched,
          ...user,
          user_id: uId,
          id: uId,
          first_name: user.first_name || matched.first_name || "Faculty",
          last_name: user.last_name || matched.last_name || "Member",
          name: `${user.first_name || matched.first_name || "Faculty"} ${user.last_name || matched.last_name || ""}`.trim(),
          user_name: user.user_name || user.username || matched.user_name || "faculty",
          email: user.email || matched.email || "faculty@navnext.edu",
          department: user.department || matched.department || "Computer Science & Engineering",
          qualification: user.qualification || matched.qualification || "M.Tech, Ph.D in Computer Science",
          experience: user.experience || matched.experience || "12",
          mobile: user.mobile || user.phone || matched.mobile || "+91 98765 43210",
          dob: user.dob || matched.dob || "1985-05-15",
          employeeId: `FAC-${String(uId).padStart(4, "0")}`,
          user_type: "faculty",
          role: "faculty",
        };
      }
    }

    const rawFaculty = localStorage.getItem("faculty");
    if (rawFaculty) {
      const faculty = JSON.parse(rawFaculty);
      if (faculty && (faculty.first_name || faculty.user_name)) {
        const uId = faculty.user_id || faculty.id || 9;
        const matched = KNOWN_FACULTY.find((f) => String(f.user_id) === String(uId)) || {};
        return {
          ...matched,
          ...faculty,
          user_id: uId,
          id: uId,
          first_name: faculty.first_name || matched.first_name || "Faculty",
          last_name: faculty.last_name || matched.last_name || "",
          name: `${faculty.first_name || matched.first_name || "Faculty"} ${faculty.last_name || matched.last_name || ""}`.trim(),
          user_name: faculty.user_name || matched.user_name || "faculty",
          email: faculty.email || matched.email || "faculty@navnext.edu",
          department: faculty.department || matched.department || "Computer Science & Engineering",
          qualification: faculty.qualification || matched.qualification || "M.Tech, Ph.D in Computer Science",
          experience: faculty.experience || matched.experience || "12",
          mobile: faculty.mobile || faculty.phone || matched.mobile || "+91 98765 43210",
          employeeId: `FAC-${String(uId).padStart(4, "0")}`,
          user_type: "faculty",
          role: "faculty",
        };
      }
    }
  } catch (err) {
    console.error("Error resolving faculty session:", err);
  }

  // Default fallback to first known real faculty
  const def = KNOWN_FACULTY[0];
  return { ...def };
}

export function setActiveFacultySession(facultyObj) {
  try {
    if (!facultyObj) return;
    const existing = getActiveFacultySession();
    const merged = { ...existing, ...facultyObj };
    localStorage.setItem("faculty", JSON.stringify(merged));
    localStorage.setItem("faculty_id", String(merged.user_id || merged.id || 9));

    // If current logged in user is actually a faculty, sync user too
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (u.user_type === "faculty" || u.role === "faculty") {
        localStorage.setItem("user", JSON.stringify({ ...u, ...merged }));
      }
    }
  } catch (e) {
    console.error("Error setting faculty session:", e);
  }
}
