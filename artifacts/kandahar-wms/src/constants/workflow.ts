export interface WorkflowStageConfig {
  progressPercent: number;
  stage_ps: string;
  stage_dr: string;
  assignedRole: string;
  assignedRole_ps: string;
  nextAction_ps: string;
  workflowComplete: boolean;
}

export const WORKFLOW_STAGES: Record<string, WorkflowStageConfig> = {
  Draft: {
    progressPercent: 0,
    stage_ps: 'غوښتنه جوړه شوه',
    stage_dr: 'درخواست ایجاد شد',
    assignedRole: 'Requester',
    assignedRole_ps: 'غوښتونکی',
    nextAction_ps: 'غوښتنه نهایي او واستوئ',
    workflowComplete: false,
  },
  Submitted: {
    progressPercent: 0,
    stage_ps: 'غوښتنه واستول شوه',
    stage_dr: 'درخواست ارسال شد',
    assignedRole: 'Request Confirmer',
    assignedRole_ps: 'د غوښتنې تایید کوونکی',
    nextAction_ps: 'غوښتنه تاییدول یا ردول',
    workflowComplete: false,
  },
  ConfirmedByRequestConfirmer: {
    progressPercent: 5,
    stage_ps: 'د تایید کوونکي لخوا تایید شوه',
    stage_dr: 'توسط تایید کننده تایید شد',
    assignedRole: 'Super Admin',
    assignedRole_ps: 'لوی مدیر',
    nextAction_ps: 'غوښتنه منظورول یا ردول',
    workflowComplete: false,
  },
  RejectedByRequestConfirmer: {
    progressPercent: 0,
    stage_ps: 'د تایید کوونکي لخوا رد شوه',
    stage_dr: 'توسط تایید کننده رد شد',
    assignedRole: 'Requester',
    assignedRole_ps: 'غوښتونکی',
    nextAction_ps: 'غوښتنه بیاکتنه وکړئ',
    workflowComplete: false,
  },
  ReturnedToConfirmer: {
    progressPercent: 2,
    stage_ps: 'د مقام لخوا تایید کوونکي ته راستانه شوه',
    stage_dr: 'توسط مقام به تأییدکننده بازگردانده شد',
    assignedRole: 'Request Confirmer',
    assignedRole_ps: 'د غوښتنې تایید کوونکی',
    nextAction_ps: 'ملاحظه وګورئ او بیا غوښتنه واستوئ',
    workflowComplete: false,
  },
  ReviewReturned: {
    progressPercent: 0,
    stage_ps: 'بیاکتنې ته بیرته راستانه شوه',
    stage_dr: 'برای بازبینی بازگردانده شد',
    assignedRole: 'Requester',
    assignedRole_ps: 'غوښتونکی',
    nextAction_ps: 'ملاحظه وګورئ، سم کړئ او بیا واستوئ',
    workflowComplete: false,
  },
  ApprovedBySuperAdmin: {
    progressPercent: 10,
    stage_ps: 'د لوی مدیر لخوا منظور شوه',
    stage_dr: 'توسط مقام منظور شد',
    assignedRole: 'Admin',
    assignedRole_ps: 'اډمین',
    nextAction_ps: 'موجودي وګورئ او ګودام ته یا تدارکاتو ته راجع کړئ',
    workflowComplete: false,
  },
  RejectedBySuperAdmin: {
    progressPercent: 0,
    stage_ps: 'د لوی مدیر لخوا رد شوه',
    stage_dr: 'توسط مقام رد شد',
    assignedRole: 'Requester',
    assignedRole_ps: 'غوښتونکی',
    nextAction_ps: 'غوښتنه بیاکتنه وکړئ',
    workflowComplete: false,
  },
  StockAvailable: {
    progressPercent: 20,
    stage_ps: 'ګودام ته راجع شو',
    stage_dr: 'به ګدام ارجاع شد',
    assignedRole: 'Warehouse Director',
    assignedRole_ps: 'د ګودام مدیر',
    nextAction_ps: 'اجناس چمتو کړئ او ف.س-۵ جوړ کړئ',
    workflowComplete: false,
  },
  StockNotAvailable: {
    progressPercent: 20,
    stage_ps: 'تدارکاتو ته راجع شو',
    stage_dr: 'به تدارکات ارجاع شد',
    assignedRole: 'Procurement Director',
    assignedRole_ps: 'د تدارکاتو مدیر',
    nextAction_ps: 'د تدارکاتو پروسه پیل کړئ',
    workflowComplete: false,
  },
  ProcurementPending: {
    progressPercent: 25,
    stage_ps: 'تدارکات پیل شول',
    stage_dr: 'تدارکات شروع شد',
    assignedRole: 'Procurement Director',
    assignedRole_ps: 'د تدارکاتو مدیر',
    nextAction_ps: 'مناقصه جوړه کړئ او آفرونه راټول کړئ',
    workflowComplete: false,
  },
  TenderCreated: {
    progressPercent: 35,
    stage_ps: 'مناقصه جوړه شوه',
    stage_dr: 'مناقصه ایجاد شد',
    assignedRole: 'Procurement Director',
    assignedRole_ps: 'د تدارکاتو مدیر',
    nextAction_ps: 'د فروشندو آفرونه راټول کړئ',
    workflowComplete: false,
  },
  OffersReceived: {
    progressPercent: 45,
    stage_ps: 'آفرونه ترلاسه شول',
    stage_dr: 'آفرها دریافت شد',
    assignedRole: 'Procurement Director',
    assignedRole_ps: 'د تدارکاتو مدیر',
    nextAction_ps: 'آفرونه پرتله کړئ',
    workflowComplete: false,
  },
  ComparisonCreated: {
    progressPercent: 55,
    stage_ps: 'د آفرونو پرتلنه جوړه شوه',
    stage_dr: 'مقایسه آفرها انجام شد',
    assignedRole: 'Procurement Director',
    assignedRole_ps: 'د تدارکاتو مدیر',
    nextAction_ps: 'بریالی فروشنده وټاکئ',
    workflowComplete: false,
  },
  WinnerSelected: {
    progressPercent: 65,
    stage_ps: 'بریالی فروشنده وټاکل شو',
    stage_dr: 'فروشنده برنده انتخاب شد',
    assignedRole: 'Procurement Director',
    assignedRole_ps: 'د تدارکاتو مدیر',
    nextAction_ps: 'د خریدارۍ امر جوړ کړئ',
    workflowComplete: false,
  },
  PurchaseOrderCreated: {
    progressPercent: 70,
    stage_ps: 'د خریدارۍ امر جوړ شو',
    stage_dr: 'دستور خرید صادر شد',
    assignedRole: 'Warehouse Director',
    assignedRole_ps: 'د ګودام مدیر',
    nextAction_ps: 'اجناس ترلاسه کړئ او راپور جوړ کړئ',
    workflowComplete: false,
  },
  ReceiptReportCreated: {
    progressPercent: 75,
    stage_ps: 'د اخیستلو راپور جوړ شو',
    stage_dr: 'گزارش دریافت ایجاد شد',
    assignedRole: 'Warehouse Director',
    assignedRole_ps: 'د ګودام مدیر',
    nextAction_ps: 'اجناس موجودۍ ته داخل کړئ',
    workflowComplete: false,
  },
  ReceivedToInventory: {
    progressPercent: 80,
    stage_ps: 'اجناس ګودام ته داخل شول',
    stage_dr: 'اجناس به ګدام وارد شد',
    assignedRole: 'Warehouse Director',
    assignedRole_ps: 'د ګودام مدیر',
    nextAction_ps: 'ف.س-۵ فورم جوړ کړئ',
    workflowComplete: false,
  },
  FS5Created: {
    progressPercent: 90,
    stage_ps: 'ف.س-۵ فورم جوړ شو',
    stage_dr: 'فورم ف.س-۵ ایجاد شد',
    assignedRole: 'Warehouse Director',
    assignedRole_ps: 'د ګودام مدیر',
    nextAction_ps: 'اجناس غوښتونکي ته وسپارئ',
    workflowComplete: false,
  },
  Delivered: {
    progressPercent: 100,
    stage_ps: 'اجناس وسپارل شول',
    stage_dr: 'اجناس تحویل داده شد',
    assignedRole: '',
    assignedRole_ps: 'بشپړه',
    nextAction_ps: 'بشپړه — نور کار نشته',
    workflowComplete: true,
  },
  Completed: {
    progressPercent: 100,
    stage_ps: 'غوښتنه بشپړه شوه',
    stage_dr: 'درخواست تکمیل شد',
    assignedRole: '',
    assignedRole_ps: 'بشپړه',
    nextAction_ps: 'بشپړه — نور کار نشته',
    workflowComplete: true,
  },
  REJECTED: {
    progressPercent: 0,
    stage_ps: 'غوښتنه رد شوه',
    stage_dr: 'درخواست رد شد',
    assignedRole: 'Requester',
    assignedRole_ps: 'غوښتونکی',
    nextAction_ps: 'غوښتنه بیاکتنه وکړئ',
    workflowComplete: false,
  },
};

export function getWorkflowStage(status: string): WorkflowStageConfig {
  return (
    WORKFLOW_STAGES[status] ?? {
      progressPercent: 0,
      stage_ps: status,
      stage_dr: status,
      assignedRole: '',
      assignedRole_ps: '',
      nextAction_ps: '',
      workflowComplete: false,
    }
  );
}

export function buildWorkflowOutput(
  requestID: string,
  status: string
): {
  requestID: string;
  currentStage: string;
  assignedRole: string;
  progressPercent: number;
  nextActionRequired: string;
  workflowComplete: boolean;
} {
  const cfg = getWorkflowStage(status);
  return {
    requestID,
    currentStage: cfg.stage_ps,
    assignedRole: cfg.assignedRole_ps,
    progressPercent: cfg.progressPercent,
    nextActionRequired: cfg.nextAction_ps,
    workflowComplete: cfg.workflowComplete,
  };
}
