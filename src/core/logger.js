const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 }

const minLevel =
  LEVELS[(process.env.LOG_LEVEL || 'info').toLowerCase()] ?? LEVELS.info

function shouldLog (level) {
  if (level === 'error') return true
  return LEVELS[level] <= minLevel
}

function serializeError (err) {
  if (!(err instanceof Error)) return err
  const o = { name: err.name, message: err.message }
  if (process.env.NODE_ENV !== 'production') {
    o.stack = err.stack
  }
  return o
}

function line (level, msg, meta = {}) {
  if (!shouldLog(level)) return
  const payload = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...meta
  }
  const str = JSON.stringify(payload)
  if (level === 'error') console.error(str)
  else if (level === 'warn') console.warn(str)
  else console.log(str)
}

function error (msg, err, meta = {}) {
  const extra = { ...meta }
  if (err) extra.error = serializeError(err)
  line('error', msg, extra)
}

function warn (msg, meta) {
  line('warn', msg, meta)
}

function info (msg, meta) {
  line('info', msg, meta)
}

function debug (msg, meta) {
  line('debug', msg, meta)
}

/**
 * Une ligne lisible en console (sans JSON), pour les logs type access HTTP.
 */
function plain (level, message) {
  if (!shouldLog(level)) return
  const ts = new Date().toISOString()
  const lvl = level.toUpperCase().padEnd(5)
  const out = `[${ts}] ${lvl} ${message}`
  if (level === 'error') console.error(out)
  else if (level === 'warn') console.warn(out)
  else console.log(out)
}

module.exports = { error, warn, info, debug, plain, serializeError }
