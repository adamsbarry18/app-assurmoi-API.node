const nodemailer = require('nodemailer')

let transporter = null


// Permet d’envoyer des emails en utilisant un transporteur SMTP configuré via les variables d’environnement, ou de les logguer en console pour le développement
function isConsoleMode () {
  return (process.env.MAIL_BACKEND || '').toLowerCase() === 'console'
}

// Configure le transporteur SMTP en fonction des variables d’environnement, avec support pour les connexions sécurisées et l’authentification
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

// Initialise et retourne un transporteur nodemailer, en le créant à la première utilisation (singleton)
function getTransporter () {
  if (!transporter) {
    transporter = nodemailer.createTransport(smtpOptions())
  }
  return transporter
}

function logToConsole (mail) {
  const raw = `${mail.text || ''} ${mail.html || ''}`
  const links = [...new Set(raw.match(/https?:\/\/[^\s<>"']+/gi) || [])]
  const preview = (mail.text || mail.html?.replace(/<[^>]+>/g, ' ') || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100)
  const tail = links.length ? links.join(' ') : preview
  console.log('[mail:console]', [mail.from, mail.to, mail.subject, tail].filter(Boolean).join(' | '))
}

/**
 * Envoie un email en utilisant le transporteur configuré, ou en le loggant en console si en mode développement.
 * @param {{ to: string|string[], subject: string, text?: string, html?: string, replyTo?: string, from?: string }} options
 */
async function sendMail (options) {
  const mail = {
    from: options.from || process.env.MAIL_FROM,
    to: Array.isArray(options.to) ? options.to.join(', ') : String(options.to),
    subject: String(options.subject),
    ...(options.text && { text: options.text }),
    ...(options.html && { html: options.html }),
    ...(options.replyTo && { replyTo: options.replyTo })
  }

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

async function mailForgotPassword (user, webLink, mobileLink) {
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ')
  const to = name ? `${name} <${user.email}>` : user.email
  const greeting = user.first_name ? `Bonjour ${user.first_name}` : 'Bonjour'

  const textBody = mobileLink
    ? `${greeting},\n\nNavigateur (web) : ${webLink}\n\nApplication mobile (ouvrez sur l’appareil où l’app est installée) : ${mobileLink}\n\nCes liens expirent sous peu.`
    : `${greeting},\n\nPour réinitialiser votre mot de passe : ${webLink}\n\nCe lien expire sous peu.`

  const htmlBody = mobileLink
    ? `<p>${greeting},</p><p>Navigateur : <a href="${webLink}">Réinitialiser mon mot de passe</a></p><p>Application mobile : <a href="${mobileLink}">Ouvrir dans l’app AssurMoi</a></p><p><small>Ces liens expirent sous peu.</small></p>`
    : `<p>${greeting},</p><p><a href="${webLink}">Réinitialiser mon mot de passe</a></p><p><small>Ce lien expire sous peu.</small></p>`

  return sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: 'AssurMoi — réinitialisation du mot de passe',
    text: textBody,
    html: htmlBody
  })
}

async function mailInvitation ({ email, role, link }) {
  return sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: 'AssurMoi — invitation',
    text: `Vous êtes invité avec le rôle ${role}. Créez votre compte : ${link}`,
    html: `<p>Vous êtes invité (<strong>${role}</strong>).</p><p><a href="${link}">Créer mon compte</a></p>`
  })
}

async function mailLogin (user) {
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ')
  const to = name ? `${name} <${user.email}>` : user.email
  const who = user.first_name || 'vous'

  try {
    await sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject: 'AssurMoi — connexion',
      text: `Bonjour ${who},\n\nUne nouvelle connexion a été effectuée sur votre compte.`,
      html: `<p>Bonjour ${who},</p><p>Une nouvelle connexion a été effectuée sur votre compte.</p>`
    })
    return true
  } catch (err) {
    console.error('[mail:login]', err.message || err)
    return false
  }
}

module.exports = {
  sendMail,
  mailLogin,
  mailForgotPassword,
  mailInvitation
}
