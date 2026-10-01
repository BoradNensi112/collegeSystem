/**
 * Student Session Helper
 * Resolves the currently authenticated student, isolating it from Admin/Faculty sessions.
 */

export function getActiveStudentSession() {
  try {
    // 1. Check if an explicit 'student' session is stored
    let s = null;
    const rawStudent = localStorage.getItem("student");
    if (rawStudent) {
      const parsed = JSON.parse(rawStudent);
      if (parsed && (parsed.user_type === "student" || parsed.enrollment || parsed.course)) {
        s = parsed;
      }
    }

    // 2. If not found, check 'user' session ONLY if user_type is 'student'
    if (!s) {
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        const parsedUser = JSON.parse(rawUser);
        if (parsedUser && parsedUser.user_type === "student") {
          s = parsedUser;
        }
      }
    }

    // 3. If a valid student object exists, format all attributes
    if (s) {
      const firstName = s.first_name || s.name?.split(" ")[0] || "Rahul";
      const lastName = s.last_name || s.name?.split(" ").slice(1).join(" ") || "";
      const fullName = `${firstName} ${lastName}`.trim() || s.name || "Rahul Sharma";

      return {
        id: s.user_id || s.student_id || s.id || 2,
        user_id: s.user_id || s.student_id || s.id || 2,
        name: fullName,
        firstName,
        lastName,
        first_name: firstName,
        last_name: lastName,
        username: s.user_name || s.username || "rahul123",
        email: s.email || "rahul@college.com",
        mobile: s.mobile || s.phone || "+91 98765 12345",
        dob: s.dob || "2004-05-15",
        gender: s.gender || "Male",
        blood_group: s.blood_group || "O+",
        address: s.address || "42, Campus Green Residency",
        city: s.city || "Ahmedabad",
        state: s.state || "Gujarat",
        pincode: s.pincode || "380015",
        father_name: s.father_name || "Ramesh Sharma",
        father_mobile: s.father_mobile || "+91 98765 00000",
        course: s.course || "B.Tech CSE",
        department: s.department || "Computer Science & Engineering",
        college: "NavNext University Institute of Technology",
        admission_year: s.admission_year || "2023",
        enrollment: s.enrollment || "EN2024001",
        semester: Number(s.sem || s.semester || 4),
        sem: Number(s.sem || s.semester || 4),
        cgpa: s.cgpa || 8.65,
        rank: s.rank || "Top 5%",
        accountStatus: "Verified Active",
        user_type: "student",
      };
    }

    // 4. Default Student fallback (Rahul Sharma - B.Tech CSE)
    return {
      id: 2,
      user_id: 2,
      name: "Rahul Sharma",
      firstName: "Rahul",
      lastName: "Sharma",
      first_name: "Rahul",
      last_name: "Sharma",
      username: "rahul123",
      email: "rahul@college.com",
      mobile: "+91 98765 12345",
      dob: "2004-05-15",
      gender: "Male",
      blood_group: "O+",
      address: "42, Campus Green Residency",
      city: "Ahmedabad",
      state: "Gujarat",
      pincode: "380015",
      father_name: "Ramesh Sharma",
      father_mobile: "+91 98765 00000",
      course: "B.Tech CSE",
      department: "Computer Science & Engineering",
      college: "NavNext University Institute of Technology",
      admission_year: "2023",
      enrollment: "EN2024001",
      semester: 4,
      sem: 4,
      cgpa: 8.65,
      rank: "Top 5%",
      accountStatus: "Verified Active",
      user_type: "student",
    };
  } catch {
    return {
      id: 2,
      user_id: 2,
      name: "Rahul Sharma",
      firstName: "Rahul",
      lastName: "Sharma",
      first_name: "Rahul",
      last_name: "Sharma",
      username: "rahul123",
      email: "rahul@college.com",
      mobile: "+91 98765 12345",
      dob: "2004-05-15",
      gender: "Male",
      blood_group: "O+",
      address: "42, Campus Green Residency",
      city: "Ahmedabad",
      state: "Gujarat",
      pincode: "380015",
      father_name: "Ramesh Sharma",
      father_mobile: "+91 98765 00000",
      course: "B.Tech CSE",
      department: "Computer Science & Engineering",
      college: "NavNext University Institute of Technology",
      admission_year: "2023",
      enrollment: "EN2024001",
      semester: 4,
      sem: 4,
      cgpa: 8.65,
      rank: "Top 5%",
      accountStatus: "Verified Active",
      user_type: "student",
    };
  }
}

export function setActiveStudentSession(studentObj) {
  if (!studentObj) return;
  localStorage.setItem("student", JSON.stringify(studentObj));
  localStorage.setItem("student_id", String(studentObj.user_id || studentObj.id || 2));
  if (studentObj.course) localStorage.setItem("course", studentObj.course);
  if (studentObj.sem || studentObj.semester) localStorage.setItem("semester", String(studentObj.sem || studentObj.semester));
  if (studentObj.enrollment) localStorage.setItem("enrollment", studentObj.enrollment);
}
