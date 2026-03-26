const nodemailer = require('nodemailer')

/** @type {import('nodemailer').Transporter | null} */
let transporter = null

function isConsoleMode () {
  return (process.env.MAIL_BACKEND || '').toLowerCase() === 'console'
}

function smtpOptions () {
  const port = Number(process.env.SMTP_PORT || 587)
  const secure =
    process.env.SMTP_SECURE === 'true' || (!process.env.SMTP_SECURE && port === 465)

  const options = {
    host: process.env.SMTP_HOST || 'localhost',
    port,
    secure
  }

  if (process.env.SMTP_USER) {
    options.auth = {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS || ''
    }
  }

  if (process.env.SMTP_REJECT_UNAUTHORIZED === 'false') {
    options.tls = { rejectUnauthorized: false }
  }

  return options
}

function getTransporter () {
  if (!transporter) {
    transporter = nodemailer.createTransport(smtpOptions())
  }
  return transporter
}

function normalizePayload ({ to, subject, text, html, replyTo, from }) {
  if (!to || !subject) {
    throw new Error('sendMail: "to" et "subject" requis')
  }
  if (!text && !html) {
    throw new Error('sendMail: fournir "text" ou "html"')
  }

  const defaultFrom = process.env.MAIL_FROM || process.env.SMTP_USER
  if (!from && !defaultFrom) {
    throw new Error('sendMail: MAIL_FROM ou SMTP_USER requis')
  }

  const mail = {
    from: from || defaultFrom,
    to: Array.isArray(to) ? to.join(', ') : String(to),
    subject: String(subject)
  }
  if (text) mail.text = text
  if (html) mail.html = html
  if (replyTo) mail.replyTo = replyTo
  return mail
}

function logToConsole (mail) {
  const urls = `${mail.text || ''} ${mail.html || ''}`.match(/https?:\/\/[^\s<>"']+/gi) || []
  const unique = [...new Set(urls)]
  console.log(
    [
      '[mail:console]',
      `  From: ${mail.from}`,
      `  To: ${mail.to}`,
      `  Subject: ${mail.subject}`,
      ...(unique.length ? ['  Liens:', ...unique.map((u) => `    ${u}`)] : []),
      ...(mail.text ? ['  ---', mail.text] : []),
      ...(mail.html ? ['  --- html ---', mail.html] : [])
    ].join('\n')
  )
}

/**
 * @param {{ to: string|string[], subject: string, text?: string, html?: string, replyTo?: string, from?: string }} options
 */
async function sendMail (options) {
  const mail = normalizePayload(options)

  if (isConsoleMode()) {
    logToConsole(mail)
    return {
      messageId: `<console-${Date.now()}@local>`,
      accepted: [mail.to],
      rejected: []
    }
  }

  return getTransporter().sendMail(mail)
}

async function verifySmtp () {
  if (isConsoleMode()) return
  await getTransporter().verify()
}

module.exports = { sendMail, verifySmtp, getTransporter, isConsoleMode }
