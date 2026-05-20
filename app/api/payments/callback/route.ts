export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyPayment }             from '@/lib/myfatoorah'
import { updateOfferStage }          from '@/lib/db'
import { wa }                        from '@/lib/wa-client'

/**
 * MyFatoorah redirects the customer here after payment.
 * We verify the payment, mark the offer as paid, and notify the agent.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const paymentId  = searchParams.get('paymentId') ?? ''
  const invoiceRef = searchParams.get('Id') ?? ''  // MyFatoorah passes invoice ref as Id

  try {
    const { paid, status } = await verifyPayment(paymentId || invoiceRef)

    if (paid) {
      // invoiceRef is the offer ID we passed as CustomerReference
      if (invoiceRef) {
        await updateOfferStage(invoiceRef, 'paid', {
          paidAt: new Date().toISOString(),
        })
      }

      // Emit to admin SSE so dashboard updates in real time
      wa.emitter.emit('payment', { invoiceRef, status: 'paid' })
    }
  } catch (err) {
    console.error('[WanderAI] Payment callback error:', err)
  }

  // Redirect customer to a thank-you page (or back to WhatsApp)
  return NextResponse.redirect(new URL('/?payment=success', req.url))
}
