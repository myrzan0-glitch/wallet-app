# Payments plan: getting ticket money to organizers

*Status: planning. Last updated 2026-10-11. Not legal or tax advice. Every rate and rule below must be confirmed with an Uzbek lawyer and accountant before money flows (see §7).*

## 1. The question

Most club organizers are **private individuals without a legal entity**. Two ideas:

1. Attendees pay **our ООО/ИП**; we pay organizers and keep a fee.
2. We become the **bridge** between attendee payments and unregistered organizers:
   attendee → our legal entity → organizer, paid under a ГПХ (civil-law) contract.

### How Luma does it, and what maps to Uzbekistan

Luma never touches the money.

- Each organizer connects their own **Stripe** account (Stripe Connect).
- Stripe is the licensed payment company: it verifies the organizer and pays them out within about 2 days in the US.
- Luma's fee (5%, or 0% on Luma Plus) and Stripe's fee are deducted automatically from each payment.

In the US, an organizer can be a private person because a person selling something is automatically a sole proprietor. They just report the income on their tax return, and Stripe sends the tax form (1099-K).

Neither part exists here:

- Stripe doesn't operate in Uzbekistan.
- Regular income from selling needs a registration (ИП or самозанятый).

The local equivalent is a **licensed payment company that splits payments** (stand-in for Stripe Connect) plus **organizers registered as самозанятый** (stand-in for the US sole proprietor). That is model A below.

## 2. Rules that shape the answer

