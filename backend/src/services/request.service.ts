import { ResultSetHeader, RowDataPacket } from 'mysql2';
import db from '../config/db';

// ── Map Pashto/Dari priority labels → DB ENUM ────────────────────────────────
function normalizeRequestLevel(level: string): 'URGENT' | 'NORMAL' | 'LOW' {
  if (!level) return 'NORMAL';
  const s = level.trim();
  if (['URGENT', 'NORMAL', 'LOW'].includes(s)) return s as 'URGENT' | 'NORMAL' | 'LOW';
  // Pashto urgent
  if (['ډېر عاجل', 'ډیر عاجل', 'عاجل', 'بسیار عاجل', 'فوري', 'urgent'].includes(s)) return 'URGENT';
  // Pashto high-importance
  if (['ډېر مهم', 'ډیر مهم', 'بسیار مهم', 'خورا مهم'].includes(s)) return 'URGENT';
  // Pashto low
  if (['لږ مهم', 'کم‌اهمیت', 'کم اهمیت', 'low'].includes(s)) return 'LOW';
  // Pashto normal / متوسط
  if (['عادي', 'عادی', 'متوسط', 'normal'].includes(s)) return 'NORMAL';
  return 'NORMAL';
}

// ── Workflow stage configuration ─────────────────────────────────────────────
const STAGE_MAP: Record<string, {
  progress: number; stage_ps: string;
  assignedRole: string; nextAction: string; complete: boolean;
}> = {
  Draft:                        { progress: 0,   stage_ps: 'غوښتنه جوړه شوه',                  assignedRole: 'REQUESTER',             nextAction: 'غوښتنه بیاکتنې ته واستوئ',            complete: false },
  PendingReview:                { progress: 0,   stage_ps: 'د لومړني بیاکتنې انتظار کې',       assignedRole: 'REQUEST_CONFIRMER',     nextAction: 'غوښتنه وکتل سي / پیشنهاد منظور کړئ', complete: false },
  ReviewReturned:               { progress: 0,   stage_ps: 'بیاکتنې سره بیرته راستانه شوه',   assignedRole: 'REQUESTER',             nextAction: 'ملاحظې سمه کړئ او بیا واستوئ',        complete: false },
  Submitted:                    { progress: 0,   stage_ps: 'غوښتنه رسمي واستول شوه',           assignedRole: 'REQUEST_CONFIRMER',     nextAction: 'غوښتنه تاییدول یا ردول',              complete: false },
  ConfirmedByRequestConfirmer:  { progress: 5,   stage_ps: 'د تایید کوونکي لخوا تایید شوه',      assignedRole: 'SUPER_ADMIN',           nextAction: 'غوښتنه منظورول یا ردول',              complete: false },
  RejectedByRequestConfirmer:   { progress: 0,   stage_ps: 'د تایید کوونکي لخوا رد شوه',        assignedRole: 'REQUESTER',             nextAction: 'غوښتنه بیاکتنه وکړئ',                complete: false },
  ApprovedBySuperAdmin:         { progress: 10,  stage_ps: 'د لوی مدیر لخوا منظور شوه',         assignedRole: 'ADMIN',                 nextAction: 'موجودي وګورئ او راجع کړئ',            complete: false },
  RejectedBySuperAdmin:         { progress: 0,   stage_ps: 'د لوی مدیر لخوا رد شوه',           assignedRole: 'REQUESTER',             nextAction: 'غوښتنه بیاکتنه وکړئ',                complete: false },
  StockAvailable:               { progress: 20,  stage_ps: 'ګودام ته راجع شو',                 assignedRole: 'WAREHOUSE_DIRECTOR',    nextAction: 'اجناس چمتو کړئ',                      complete: false },
  StockNotAvailable:            { progress: 20,  stage_ps: 'تدارکاتو ته راجع شو',              assignedRole: 'PROCUREMENT_DIRECTOR',  nextAction: 'د تدارکاتو پروسه پیل کړئ',           complete: false },
  ProcurementPending:           { progress: 25,  stage_ps: 'تدارکات پیل شول',                  assignedRole: 'PROCUREMENT_DIRECTOR',  nextAction: 'مناقصه جوړه کړئ',                    complete: false },
  TenderCreated:                { progress: 35,  stage_ps: 'مناقصه جوړه شوه',                  assignedRole: 'PROCUREMENT_DIRECTOR',  nextAction: 'آفرونه راټول کړئ',                   complete: false },
  OffersReceived:               { progress: 45,  stage_ps: 'آفرونه ترلاسه شول',                assignedRole: 'PROCUREMENT_DIRECTOR',  nextAction: 'آفرونه پرتله کړئ',                   complete: false },
  ComparisonCreated:            { progress: 55,  stage_ps: 'پرتلنه جوړه شوه',                  assignedRole: 'PROCUREMENT_DIRECTOR',  nextAction: 'بریالی وټاکئ',                       complete: false },
  WinnerSelected:               { progress: 65,  stage_ps: 'بریالی وټاکل شو',                  assignedRole: 'PROCUREMENT_DIRECTOR',  nextAction: 'د خریدارۍ امر جوړ کړئ',             complete: false },
  PurchaseOrderCreated:         { progress: 70,  stage_ps: 'د خریدارۍ امر جوړ شو',            assignedRole: 'WAREHOUSE_DIRECTOR',    nextAction: 'اجناس ترلاسه کړئ',                   complete: false },
  ReceiptReportCreated:         { progress: 75,  stage_ps: 'د اخیستلو راپور جوړ شو',           assignedRole: 'WAREHOUSE_DIRECTOR',    nextAction: 'اجناس ګودام ته داخل کړئ',           complete: false },
  ReceivedToInventory:          { progress: 80,  stage_ps: 'اجناس ګودام ته داخل شول',          assignedRole: 'WAREHOUSE_DIRECTOR',    nextAction: 'ف.س-۵ جوړ کړئ',                     complete: false },
  FS5Created:                   { progress: 90,  stage_ps: 'ف.س-۵ جوړ شو',                    assignedRole: 'WAREHOUSE_DIRECTOR',    nextAction: 'اجناس وسپارئ',                       complete: false },
  Delivered:                    { progress: 100, stage_ps: 'اجناس وسپارل شول',                 assignedRole: 'NONE',                  nextAction: 'بشپړه',                               complete: true  },
  Completed:                    { progress: 100, stage_ps: 'بشپړه شوه',                        assignedRole: 'NONE',                  nextAction: 'بشپړه',                               complete: true  },
  // Legacy/canonical statuses
  PENDING:                      { progress: 0,   stage_ps: 'غوښتنه واستول شوه',                 assignedRole: 'REQUEST_CONFIRMER',     nextAction: 'غوښتنه تاییدول',                      complete: false },
  CONFIRMED:                    { progress: 5,   stage_ps: 'تایید شوه',                        assignedRole: 'SUPER_ADMIN',           nextAction: 'منظورول',                             complete: false },
  SENT_TO_PROCUREMENT:          { progress: 25,  stage_ps: 'تدارکاتو ته لیږل شوه',             assignedRole: 'PROCUREMENT_DIRECTOR',  nextAction: 'تدارکات',                             complete: false },
  READY_FOR_DELIVERY:           { progress: 80,  stage_ps: 'د سپارلو لپاره چمتو دی',           assignedRole: 'WAREHOUSE_DIRECTOR',    nextAction: 'اجناس وسپارئ',                       complete: false },
  DELIVERED:                    { progress: 100, stage_ps: 'وسپارل شول',                       assignedRole: 'NONE',                  nextAction: 'بشپړه',                               complete: true  },
  COMPLETED:                    { progress: 100, stage_ps: 'بشپړه',                            assignedRole: 'NONE',                  nextAction: 'بشپړه',                               complete: true  },
  REJECTED:                     { progress: 0,   stage_ps: 'رد شوه',                           assignedRole: 'REQUESTER',             nextAction: 'بیاکتنه',                             complete: false },
};

