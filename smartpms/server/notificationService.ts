import { ENV } from './_core/env';
import { getDb } from './db';
import { notifications } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

interface NotifyOptions {
  userId: number;
  userEmail?: string | null;
  userPhone?: string | null;
  userName?: string | null;
  type: typeof notifications.$inferInsert['type'];
  title: string;
  content?: string;
  relatedIssueId?: number;
  relatedWbsId?: number;
}

// 이메일 발송 (Manus built-in API 활용)
async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  try {
    const apiUrl = process.env.BUILT_IN_FORGE_API_URL;
    const apiKey = process.env.BUILT_IN_FORGE_API_KEY;
    if (!apiUrl || !apiKey) {
      console.warn('[Email] API credentials not available');
      return false;
    }
    // Use notification API as email proxy
    const response = await fetch(`${apiUrl}/v1/notification/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ to, subject, body }),
    });
    if (!response.ok) {
      console.warn('[Email] Failed to send:', response.status, await response.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Email] Error sending email:', err);
    return false;
  }
}

// SMS 발송 (Manus built-in API 활용)
async function sendSMS(to: string, message: string): Promise<boolean> {
  try {
    const apiUrl = process.env.BUILT_IN_FORGE_API_URL;
    const apiKey = process.env.BUILT_IN_FORGE_API_KEY;
    if (!apiUrl || !apiKey) {
      console.warn('[SMS] API credentials not available');
      return false;
    }
    const response = await fetch(`${apiUrl}/v1/notification/sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ to, message }),
    });
    if (!response.ok) {
      console.warn('[SMS] Failed to send:', response.status);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[SMS] Error sending SMS:', err);
    return false;
  }
}

// 통합 알림 생성 및 발송
export async function sendNotification(opts: NotifyOptions): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // DB에 알림 저장
  let emailSent = false;
  let smsSent = false;

  // 이메일 발송
  if (opts.userEmail) {
    const emailBody = `
안녕하세요, ${opts.userName || '담당자'}님.

SmartPMS에서 새로운 알림이 있습니다.

[${opts.title}]
${opts.content || ''}

SmartPMS 시스템에서 자동 발송된 메일입니다.
    `.trim();
    emailSent = await sendEmail(opts.userEmail, `[SmartPMS] ${opts.title}`, emailBody);
  }

  // SMS 발송
  if (opts.userPhone) {
    const smsMessage = `[SmartPMS] ${opts.title}`;
    smsSent = await sendSMS(opts.userPhone, smsMessage);
  }

  // 알림 DB 저장
  await db.insert(notifications).values({
    userId: opts.userId,
    type: opts.type,
    title: opts.title,
    content: opts.content,
    relatedIssueId: opts.relatedIssueId,
    relatedWbsId: opts.relatedWbsId,
    emailSent,
    smsSent,
  });
}

// 이슈 생성 알림
export async function notifyIssueCreated(opts: {
  issue: { id: number; title: string; wbsItemId?: number | null };
  assignee?: { id: number; email?: string | null; phone?: string | null; name?: string | null } | null;
  reporter?: { name?: string | null } | null;
}): Promise<void> {
  if (!opts.assignee) return;
  await sendNotification({
    userId: opts.assignee.id,
    userEmail: opts.assignee.email,
    userPhone: opts.assignee.phone,
    userName: opts.assignee.name,
    type: 'issue_created',
    title: `새 이슈 배정: ${opts.issue.title}`,
    content: `${opts.reporter?.name || '담당자'}님이 이슈를 등록하고 귀하를 담당자로 지정했습니다.\n이슈: ${opts.issue.title}`,
    relatedIssueId: opts.issue.id,
    relatedWbsId: opts.issue.wbsItemId ?? undefined,
  });
}

// 이슈 상태 변경 알림
export async function notifyIssueStatusChanged(opts: {
  issue: { id: number; title: string; status: string };
  assignee?: { id: number; email?: string | null; phone?: string | null; name?: string | null } | null;
  changedBy?: { name?: string | null } | null;
}): Promise<void> {
  if (!opts.assignee) return;
  const statusMap: Record<string, string> = {
    open: '미해결', in_progress: '진행중', resolved: '해결됨', closed: '종료'
  };
  const statusLabel = statusMap[opts.issue.status] || opts.issue.status;
  await sendNotification({
    userId: opts.assignee.id,
    userEmail: opts.assignee.email,
    userPhone: opts.assignee.phone,
    userName: opts.assignee.name,
    type: 'issue_status_changed',
    title: `이슈 상태 변경: ${opts.issue.title} → ${statusLabel}`,
    content: `${opts.changedBy?.name || '담당자'}님이 이슈 상태를 "${statusLabel}"로 변경했습니다.`,
    relatedIssueId: opts.issue.id,
  });
}

// 이슈 댓글 알림
export async function notifyIssueComment(opts: {
  issue: { id: number; title: string };
  assignee?: { id: number; email?: string | null; phone?: string | null; name?: string | null } | null;
  commenter?: { name?: string | null } | null;
  comment: string;
}): Promise<void> {
  if (!opts.assignee) return;
  await sendNotification({
    userId: opts.assignee.id,
    userEmail: opts.assignee.email,
    userPhone: opts.assignee.phone,
    userName: opts.assignee.name,
    type: 'issue_comment',
    title: `이슈 댓글: ${opts.issue.title}`,
    content: `${opts.commenter?.name || '담당자'}님이 댓글을 남겼습니다.\n"${opts.comment.substring(0, 100)}${opts.comment.length > 100 ? '...' : ''}"`,
    relatedIssueId: opts.issue.id,
  });
}
