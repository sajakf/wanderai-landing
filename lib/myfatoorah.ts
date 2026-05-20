/**
 * MyFatoorah payment gateway.
 *
 * Sandbox base URL : https://apitest.myfatoorah.com  (MYFATOORAH_TEST=true)
 * Sandbox portal   : https://demo.myfatoorah.com
 * Public test key  : SK_KWT_vVZlnnAqu8jRByOWaRPNId4ShzEDNt256dvnjebuyzo52dXjAfRx2ixW5umjWSUx
 *
 * Docs: https://docs.myfatoorah.com/docs/send-payment
 */

const IS_TEST  = process.env.MYFATOORAH_TEST !== 'false'
const BASE_URL = IS_TEST
  ? 'https://apitest.myfatoorah.com'
  : 'https://api.myfatoorah.com'

export interface PaymentRequest {
  customerName: string
  customerPhone: string   // digits only, e.g. "96512345678"
  amountKwd: number
  description: string
  invoiceRef: string      // your internal reference (offer ID)
  language?: 'ar' | 'en'
}

export interface PaymentResult {
  invoiceId: string
  paymentUrl: string
  isPlaceholder: boolean
}

export async function createPaymentLink(req: PaymentRequest): Promise<PaymentResult> {
  const apiKey = process.env.MYFATOORAH_API_KEY

  // No key → return a clearly labelled test placeholder
  if (!apiKey || apiKey.startsWith('TODO')) {
    const fakeId = `TEST-${req.invoiceRef.slice(0, 8).toUpperCase()}`
    return {
      invoiceId:     fakeId,
      paymentUrl:    `https://apitest.myfatoorah.com/ar/KWT/pay?ref=${fakeId}`,
      isPlaceholder: true,
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://thewanderlust.app'
  const phone  = req.customerPhone.replace(/\D/g, '')

  const body = {
    NotificationOption:  'LNK',
    CustomerName:        req.customerName,
    MobileCountryCode:   '+965',
    CustomerMobile:      phone.slice(-8),
    CustomerEmail:       `${phone}@wa.wanderai.app`,
    InvoiceValue:        req.amountKwd,
    DisplayCurrencyIso:  'KWD',
    CallBackUrl:         `${appUrl}/api/payments/callback`,
    ErrorUrl:            `${appUrl}/api/payments/error`,
    Language:            req.language === 'ar' ? 'ar' : 'en',
    CustomerReference:   req.invoiceRef,
    InvoiceItems: [
      { ItemName: req.description, Quantity: 1, UnitPrice: req.amountKwd },
    ],
  }

  const res = await fetch(`${BASE_URL}/v2/SendPayment`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  const json = await res.json()
  if (!res.ok || !json.IsSuccess) {
    throw new Error(`MyFatoorah: ${json.Message ?? res.statusText}`)
  }

  return {
    invoiceId:     String(json.Data.InvoiceId),
    paymentUrl:    json.Data.InvoiceURL,
    isPlaceholder: false,
  }
}

export async function verifyPayment(
  invoiceId: string
): Promise<{ paid: boolean; status: string }> {
  const apiKey = process.env.MYFATOORAH_API_KEY
  if (!apiKey || apiKey.startsWith('TODO')) return { paid: false, status: 'TEST_MODE' }

  const res = await fetch(`${BASE_URL}/v2/GetPaymentStatus`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ Key: invoiceId, KeyType: 'InvoiceId' }),
  })

  const json = await res.json()
  return {
    paid:   json.Data?.InvoiceStatus === 'Paid',
    status: json.Data?.InvoiceStatus ?? 'Unknown',
  }
}