export class RequestService {
  static async runMigrations() {
    const { withRetry } = await import('../utils/migrationHelper');

    await withRetry(() => db.query(`ALTER TABLE request_items ADD COLUMN unit_price DECIMAL(15,2) DEFAULT 0`)).catch(() => {});
    await withRetry(() => db.query(`ALTER TABLE request_items ADD COLUMN total_price DECIMAL(15,2) DEFAULT 0`)).catch(() => {});

    await withRetry(() => db.query(`ALTER TABLE requests MODIFY COLUMN status VARCHAR(100) DEFAULT 'Submitted'`)).catch(() => {});
    await withRetry(() => db.query(`ALTER TABLE requests ADD COLUMN current_stage VARCHAR(100) NULL`)).catch(() => {});
    await withRetry(() => db.query(`ALTER TABLE requests ADD COLUMN assigned_role VARCHAR(100) NULL`)).catch(() => {});
    await withRetry(() => db.query(`ALTER TABLE requests ADD COLUMN faculty_name_text VARCHAR(255) NULL`)).catch(() => {});
    await withRetry(() => db.query(`ALTER TABLE requests ADD COLUMN department_name_text VARCHAR(255) NULL`)).catch(() => {});
    await withRetry(() => db.query(`ALTER TABLE requests ADD COLUMN requester_name_text VARCHAR(150) NULL`)).catch(() => {});

    await withRetry(() => db.query(`
      UPDATE requests
      SET current_stage = 'REQUEST_CONFIRMER',
          assigned_role = 'REQUEST_CONFIRMER'
      WHERE (current_stage IS NULL OR current_stage = '')
        AND status IN ('Submitted','PENDING','submitted')
        AND is_deleted = FALSE
    `)).catch(() => {});

    await withRetry(() => db.query(`
      CREATE TABLE IF NOT EXISTS request_pipeline (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        request_id     INT NOT NULL,
        status         VARCHAR(100) NOT NULL,
        stage_label    VARCHAR(255) DEFAULT '',
        progress       INT DEFAULT 0,
        action_by      VARCHAR(100) DEFAULT '',
        action_by_name VARCHAR(150) DEFAULT '',
        action_by_role VARCHAR(100) DEFAULT '',
        assigned_role  VARCHAR(100) DEFAULT '',
        next_action    TEXT,
        comment        TEXT,
        work_complete  TINYINT(1) DEFAULT 0,
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_pipeline_request (request_id)
      ) ENGINE=InnoDB
    `)).catch(() => {});
  }

