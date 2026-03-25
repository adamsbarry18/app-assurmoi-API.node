const nodemailer = require('nodemailer')

let transporter

function buildTransportOptions () {
  const port = Number(process.env.SMTP_PORT || 587)
  const secure =
    process.env.SMTP_SECURE === 'true' || (!process.env.SMTP_SECURE && port === 465)

  const opts = {
    host: process.env.SMTP_HOST || 'localhost',
    port,
    secure
  }

  if (process.env.SMTP_USER) {
    opts.auth = {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS || ''
    }
  }

  if (process.env.SMTP_REJECT_UNAUTHORIZED === 'false') {
    opts.tls = { rejectUnauthorized: false }
  }

  return opts
}

function getTransporter () {
  if (!transporter) {
    transporter = nodemailer.createTransport(buildTransportOptions())
  }
  return transporter
}

/** Envoie un message (texte et/ou HTML). `from` par défaut : MAIL_FROM ou SMTP_USER. */
async function sendMail (options) {
  const { to, subject, text, html, replyTo, from } = options || {}

  if (!to || !subject) {
    throw new Error('sendMail: champs "to" et "subject" requis')
  }
  if (!text && !html) {
    throw new Error('sendMail: fournir au moins "text" ou "html"')
  }

  const defaultFrom = process.env.MAIL_FROM || process.env.SMTP_USER
  if (!from && !defaultFrom) {
    throw new Error('sendMail: définir MAIL_FROM ou SMTP_USER dans l’environnement')
  }

  const payload = {
    from: from || defaultFrom,
    to: Array.isArray(to) ? to.join(', ') : String(to),
    subject: String(subject)
  }

  if (text) payload.text = text
  if (html) payload.html = html
  if (replyTo) payload.replyTo = replyTo

  return getTransporter().sendMail(payload)
}

/**
 * Vérifie la connexion SMTP (utile au démarrage ou en healthcheck).
 */
async function verifySmtp () {
  await getTransporter().verify()
}

module.exports = {
  sendMail,
  verifySmtp,
  getTransporter
}
