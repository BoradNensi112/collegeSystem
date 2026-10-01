const Notice = require("../models/notice");

const up = (v, d) => String(v ?? d).toUpperCase().trim();

const normalizeOne = (data) => {
  const title = (data.title ?? "").toString().trim();
  if (!title) throw new Error("title required");

  return {
    title,
    description: (data.message ?? data.description ?? "").toString().trim(),
    issue_by: (data.issue_by ?? data.by ?? "Admin").toString().trim(),
    category: (data.category ?? "General").toString().trim(),
    audience: up(data.audience, "ALL"),   
    priority: up(data.priority, "NORMAL"), 
    status: up(data.status, "PUBLISHED"), 
    pinned: Boolean(data.pinned ?? false),
    publish_at: data.publishAt ?? data.publish_at ?? null,
    attachment_url: data.attachmentUrl ?? data.attachment_url ?? null,
    created_at: new Date(),
    updated_at: new Date(),
  };
};

// CREATE
exports.noticeInsert = async (body) => {
  try {
    if (Array.isArray(body)) {
      const payload = body.map((x, idx) => {
        try {
          return normalizeOne(x);
        } catch (e) {
          throw new Error(`Row ${idx + 1}: ${e.message}`);
        }
      });

      return await Notice.bulkCreate(payload, { validate: true });
    }

    const payload = normalizeOne(body);
    return await Notice.create(payload);
  } catch (err) {
    const error = new Error(err.message || "Insert failed");
    error.statusCode = err.statusCode || 500;
    throw error;
  }
};

// LIST ALL
exports.viewNoticeData = async () => {
  try {
    return await Notice.findAll({
      order: [["created_at", "DESC"]],
    });
  } catch (err) {
    const error = new Error(err.message || "Fetch failed");
    error.statusCode = 500;
    throw error;
  }
};

// VIEW ONE
exports.viewNoticeOneData = async (id) => {
  try {
    return await Notice.findOne({
      where: { notice_id: id },
    });
  } catch (err) {
    const error = new Error(err.message || "Fetch one failed");
    error.statusCode = 500;
    throw error;
  }
};

// DELETE
exports.deleteData = async (id) => {
  try {
    return await Notice.destroy({
      where: { notice_id: id },
    });
  } catch (err) {
    const error = new Error(err.message || "Delete failed");
    error.statusCode = 500;
    throw error;
  }
};

// UPDATE
exports.NoticeUpdate = async (body) => {
  try {
    if (!body.notice_id) {
      const error = new Error("notice_id required");
      error.statusCode = 400;
      throw error;
    }

    const oldRow = await Notice.findOne({
      where: { notice_id: body.notice_id },
    });

    if (!oldRow) {
      const error = new Error("Notice not found");
      error.statusCode = 404;
      throw error;
    }

    const title = (body.title ?? oldRow.title ?? "").toString().trim();
    if (!title) {
      const error = new Error("title required");
      error.statusCode = 400;
      throw error;
    }

    const payload = {
      title,
      description: (body.message ?? body.description ?? oldRow.description ?? "").toString().trim(),
      issue_by: (body.issue_by ?? body.by ?? oldRow.issue_by ?? "Admin").toString().trim(),
      category: (body.category ?? oldRow.category ?? "General").toString().trim(),
      audience: up(body.audience, oldRow.audience ?? "ALL"),
      priority: up(body.priority, oldRow.priority ?? "NORMAL"),
      status: up(body.status, oldRow.status ?? "PUBLISHED"),
      pinned: body.pinned !== undefined ? Boolean(body.pinned) : Boolean(oldRow.pinned),
      publish_at: body.publishAt ?? body.publish_at ?? oldRow.publish_at ?? null,
      attachment_url: body.attachmentUrl ?? body.attachment_url ?? oldRow.attachment_url ?? null,
      updated_at: new Date(),
    };

    const result = await Notice.update(payload, {
      where: { notice_id: body.notice_id },
    });

    return result;
  } catch (err) {
    const error = new Error(err.message || "Update failed");
    error.statusCode = err.statusCode || 500;
    throw error;
  }
};

// TOGGLE PUBLISH / UNPUBLISH
exports.toggleNoticeStatus = async (id) => {
  try {
    const row = await Notice.findOne({
      where: { notice_id: id },
    });

    if (!row) return null;

    const currentStatus = String(row.status || "").toUpperCase().trim();
    const nextStatus = currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";

    await Notice.update(
      {
        status: nextStatus,
        updated_at: new Date(),
      },
      {
        where: { notice_id: id },
      }
    );

    return {
      notice_id: id,
      status: nextStatus,
    };
  } catch (err) {
    const error = new Error(err.message || "Toggle failed");
    error.statusCode = 500;
    throw error;
  }
};