| Rule | Consequence |
|---|---|
| **Law ЗРУ-578 "On payments and payment systems" (2019):** providing payment services needs a Central Bank licence. Payment agents and sub-agents are exempt only with an agent contract with a bank or licensed payment organization. | We can't simply **receive money for someone else and forward it**. That is a payment service. |
| **Acquiring contracts** (Payme, Click, banks) let a merchant take payments for **its own** goods and services. | If our ООО takes the money, the ticket must be **our sale**, or a sale we make as a documented agent. |
| **ГПХ with an individual:** the customer is the tax agent. It withholds **НДФЛ 12%** and pays **social tax** on top from its own funds (Tax Code art. 371, 403). Payments to an **ИП** under ГПХ have no withholding. | Paying unregistered organizers through ГПХ costs about **a quarter** of what we pay them. |
| **Self-employed (самозанятые) from 2026:** the activity list shrinks from 104 to 72. Tax is a **1% turnover tax from the first so'm** (up to 1 bn so'm a year). ИП get the same 1% regime. Registration is free and done online. | A registered organizer costs **1%** instead of about 24%. Helping organizers register is the cheapest bridge. |
| **Our own ООО** pays turnover tax on its revenue, typically 4% (*confirm*). Above the turnover threshold (1 bn so'm a year, *confirm*) it moves to **VAT 12% + profit tax**. | If whole ticket prices count as our revenue, we hit the threshold after about 10,000 tickets of 100k. After that, VAT applies to the **full** ticket price. |

## 3. The idea, made legal

Idea 1, "money to us, we pay organizers", works only in one of these shapes. Never as a plain transit of money.

### Model B: we are the seller ("bridge", idea 2)

Our ООО sells the event as **its own service**. The organizer is our **contractor**: they host the session for us.

- The fiscal receipt is ours, for the full amount, with our ИКПУ code for event services.
- We are responsible to attendees: refunds, cancelled events, complaints.
- We pay the organizer under a contract and an act of work done, per event or monthly.
  - **B1, unregistered individual (ГПХ):** we withhold НДФЛ 12% and pay social tax. Expensive, and frequent recurring ГПХ with the same person risks being reclassified as employment.
  - **B2, organizer registered as самозанятый or ИП:** a services contract, no withholding. They pay their own 1%.
- **Works:** legally clean, today, with our own Payme/Click merchant account. No licence and no third-party KYC.
- **Payout tooling:** ATMOS offers acquiring plus **ATMOS.PAYOUT**, which pays out to individuals' Uzcard/Humo cards by API from a deposit account we top up from our bank account. It is used by taxi fleets, couriers and freelance platforms.
  - This automates the money movement.
  - It does **not** change the legal basis or taxes: each payout still needs a contract (ГПХ, or with a самозанятый/ИП) and the matching withholding.
- **Watch:** full ticket revenue is ours, so the turnover threshold arrives fast and then VAT applies to the full price. We also carry the refund and event risk.

### Model C: we are the organizer's agent (commission contract)

Our ООО sells tickets **on behalf of** the organizer and keeps a commission. Only the commission is our revenue.

- The organizer must be registered: ИП, самозанятый or ООО. An unregistered individual can't be a principal in a business.
- **Lawyer question:** does an agent receiving money for a principal count as a payment service under ЗРУ-578? Does our Payme/Click contract allow an agent scheme?
- **Works:** no VAT on the full ticket price.
- **Watch:** only usable once the legal questions are answered.

### Model A: licensed provider splits the payment

A licensed payment organization (ATMOS advertises "payment splits", and Payme mentions distributing payments to partners) takes the attendee's payment. It splits it between the organizer (a sub-merchant) and us.

- Sub-merchants need KYC, and most likely ИП or самозанятый status.
- **Works:** the cleanest at scale, and the provider handles payouts.
- **Watch:** needs a contract, fees and onboarding. Still requires registered organizers.

## 4. What the organizer gets from a 100,000 so'm ticket

Illustrative only. Assumes a 10% platform fee, about 1.5% acquiring, 4% turnover tax for our ООО and 12% social tax. **All rates to confirm.**

| | Stage 0: paid directly (today) | B1: we sell, organizer on ГПХ | B2: we sell, organizer самозанятый/ИП | A or C: split / agent |
|---|---|---|---|---|
| Acquiring | organizer's own | 1,500 | 1,500 | ~2,000 |
| Our turnover tax | none | 4,000 (on full price) | 4,000 (on full price) | 400 (on our fee only) |
| Our fee | subscription instead | 10,000 | 10,000 | 10,000 |
| Paid out for the organizer | 100,000 | 84,500 = 75,446 gross + 9,054 social tax | 84,500 | 88,000 |
| Organizer's own tax | — | НДФЛ 9,054 withheld | 1% ≈ 845 | 1% ≈ 880 |
| **Organizer receives** | **100,000** (untaxed, informal) | **≈ 66,400 (66%)** | **≈ 83,650 (84%)** | **≈ 87,100 (87%)** |

**Takeaway:** the bridge through ГПХ (B1) is legal but takes about a third of the ticket, and organizers who are used to 100% will refuse it. The bridge that works is **helping organizers register as самозанятый or ИП** (B2, then A/C). Registration is free, online and costs them 1%.

## 5. Recommendation

1. **Pilot: stage 0.** Organizers are paid directly to their own Payme/Click link or card. We verify payments, issue tickets and handle check-in. We charge a flat subscription, invoiced to the organizer. No licence, no tax exposure, no payout risk. Get a lawyer opinion in parallel.
2. **"Get paid through us": model B2.**
   - Our ООО is the seller with its own Payme/Click merchant account.
   - Organizers sign a services contract as самозанятый or ИП. Onboarding includes a step-by-step "register as self-employed in the Soliq app", checking their activity is on the 72-item list.
   - Payout after the event (T+1), so refunds for cancelled events can be covered.
   - ГПХ (B1) only as a rare exception, with the real net amount shown to the organizer before they agree.
3. **Before about 1 bn so'm of yearly ticket sales: move to A or C**, so only our commission is our revenue. Talk to ATMOS, Payme and Click about split payments now, so it's ready.

## 6. What this means for the product

- **Payout ledger:** every ticket records gross, acquiring fee, our fee, tax and organizer net. Payouts happen per event after it ends. The organizer sees a statement, and we generate the act of work done.
- **Organizer onboarding fields** (for B2/A/C): legal status, ПИНФЛ/ИНН, self-employed or ИП certificate, payout card or account, signed contract (accepted online).
- **Fiscal receipts:** in B, we issue them through our Payme/Click merchant account with our ИКПУ code. In A/C, the organizer or provider does.
- **Refund rules:** event cancelled → full refund. Attendee cancels → organizer's policy. Refunds happen before payout, so money is never clawed back from organizers.

## 7. Questions for a lawyer and an accountant

1. Under ЗРУ-578, is model C (commission agent receiving ticket money for the organizer) a payment service needing a licence? Is model B safe as long as we are the real seller?
2. Is "organizing a language-club session" on the 2026 list of 72 self-employed activities? If not, what is the closest one, or must they register as ИП?
3. When our ООО pays a самозанятый, are we a tax agent? What document do we need from them (a check from the Soliq app)?
4. Current rates for our ООО: turnover tax on event services, the threshold for moving to VAT, social tax on ГПХ payments.
5. The ИКПУ code for selling event participation, and fiscal receipt requirements for online ticket sales.
6. Does recurring ГПХ with the same organizer risk reclassification as employment, and how do we draft around it?
7. Consumer-protection duties if we are the seller: refunds, cancelled events, offer terms on the site.

## 8. Questions for Payme, Click and ATMOS

1. Do you support **split payments** between a platform and sub-merchants? Fees?
2. Can sub-merchants be **самозанятые**? What KYC is needed?
3. Payout timing, and refunds after a split.
4. Does your merchant agreement allow us to sell **as an agent** (model C)?
5. Who issues fiscal receipts in a split setup?
