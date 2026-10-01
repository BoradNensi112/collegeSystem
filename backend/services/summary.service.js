const sequelize = require("../config/database");
const { QueryTypes } = require("sequelize");

class SummaryService {
  async getStudentSummary({ student_id, from_date, to_date, report_type }) {
    const studentInfo = await this.getStudentInfo(student_id);

    if (!studentInfo) {
      throw new Error("Student not found");
    }

    const attendanceSummary = await this.getAttendanceSummary(
      student_id,
      from_date,
      to_date
    );

    const feesSummary = await this.getFeesSummary(
      student_id,
      from_date,
      to_date
    );

    const assignmentSummary = await this.getAssignmentSummary(
      student_id,
      studentInfo.course,
      studentInfo.sem,
      from_date,
      to_date
    );

    const resultSummary = await this.getResultSummary(
      student_id,
      from_date,
      to_date
    );

    const finalRemark = this.getFinalRemark({
      attendancePercentage: attendanceSummary.attendance_percentage,
      feesStatus: feesSummary.status,
      assignmentPercentage: assignmentSummary.submission_percentage,
      resultPercentage: resultSummary.percentage,
    });

    return {
      report_type: report_type || "custom",
      from_date,
      to_date,
      student: studentInfo,
      attendance: attendanceSummary,
      fees: feesSummary,
      assignments: assignmentSummary,
      result: resultSummary,
      final_remark: finalRemark,
      generated_at: new Date(),
    };
  }

  sanitizeNumber(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === "number" && !Number.isNaN(value)) return value;

    const str = String(value).trim();

    if (!str || str === "-" || str.toLowerCase() === "null" || str.toLowerCase() === "undefined") {
      return null;
    }

