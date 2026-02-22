import { prisma } from '../config/prisma.js'
import { HttpError } from '../utils/httpError.js'

export async function postDoubleEntry({ userId, debitAccountId, creditAccountId, amountMinor, currency, referenceId, referenceType, description, transactionDate = new Date(), meta }) {
  if (debitAccountId === creditAccountId) {
    throw new HttpError(400, 'Debit and credit accounts cannot be identical')
  }
  if (BigInt(amountMinor) <= 0n) {
    throw new HttpError(400, 'Amount must be positive')
  }

  return prisma.$transaction(async (tx) => {
    const [debit, credit] = await Promise.all([
      tx.ledgerAccount.findUnique({ where: { id: debitAccountId } }),
      tx.ledgerAccount.findUnique({ where: { id: creditAccountId } })
    ])

    if (!debit || !credit) throw new HttpError(404, 'Ledger account not found')
    if (debit.currency !== currency || credit.currency !== currency) {
      throw new HttpError(400, 'Currency mismatch across ledger accounts')
    }

    return tx.ledgerEntry.create({
      data: {
        userId,
        debitAccountId,
        creditAccountId,
        amountMinor: BigInt(amountMinor),
        currency,
        referenceId,
        referenceType,
        description,
        transactionDate,
        meta
      }
    })
  })
}

export async function getTrialBalance({ userId, startDate, endDate }) {
  const entries = await prisma.ledgerEntry.findMany({
    where: {
      userId,
      transactionDate: {
        gte: startDate,
        lte: endDate
      }
    }
  })

  const totals = entries.reduce((acc, entry) => {
    const amount = BigInt(entry.amountMinor)
    acc.debits += amount
    acc.credits += amount
    return acc
  }, { debits: 0n, credits: 0n })

  if (totals.debits !== totals.credits) {
    throw new HttpError(500, 'Ledger out of balance detected')
  }

  return totals
}