  static async getRequests() {
    const [rows] = await db.query<RowDataPacket[]>(`
      SELECT r.*,
        COALESCE(r.requester_name_text, u.name) as requester_name,
        COALESCE(r.faculty_name_text, f.name_ps)   as faculty_name,
        COALESCE(r.department_name_text, d.name_ps) as department_name,
        p.full_name as person_name
      FROM requests r
      LEFT JOIN users u ON r.requester_id = u.id
      LEFT JOIN faculties f ON r.faculty_id = f.id
      LEFT JOIN departments d ON r.department_id = d.id
      LEFT JOIN people p ON r.person_id = p.id
      WHERE r.is_deleted = FALSE
      ORDER BY r.created_at DESC
    `);

    if ((rows as any[]).length === 0) return rows;

    // Fetch items for all requests in one query and merge
    const ids = (rows as any[]).map((r: any) => r.id);
    const placeholders = ids.map(() => '?').join(',');
    const [itemRows] = await db.query<RowDataPacket[]>(`
      SELECT ri.*, i.item_code, u2.name_ps as unit_name
      FROM request_items ri
      LEFT JOIN items i ON ri.item_id = i.id
      LEFT JOIN units u2 ON ri.unit_id = u2.id
      WHERE ri.request_id IN (${placeholders})
    `, ids);

    const itemsByRequest: Record<number, any[]> = {};
    for (const item of itemRows as any[]) {
      if (!itemsByRequest[item.request_id]) itemsByRequest[item.request_id] = [];
      itemsByRequest[item.request_id].push(item);
    }

    return (rows as any[]).map((r: any) => ({
      ...r,
      items: itemsByRequest[r.id] || []
    }));
  }

