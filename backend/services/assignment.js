const Assignment = require("../models/assignment");
const AssignmentSubmit = require("../models/assignmentSubmit");
const User = require("../models/user");

const BASE_URL = "http://localhost:5001";

const formatAssignment = (a) => {
  if (!a) return null;

  const raw = a.toJSON();

  let fileUrl = "";
  if (raw.file_url) {
    if (String(raw.file_url).startsWith("http")) {
      fileUrl = raw.file_url;
    } else {
      fileUrl = `${BASE_URL}${raw.file_url.startsWith("/") ? "" : "/"}${raw.file_url}`;
    }
  }

  return {
    assignment_id: raw.assignment_id,
    subject: raw.subject,
    class_name: raw.class_name,
    sem: raw.sem,
    title: raw.title,
    description: raw.description,
    file_url: fileUrl,
    file_name: raw.file_name,
    due_date: raw.due_date,
    total_marks: raw.total_marks,
    status: raw.status,
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || null,
  };
};

// submitted assignment 
const formatSubmission = (s) => {
  if (!s) return null;

  const raw = typeof s.toJSON === "function" ? s.toJSON() : s;

  let fileUrl = "";
  if (raw.file_url) {
    if (String(raw.file_url).startsWith("http")) {
      fileUrl = raw.file_url;
    } else {
      fileUrl = `${BASE_URL}${raw.file_url.startsWith("/") ? "" : "/"}${raw.file_url}`;
    }
  }

  return {
    submit_id: raw.submit_id,
    assignment_id: raw.assignment_id,
    student_id: raw.student_id,
    student_name: raw.student_name || null,
    enrollment: raw.enrollment || null,
    email: raw.email || null,
    message: raw.message,
    link: raw.link,
    file_url: fileUrl,
    file_name: raw.file_name,
    status: raw.status || "SUBMITTED",
    createdAt: raw.createdAt || raw.created_at || null,
    grade: raw.grade || null,
    marks_obtained: raw.marks_obtained || null,
  };
};

//  INSERT ASSIGNMENT 
exports.assignmentInsert = async (data) => {
  try {
    const db_status = await Assignment.create({
      subject: data.subject,
      class_name: data.class_name,
      sem: data.sem,
      title: data.title,
      description: data.description,
      file_url: data.file_url,
      file_name: data.file_name,
      due_date: data.due_date,
      total_marks: data.total_marks,
      status: data.status || "ACTIVE",
    });

    return formatAssignment(db_status);
  } catch (err) {
    throw new Error(err.message);
  }
};

//  VIEW ALL ASSIGNMENTS 
exports.viewAssignData = async () => {
  try {
    const data = await Assignment.findAll({
      order: [["assignment_id", "DESC"]],
    });

    return data.map(formatAssignment);
  } catch (err) {
    throw new Error(err.message);
  }
};

//  VIEW ONE ASSIGNMENT 
exports.viewAssignOneData = async (id) => {
  try {
    const data = await Assignment.findOne({
      where: { assignment_id: id },
    });

    return formatAssignment(data);
  } catch (err) {
    throw new Error(err.message);
  }
};

//  DELETE ASSIGNMENT 
exports.deleteData = async (id) => {
  try {
    const data = await Assignment.destroy({
      where: { assignment_id: id },
    });

    return {
      success: true,
      deleted: data,
    };
  } catch (err) {
    throw new Error(err.message);
  }
};

//  UPDATE ASSIGNMENT 
exports.update = async (data) => {
  try {
    await Assignment.update(
      {
        subject: data.subject,
        class_name: data.class_name,
        sem: data.sem,
        title: data.title,
        description: data.description,
        file_url: data.file_url,
        file_name: data.file_name,
        due_date: data.due_date,
        total_marks: data.total_marks,
        status: data.status,
      },
      {
        where: { assignment_id: data.assignment_id },
      }
    );

    const updated = await Assignment.findOne({
      where: { assignment_id: data.assignment_id },
    });

    return formatAssignment(updated);
  } catch (err) {
    throw new Error(err.message);
  }
};

//  TOTAL COUNT 
exports.totalAssignments = async () => {
  try {
    const total = await Assignment.count();
    return { total };
  } catch (err) {
    throw new Error(err.message);
  }
};

//  SUBMIT ASSIGNMENT 
exports.submitAssignment = async (data) => {
  try {
    const result = await AssignmentSubmit.create({
      assignment_id: Number(data.assignment_id),
      student_id: Number(data.student_id),
      message: data.message || null,
      link: data.link || null,
      file_url: data.file_url || null,
      file_name: data.file_name || null,
      status: data.status || "SUBMITTED",
    });

    return formatSubmission(result);
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    throw error;
  }
};

//  VIEW ALL SUBMISSIONS 
exports.viewSubmittedAssignments = async () => {
  try {
    const data = await AssignmentSubmit.findAll({
      attributes: [
        "submit_id",
        "assignment_id",
        "student_id",
        "message",
        "link",
        "file_url",
        "file_name",
        "status",
      ],
      order: [["assignment_id", "DESC"]],
      raw: true,
    });

    return data.map(formatSubmission);
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    throw error;
  }
};

//  VIEW SUBMISSIONS BY STUDENT 
exports.viewSubmittedAssignmentsByStudent = async (student_id) => {
  try {
    const data = await AssignmentSubmit.findAll({
      where: { student_id: Number(student_id) },
      attributes: [
        "submit_id",
        "assignment_id",
        "student_id",
        "message",
        "link",
        "file_url",
        "file_name",
        "status",
      ],
      order: [["assignment_id", "DESC"]],
      raw: true,
    });

    return data.map(formatSubmission);
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    throw error;
  }
};

//  VIEW SUBMISSIONS BY ASSIGNMENT 
exports.viewSubmittedAssignmentsByAssignment = async (assignment_id) => {
  try {
    const data = await AssignmentSubmit.findAll({
      where: { assignment_id: Number(assignment_id) },
      order: [["submit_id", "DESC"]],
      raw: true,
    });

    // Map student names
    const studentIds = Array.from(new Set(data.map((d) => Number(d.student_id)).filter(Boolean)));
    const studentsMap = new Map();

    if (studentIds.length > 0) {
      const users = await User.findAll({
        where: { user_id: studentIds },
        attributes: ["user_id", "first_name", "last_name", "enrollment", "email", "course", "sem"],
        raw: true,
      });

      users.forEach((u) => {
        studentsMap.set(u.user_id, {
          name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || `Student #${u.user_id}`,
          enrollment: u.enrollment || `EN-${u.user_id}`,
          email: u.email || "",
          course: u.course || "",
          sem: u.sem || "",
        });
      });
    }

    const enriched = data.map((item) => {
      const stu = studentsMap.get(Number(item.student_id)) || {};
      return {
        ...item,
        student_name: stu.name || `Student #${item.student_id}`,
        enrollment: stu.enrollment || `EN-${item.student_id}`,
        email: stu.email || "",
        course: stu.course || "",
        sem: stu.sem || "",
      };
    });

    return enriched.map(formatSubmission);
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    throw error;
  }
};