const fs = require('fs')
const logger = require('../core/logger')
const { AppError, ERROR_CODES } = require('../core/errors')

function getConfig () {
  const apiKey = process.env.YOUSIGN_API_KEY
  const baseUrl = (
    process.env.YOUSIGN_BASE_URL || 'https://api-sandbox.yousign.app/v3'
  ).replace(/\/$/, '')
  return { apiKey, baseUrl }
}

/**
 * Client minimal [Yousign Public API v3](https://developers.yousign.com/docs/create-your-first-signature-request).
 * Parcours : création SR → upload PDF → signataire + champ → activation.
 */
async function apiFetch (path, { method = 'GET', jsonBody, formData } = {}) {
  const { apiKey, baseUrl } = getConfig()
  if (!apiKey) {
    throw new AppError(
      'Configuration Yousign absente (variable YOUSIGN_API_KEY)',
      ERROR_CODES.SERVICE_UNAVAILABLE.status,
      ERROR_CODES.SERVICE_UNAVAILABLE.code
    )
  }

  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
  /** @type {RequestInit} */
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json'
    }
  }

  if (formData != null) {
    opts.body = formData
  } else if (jsonBody !== undefined) {
    opts.headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(jsonBody)
  }

  const res = await fetch(url, opts)
  if (res.status === 204) {
    return {}
  }
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text }
  }

  if (!res.ok) {
    const detail =
      (data && (data.detail || data.title || data.message)) ||
      `Yousign HTTP ${res.status}`
    logger.error('yousignClient.apiFetch', new Error(detail), {
      path,
      status: res.status,
      data
    })
    const statusCode = res.status >= 500 ? 502 : 400
    throw new AppError(
      typeof detail === 'string' ? detail : JSON.stringify(detail),
      statusCode,
      ERROR_CODES.BAD_REQUEST.code
    )
  }

  return data
}

/**
 * @param {object} params
 * @param {string} params.filePath - chemin absolu du PDF
 * @param {string} params.filename
 * @param {{ first_name: string, last_name: string, email: string, locale?: string }} params.signer
 * @param {{ page?: number, x?: number, y?: number }} [params.signaturePlacement]
 * @param {string} [params.requestName]
 */
async function createAndActivateSignatureRequest ({
  filePath,
  filename,
  signer,
  signaturePlacement = {},
  requestName
}) {
  const page = signaturePlacement.page ?? 1
  const x = signaturePlacement.x ?? 120
  const y = signaturePlacement.y ?? 650

  const sr = await apiFetch('/signature_requests', {
    method: 'POST',
    jsonBody: {
      name: requestName || `AssurMoi — signature document ${filename}`,
      delivery_mode: 'email',
      timezone: 'Europe/Paris'
    }
  })

  const signatureRequestId = sr.id
  if (!signatureRequestId) {
    throw new AppError(
      'Réponse Yousign invalide (pas d’id de demande)',
      502,
      ERROR_CODES.INTERNAL_ERROR.code
    )
  }

  const fileBuffer = fs.readFileSync(filePath)
  const blob = new Blob([fileBuffer], { type: 'application/pdf' })
  const form = new FormData()
  form.append('file', blob, filename || 'document.pdf')
  form.append('nature', 'signable_document')

  const uploaded = await apiFetch(
    `/signature_requests/${signatureRequestId}/documents`,
    {
      method: 'POST',
      formData: form
    }
  )

  const documentId = uploaded.id
  if (!documentId) {
    throw new AppError(
      'Réponse Yousign invalide après upload document',
      502,
      ERROR_CODES.INTERNAL_ERROR.code
    )
  }

  const signerPayload = {
    info: {
      first_name: signer.first_name,
      last_name: signer.last_name,
      email: signer.email,
      locale: signer.locale || 'fr'
    },
    signature_level: 'electronic_signature',
    signature_authentication_mode: 'no_otp',
    fields: [
      {
        type: 'signature',
        document_id: documentId,
        page,
        x,
        y
      }
    ]
  }

  await apiFetch(`/signature_requests/${signatureRequestId}/signers`, {
    method: 'POST',
    jsonBody: signerPayload
  })

  let activated = await apiFetch(
    `/signature_requests/${signatureRequestId}/activate`,
    {
      method: 'POST'
    }
  )

  if (!activated || !activated.status) {
    activated = await apiFetch(
      `/signature_requests/${signatureRequestId}`,
      { method: 'GET' }
    )
  }

  return {
    signature_request_id: signatureRequestId,
    yousign_document_id: documentId,
    status: activated?.status,
    signers: activated?.signers,
    documents: activated?.documents,
    raw: activated
  }
}

module.exports = {
  getConfig,
  createAndActivateSignatureRequest
}