  static async getRequestById(id: number) {
    const [requests] = await db.query<RowDataPacket[]>(`
      SELECT r.*,
        COALESCE(r.requester_name_text, u.name) as requester_name,
        COALESCE(r.faculty_name_text, f.name_ps)   as faculty_name,
        COALESCE(r.department_name_text, d.name_ps) as department_name,
        p.full_name as person_name
      FROM requests r
      LEFT JOIN users u ON r.requester_id = u.id
      LEFT JOIN faculties f ON r.faculty_id = f.id
      LEFT JOIN departments d ON r.department_id = d.id
      LEFT JOIN people p ON r.person_id = p.id
      WHERE r.id = ? AND r.is_deleted = FALSE
    `, [id]);

    if (requests.length === 0) return null;

    const [items] = await db.query<RowDataPacket[]>(`
      SELECT ri.*, i.item_code, u.name_ps as unit_name
      FROM request_items ri
      LEFT JOIN items i ON ri.item_id = i.id
      LEFT JOIN units u ON ri.unit_id = u.id
      WHERE ri.request_id = ?
    `, [id]);

    return { ...requests[0], items };
  }

  static async createRequest(data: any, userId: number | null) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const trackingId = 'REQ-' + Date.now();
      const status       = 'PendingReview';
      const currentStage = 'REQUEST_CONFIRMER';
      const assignedRole = 'REQUEST_CONFIRMER';
      const progress     = 0;