    const num = Number(str);
    return Number.isNaN(num) ? null : num;
  }

  sanitizeText(value, fallback = "") {
    if (value === null || value === undefined) return fallback;

    const str = String(value).trim();
    if (!str || str === "-") return fallback;

    return str;
  }

  async getStudentInfo(student_id) {
    const query = `
      SELECT 
        user_id,
        first_name,
        last_name,
        user_name,
        email,
        enrollment,
        course,
        sem
      FROM "user-master"
      WHERE user_id = :student_id
      LIMIT 1
    `;

    const result = await sequelize.query(query, {
      replacements: { student_id: Number(student_id) },
      type: QueryTypes.SELECT,
    });

    if (!result.length) return null;

    const row = result[0];
    const safeSem = this.sanitizeNumber(row.sem);

    return {
      student_id: row.user_id,
      name:
        `${row.first_name || ""} ${row.last_name || ""}`.trim() ||
        row.user_name ||
        "-",
      user_name: row.user_name || "-",
      email: row.email || "-",
      enrollment: row.enrollment || "-",
      course: this.sanitizeText(row.course, "-"),
      sem: safeSem,
    };
  }

  async getAttendanceSummary(student_id, from_date, to_date) {
    const query = `
      SELECT
        COUNT(*)::int AS total_classes,
        COUNT(CASE WHEN status = 1 THEN 1 END)::int AS present,
        COUNT(CASE WHEN status = 2 THEN 1 END)::int AS absent,
        COUNT(CASE WHEN status = 3 THEN 1 END)::int AS late,
        COUNT(CASE WHEN status = 4 THEN 1 END)::int AS leave
      FROM "attendence-master"
      WHERE student_id = :student_id
        AND attendance_date BETWEEN :from_date AND :to_date
    `;

    const result = await sequelize.query(query, {
      replacements: {
        student_id: Number(student_id),
        from_date,
        to_date,
      },
      type: QueryTypes.SELECT,
    });

    const row = result[0] || {};

    const totalClasses = Number(row.total_classes || 0);
    const present = Number(row.present || 0);
    const absent = Number(row.absent || 0);
    const late = Number(row.late || 0);
    const leave = Number(row.leave || 0);

    const attendancePercentage =
      totalClasses > 0 ? Number(((present / totalClasses) * 100).toFixed(2)) : 0;

    return {
      total_classes: totalClasses,
      present,
      absent,
      late,
      leave,
      attendance_percentage: attendancePercentage,
    };
  }

  async getFeesSummary(student_id, from_date, to_date) {
    const query = `
      SELECT
        COALESCE(SUM(total_amount), 0)::float AS total_fees,
        COALESCE(SUM(paid_amount), 0)::float AS paid_amount
      FROM "fees-master"
      WHERE student_id::text = :student_id
        AND due_date BETWEEN :from_date AND :to_date
    `;

    const result = await sequelize.query(query, {
      replacements: {
        student_id: String(student_id),
        from_date,
        to_date,
      },
      type: QueryTypes.SELECT,
    });

    const row = result[0] || {};

    const totalFees = Number(row.total_fees || 0);
    const paidAmount = Number(row.paid_amount || 0);
    const dueAmount = Math.max(totalFees - paidAmount, 0);

    let status = "NO_RECORD";
    if (totalFees > 0 && paidAmount >= totalFees) {
      status = "PAID";
    } else if (paidAmount > 0 && paidAmount < totalFees) {
      status = "PARTIAL";
    } else if (totalFees > 0 && paidAmount === 0) {
      status = "DUE";
    }

    return {
      total_fees: totalFees,
      paid_amount: paidAmount,
      due_amount: dueAmount,
      status,
    };
  }

  async getAssignmentSummary(student_id, course, sem, from_date, to_date) {
    const safeCourse = this.sanitizeText(course, "");
    const safeSem = this.sanitizeNumber(sem);

    let totalAssignments = 0;

    if (safeSem === null) {
      const totalQueryWithoutSem = `
        SELECT COUNT(*)::int AS total_assignments
        FROM assignment_master
        WHERE
          (class_name = :course OR class_name IS NULL OR class_name = '')
          AND due_date BETWEEN :from_date AND :to_date
      `;

      const totalResult = await sequelize.query(totalQueryWithoutSem, {
        replacements: {
          course: safeCourse,
          from_date,
          to_date,
        },
        type: QueryTypes.SELECT,
      });

      totalAssignments = Number(totalResult[0]?.total_assignments || 0);
    } else {
      const totalQueryWithSem = `
        SELECT COUNT(*)::int AS total_assignments
        FROM assignment_master
        WHERE
          (class_name = :course OR class_name IS NULL OR class_name = '')
          AND (sem = :sem OR sem IS NULL)
          AND due_date BETWEEN :from_date AND :to_date
      `;

      const totalResult = await sequelize.query(totalQueryWithSem, {
        replacements: {
          course: safeCourse,
          sem: safeSem,
          from_date,
          to_date,
        },
        type: QueryTypes.SELECT,
      });

      totalAssignments = Number(totalResult[0]?.total_assignments || 0);
    }

    let submitted = 0;

    try {
      const submittedQuery = `
        SELECT COUNT(DISTINCT assignment_id)::int AS submitted
        FROM assignment_submit
        WHERE student_id::text = :student_id
          AND DATE(created_at) BETWEEN :from_date AND :to_date
      `;

      const submittedResult = await sequelize.query(submittedQuery, {
        replacements: {
          student_id: String(student_id),
          from_date,
          to_date,
        },
        type: QueryTypes.SELECT,
      });

      submitted = Number(submittedResult[0]?.submitted || 0);
    } catch (error) {
      const fallbackQuery = `
        SELECT COUNT(DISTINCT assignment_id)::int AS submitted
        FROM assignment_submit
        WHERE student_id::text = :student_id
      `;

      const fallbackResult = await sequelize.query(fallbackQuery, {
        replacements: {
          student_id: String(student_id),
        },
        type: QueryTypes.SELECT,
      });

      submitted = Number(fallbackResult[0]?.submitted || 0);
    }

    const pending = Math.max(totalAssignments - submitted, 0);

    const submissionPercentage =
      totalAssignments > 0
        ? Number(((submitted / totalAssignments) * 100).toFixed(2))
        : 0;

    return {
      total_assignments: totalAssignments,
      submitted,
      pending,
      submission_percentage: submissionPercentage,
    };
  }

  async getResultSummary(student_id, from_date, to_date) {
    try {
      const query = `
        SELECT
          COALESCE(SUM(total_marks), 0)::float AS total_marks,
          COALESCE(SUM(obtained_marks), 0)::float AS obtained_marks
        FROM result_master
        WHERE student_id = :student_id
          AND exam_date BETWEEN :from_date AND :to_date
      `;

      const result = await sequelize.query(query, {
        replacements: {
          student_id: Number(student_id),
          from_date,
          to_date,
        },
        type: QueryTypes.SELECT,
      });

      const row = result[0] || {};

      const totalMarks = Number(row.total_marks || 0);
      const obtainedMarks = Number(row.obtained_marks || 0);

      const percentage =
        totalMarks > 0
          ? Number(((obtainedMarks / totalMarks) * 100).toFixed(2))
          : 0;

      return {
        total_marks: totalMarks,
        obtained_marks: obtainedMarks,
        percentage,
        grade: this.getGrade(percentage),
      };
    } catch (error) {
      return {
        total_marks: 0,
        obtained_marks: 0,
        percentage: 0,
        grade: "-",
      };
    }
  }

  getGrade(percentage) {
    if (percentage >= 85) return "A+";
    if (percentage >= 75) return "A";
    if (percentage >= 65) return "B";
    if (percentage >= 50) return "C";
    if (percentage >= 35) return "D";
    return "F";
  }

  getFinalRemark({
    attendancePercentage = 0,
    feesStatus = "NO_RECORD",
    assignmentPercentage = 0,
    resultPercentage = 0,
  }) {
    let score = 0;

    if (attendancePercentage >= 85) score += 25;
    else if (attendancePercentage >= 75) score += 20;
    else if (attendancePercentage >= 60) score += 15;
    else score += 5;

    if (feesStatus === "PAID") score += 25;
    else if (feesStatus === "PARTIAL") score += 15;
    else score += 5;

    if (assignmentPercentage >= 90) score += 25;
    else if (assignmentPercentage >= 75) score += 20;
    else if (assignmentPercentage >= 50) score += 15;
    else score += 5;

    if (resultPercentage >= 85) score += 25;
    else if (resultPercentage >= 75) score += 20;
    else if (resultPercentage >= 60) score += 15;
    else if (resultPercentage >= 35) score += 10;
    else score += 5;

    if (score >= 85) return "Excellent Performance";
    if (score >= 70) return "Good Performance";
    if (score >= 50) return "Average Performance";
    return "Needs Improvement";
  }
}

module.exports = new SummaryService();