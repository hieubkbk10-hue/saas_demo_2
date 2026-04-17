import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getConvexClient } from '@/lib/convex';
import { api } from '@/convex/_generated/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toSafeString = (value: unknown) => (typeof value === 'string' ? value : '');

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const to = String(body?.to ?? '').trim();
    const subject = String(body?.subject ?? '').trim();
    const html = String(body?.html ?? '').trim();

    if (!EMAIL_REGEX.test(to)) {
      return NextResponse.json({ message: 'Email nhận không hợp lệ.' }, { status: 400 });
    }
    if (!subject) {
      return NextResponse.json({ message: 'Tiêu đề email không hợp lệ.' }, { status: 400 });
    }
    if (!html) {
      return NextResponse.json({ message: 'Nội dung email không hợp lệ.' }, { status: 400 });
    }

    const client = getConvexClient();
    const settings = await client.query(api.settings.getMultiple, {
      keys: [
        'mail_host',
        'mail_port',
        'mail_username',
        'mail_password',
        'mail_encryption',
        'mail_from_email',
        'mail_from_name',
      ],
    });

    const host = toSafeString(settings.mail_host).trim();
    const portValue = Number(settings.mail_port ?? 0);
    const username = toSafeString(settings.mail_username).trim();
    const password = toSafeString(settings.mail_password).trim();
    const encryption = toSafeString(settings.mail_encryption).trim();
    const fromEmail = toSafeString(settings.mail_from_email).trim();
    const fromName = toSafeString(settings.mail_from_name).trim();

    if (!host || !portValue || !username || !password || !fromEmail) {
      return NextResponse.json({ message: 'Thiếu cấu hình SMTP bắt buộc.' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host,
      port: portValue,
      secure: encryption === 'ssl',
      auth: { user: username, pass: password },
    });

    await transporter.sendMail({
      from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
      to,
      subject,
      html,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: 'Gửi email test thất bại.' }, { status: 500 });
  }
}