      const [result] = await connection.query<ResultSetHeader>(`
        INSERT INTO requests
          (tracking_id, requester_id, faculty_id, department_id, person_id,
           request_level, notes, status, current_stage, assigned_role, progress_percent,
           faculty_name_text, department_name_text, requester_name_text)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        trackingId,
        userId,
        data.faculty_id || null,
        data.department_id || null,
        data.person_id || null,
        normalizeRequestLevel(data.request_level || ''),
        data.notes || '',
        status,
        currentStage,
        assignedRole,
        progress,
        data.faculty_name || null,
        data.department_name || null,
        data.requester_name || null,
      ]);

      const requestId = result.insertId;

      if (data.items && Array.isArray(data.items)) {
        for (const item of data.items) {
          await connection.query(`
            INSERT INTO request_items (request_id, item_id, item_name, quantity, unit_id, specifications, unit_price, total_price)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [requestId, item.item_id || null, item.item_name, item.quantity, item.unit_id || null, item.specifications || '', item.unit_price || 0, item.total_price || 0]);
        }
      }

      await connection.query(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
        VALUES (?, ?, ?, ?, ?)
      `, [userId, 'CREATE', 'REQUEST', requestId,
          JSON.stringify({ status, current_stage: currentStage, assigned_role: assignedRole })]);

      // Seed pipeline entry for submission
      await connection.query(`
        INSERT INTO request_pipeline
          (request_id, status, stage_label, progress, action_by, action_by_name, action_by_role,
           assigned_role, next_action, comment, work_complete)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [requestId, status, 'د لومړني بیاکتنې لپاره واستول شوه', progress,
          userId?.toString() ?? '', data.requester_name ?? '', 'Requester',
          assignedRole, 'غوښتنه وکتل سي / پیشنهاد منظور کړئ', '', 0]);

      await connection.commit();
      return requestId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async updateStatus(
    id: number,
    status: string,
    userId: number | null,
    opts: {
      stageLabelOverride?: string;
      actionByName?: string;
      actionByRole?: string;
      comment?: string;
    } = {}
  ) {
    const cfg = STAGE_MAP[status] ?? { progress: 0, stage_ps: status, assignedRole: '', nextAction: '', complete: false };
    const progress     = cfg.progress;
    const stageLabel   = opts.stageLabelOverride || cfg.stage_ps;
    const assignedRole = cfg.assignedRole;

    const [result] = await db.query<ResultSetHeader>(`
      UPDATE requests
      SET status = ?, progress_percent = ?, current_stage = ?, assigned_role = ?
      WHERE id = ?
    `, [status, progress, status, assignedRole, id]);

    if (result.affectedRows === 0) throw new Error('not_found');

    await db.query(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, 'UPDATE_STATUS', 'REQUEST', id,
        JSON.stringify({ status, progress_percent: progress, assigned_role: assignedRole })]);

    await db.query(`
      INSERT INTO request_pipeline
        (request_id, status, stage_label, progress, action_by, action_by_name, action_by_role,
         assigned_role, next_action, comment, work_complete)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, status, stageLabel, progress,
      userId?.toString() ?? '',
      opts.actionByName ?? '',
      opts.actionByRole ?? '',
      assignedRole,
      cfg.nextAction,
      opts.comment ?? '',
      cfg.complete ? 1 : 0,
    ]).catch(() => {});

    return {
      requestID:        id.toString(),
      currentStage:     stageLabel,
      assignedRole,
      progressPercent:  progress,
      nextActionRequired: cfg.nextAction,
      workflowComplete: cfg.complete,
    };
  }

  static async updateLevel(id: number, newLevel: string, reason: string, userId: number | null) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [requests] = await connection.query<RowDataPacket[]>(
        `SELECT request_level FROM requests WHERE id = ?`, [id]);
      if (requests.length === 0) throw new Error('not_found');

      const oldLevel = requests[0].request_level;

      await connection.query(`UPDATE requests SET request_level = ? WHERE id = ?`, [newLevel, id]);
      await connection.query(`
        INSERT INTO request_level_history (request_id, old_level, new_level, changed_by, reason)
        VALUES (?, ?, ?, ?, ?)
      `, [id, oldLevel, newLevel, userId, reason]);
      await connection.query(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
        VALUES (?, ?, ?, ?, ?)
      `, [userId, 'UPDATE_LEVEL', 'REQUEST', id, JSON.stringify({ new_level: newLevel })]);

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getLevelHistory(id: number) {
    const [rows] = await db.query<RowDataPacket[]>(`
      SELECT h.*, u.name as changed_by_name
      FROM request_level_history h
      LEFT JOIN users u ON h.changed_by = u.id
      WHERE h.request_id = ?
      ORDER BY h.created_at DESC
    `, [id]);
    return rows;
  }

  static async getPipelineHistory(id: number) {
    const [request] = await db.query<RowDataPacket[]>(`
      SELECT r.id, r.tracking_id, r.status, r.current_stage, r.assigned_role,
             r.progress_percent, r.request_level, r.created_at, r.updated_at
      FROM requests r
      WHERE r.id = ? AND r.is_deleted = FALSE
    `, [id]);

    if (request.length === 0) throw new Error('not_found');

    const req = request[0];
    const cfg = STAGE_MAP[req.status] ?? {
      progress: req.progress_percent, stage_ps: req.status,
      assignedRole: req.assigned_role || '', nextAction: '', complete: false,
    };

    const workflowSummary = {
      requestID:          req.id.toString(),
      currentStage:       cfg.stage_ps,
      assignedRole:       req.assigned_role || cfg.assignedRole,
      progressPercent:    cfg.progress,
      nextActionRequired: cfg.nextAction,
      workflowComplete:   cfg.complete,
    };

    let pipelineRows: RowDataPacket[] = [];
    try {
      const [rows] = await db.query<RowDataPacket[]>(`
        SELECT p.*, u.name as actor_name
        FROM request_pipeline p
        LEFT JOIN users u ON p.action_by = u.id
        WHERE p.request_id = ?
        ORDER BY p.created_at ASC
      `, [id]);
      pipelineRows = rows;
    } catch {
      const [auditLogs] = await db.query<RowDataPacket[]>(`
        SELECT al.action, al.new_value, al.created_at
        FROM audit_logs al
        WHERE al.entity_type = 'REQUEST' AND al.entity_id = ?
        ORDER BY al.created_at ASC
      `, [id.toString()]);
      pipelineRows = auditLogs;
    }

    const [levelHistory] = await db.query<RowDataPacket[]>(`
      SELECT h.*, u.name as changed_by_name
      FROM request_level_history h
      LEFT JOIN users u ON h.changed_by = u.id
      WHERE h.request_id = ?
      ORDER BY h.created_at ASC
    `, [id]);

    return { workflow: workflowSummary, pipeline: pipelineRows, level_history: levelHistory };
  }

  static async deleteRequest(id: number, userId: number | null) {
    const [result] = await db.query<ResultSetHeader>(
      `UPDATE requests SET is_deleted = TRUE, deleted_at = NOW() WHERE id = ?`, [id]);
    if (result.affectedRows === 0) throw new Error('not_found');

    await db.query(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
      VALUES (?, ?, ?, ?)
    `, [userId, 'DELETE', 'REQUEST', id]);

    return true;
  }
}
