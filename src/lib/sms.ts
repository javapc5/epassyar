/**
 * In-app notification log — NOT an SMS gateway.
 *
 * Every booking event writes an `SmsLog` row in the same transaction as the
 * status change (see the booking/payment/approval routes). Those rows are the
 * audit trail AND a "messages to pass on" list the Tourism Office reads in the
 * admin panel.
 *
 * There is deliberately NO external SMS provider — the app depends on no paid
 * third-party service. Tourists see everything they need on-screen: their
 * booking code and live status at /booking/[code] and via /my-booking. If the
 * office wants to text a tourist or guide, they do it from their own phone using
 * the message text recorded in the log.
 *
 * `dispatchQueuedSms` stays as the single call-site the transition endpoints
 * already invoke, so nothing else had to change. It is now a no-op: the rows
 * simply remain in the log. If real SMS is ever needed, wire a self-hosted
 * gateway (e.g. an office Android phone + SIM running an HTTP→SMS bridge) here.
 */
export async function dispatchQueuedSms(_bookingId?: number): Promise<number> {
  return 0;
}
