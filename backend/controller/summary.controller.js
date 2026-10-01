const summaryService = require("../services/summary.service");

class SummaryController {
  async getStudentSummary(req, res) {
    try {
      const { student_id, from_date, to_date, report_type } = req.body;

      if (!student_id) {
        return res.status(400).json({
          success: false,
          message: "student_id is required",
        });
      }

      if (!from_date || !to_date) {
        return res.status(400).json({
          success: false,
          message: "from_date and to_date are required",
        });
      }

      const data = await summaryService.getStudentSummary({
        student_id,
        from_date,
        to_date,
        report_type,
      });

      return res.status(200).json({
        success: true,
        message: "Student summary fetched successfully",
        data,
      });
    } catch (error) {
      console.error("STUDENT SUMMARY ERROR =>", error);

      return res.status(500).json({
        success: false,
        message: "Something went wrong while generating summary",
        error: error.message,
      });
    }
  }
}

module.exports = new SummaryController();