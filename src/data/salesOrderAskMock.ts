export const KICKOFF_PROMPT = 'Prep me for the kick-off call'

export type AskResponse =
  | { kind: 'kickoff' }
  | { kind: 'markdown'; title: string; body: string }

export const ASK_RESPONSES: Record<string, AskResponse> = {
  [KICKOFF_PROMPT]: { kind: 'kickoff' },
  "What's the story of this deal?": {
    kind: 'markdown',
    title: 'Deal story · Pioneer Systems',
    body: 'Pioneer came in as a net-new logo on May 1 through Q-2026-1847. They signed a 36-month Apex Growth package with a gentle two-step ramp — Year 1 at $41K/quarter climbing to $43,050 in Year 2 — totaling $492K TCV. First invoice is already out the door. Relationship is brand new: no prior Chargebee history, so this kickoff sets the tone for the whole account.',
  },
  'What exactly did we commit to Pioneer?': {
    kind: 'markdown',
    title: 'Commitments · Pioneer Systems',
    body: 'Apex platform Growth · 50 seats · Premium support SLA (4-hour response) · 3 sandbox environments · Quarterly billing with 2 ramp periods over 36 months · Manual renewal in Jul 2029 · Source contract MSA_2026_PS_001.pdf. Seat and sandbox entitlements are live; auto-collection is on, invoice closure is manual, and tax exemption is applied.',
  },
  "What can't wait this week?": {
    kind: 'markdown',
    title: 'This week · Priority actions',
    body: '1) Confirm Pioneer received and expects the $41K first invoice (due timing around May 31). 2) Lock a named platform admin before anything else stalls provisioning. 3) Align who gets the first sandbox and for what use case. 4) Schedule the Month 3 QBR while kickoff energy is high — manual renewal means you own the next conversation.',
  },
}
