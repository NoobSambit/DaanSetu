'use client'

export interface CreateDonationParams { ngoId: string; amount: number; cause: string; isAnonymous: boolean; campaignId?: string; initiativeId?:string }
type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }

declare global { interface Window { Razorpay?: new (options: Record<string, unknown>) => { open(): void } } }

async function loadCheckout() {
  if (window.Razorpay) return
  await new Promise<void>((resolve, reject) => { const script = document.createElement('script'); script.src = 'https://checkout.razorpay.com/v1/checkout.js'; script.onload = () => resolve(); script.onerror = () => reject(new Error('Unable to load secure checkout.')); document.head.appendChild(script) })
}

export async function createDonation(params: CreateDonationParams) {
  if (!params.campaignId) throw new Error('Choose an active campaign before donating.')
  const amountPaise = Math.round(params.amount * 100)
  if (!Number.isSafeInteger(amountPaise) || amountPaise < 1000) throw new Error('Minimum donation amount is ₹10.')
  const response = await fetch('/api/payment/create-order', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ campaignId: params.campaignId, amountPaise,initiativeId:params.initiativeId }) })
  const order = await response.json()
  if (!response.ok) throw new Error(order.error ?? 'Unable to create payment order.')
  await loadCheckout()
  return new Promise<{ donationId: string }>((resolve, reject) => {
    const RazorpayCheckout = window.Razorpay
    if (!RazorpayCheckout) return reject(new Error('Secure checkout is unavailable.'))
    const checkout = new RazorpayCheckout({ key: order.keyId, order_id: order.orderId, amount: order.amount, currency: order.currency, name: 'DaanSetu', description: 'Verified campaign donation', handler: async (payment: RazorpayResponse) => { const verified = await fetch('/api/payment/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ orderId: payment.razorpay_order_id, paymentId: payment.razorpay_payment_id, signature: payment.razorpay_signature }) }); const result = await verified.json(); if (!verified.ok) reject(new Error(result.error ?? 'Payment verification failed.')); else resolve({ donationId: result.donationId }) }, modal: { ondismiss: () => reject(new Error('Payment was cancelled.')) }, theme: { color: '#2563eb' } })
    checkout.open()
  })
}

export async function createSubscription(params: CreateDonationParams & { cadence: 'monthly'|'quarterly'|'yearly' }) {
  if (!params.campaignId) throw new Error('Choose an active campaign before donating.')
  const amountPaise=Math.round(params.amount*100); const response=await fetch('/api/payment/subscriptions',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({campaignId:params.campaignId,amountPaise,cadence:params.cadence})});const record=await response.json();if(!response.ok)throw new Error(record.error??'Unable to create recurring gift.');await loadCheckout();return new Promise<void>((resolve,reject)=>{const Checkout=window.Razorpay;if(!Checkout)return reject(new Error('Secure checkout is unavailable.'));new Checkout({key:record.keyId,subscription_id:record.gatewaySubscriptionId,name:'DaanSetu',description:`${params.cadence} recurring gift`,handler:async(payment:{razorpay_payment_id:string;razorpay_subscription_id:string;razorpay_signature:string})=>{const verified=await fetch('/api/payment/subscriptions/verify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({paymentId:payment.razorpay_payment_id,subscriptionId:payment.razorpay_subscription_id,signature:payment.razorpay_signature})});if(verified.ok)resolve();else reject(new Error('Subscription verification failed.'))},modal:{ondismiss:()=>reject(new Error('Subscription authorization was cancelled.'))},theme:{color:'#2563eb'}}).open()})
}
