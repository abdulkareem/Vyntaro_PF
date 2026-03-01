import { useEffect, useMemo, useRef, useState } from 'react'

type PinSetupInputProps = {
  value: string
  onChange: (nextValue: string) => void
  disabled?: boolean
  length?: number
}

function toDigits(value: string, length: number) {
  return value.padEnd(length, ' ').slice(0, length).split('').map(char => (char === ' ' ? '' : char))
}

export default function PinSetupInput({ value, onChange, disabled = false, length = 4 }: PinSetupInputProps) {
  const [digits, setDigits] = useState(() => toDigits('', length))
  const [firstEntry, setFirstEntry] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [inlineError, setInlineError] = useState<string | null>(null)
  const refs = useRef<Array<HTMLInputElement | null>>([])

  const currentValue = useMemo(() => digits.join(''), [digits])

  useEffect(() => {
    if (!value) {
      setDigits(toDigits('', length))
      setFirstEntry('')
      setConfirming(false)
      setInlineError(null)
    }
  }, [value, length])

  const resetDigits = () => {
    setDigits(toDigits('', length))
    window.requestAnimationFrame(() => refs.current[0]?.focus())
  }

  const updateDigits = (nextDigits: string[]) => {
    const merged = nextDigits.join('')
    setDigits(nextDigits)
    if (inlineError) setInlineError(null)

    if (merged.length !== length) return

    if (!confirming) {
      setFirstEntry(merged)
      setConfirming(true)
      onChange('')
      resetDigits()
      return
    }

    if (merged !== firstEntry) {
      setInlineError('PINs did not match. Please try again.')
      setFirstEntry('')
      setConfirming(false)
      onChange('')
      resetDigits()
      return
    }

    onChange(merged)
  }

  return (
    <div className="neo-pin-setup">
      <p className="neo-auth-sub neo-pin-helper">{confirming ? 'Re-enter PIN to confirm' : 'Enter a new 4-digit PIN'}</p>
      <div className="neo-pin-row">
        <div className="neo-pin-inputs">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={el => {
                refs.current[index] = el
              }}
              value={digit}
              disabled={disabled}
              inputMode="numeric"
              type="password"
              maxLength={1}
              onChange={e => {
                const next = e.target.value.replace(/\D/g, '').slice(-1)
                const copy = [...digits]
                copy[index] = next
                updateDigits(copy)
                if (next && index < length - 1) refs.current[index + 1]?.focus()
              }}
              onKeyDown={e => {
                if (e.key === 'Backspace' && !digits[index] && index > 0) refs.current[index - 1]?.focus()
              }}
              className="neo-pin-input"
              aria-label={`PIN digit ${index + 1}`}
            />
          ))}
        </div>
        <button
          className="neo-pin-back"
          type="button"
          onClick={() => {
            if (confirming) {
              onChange('')
              setFirstEntry('')
              setConfirming(false)
            }
            resetDigits()
          }}
          disabled={disabled || !currentValue}
          aria-label="Clear PIN"
        >
          ←
        </button>
      </div>
      {inlineError && <p className="neo-inline-error">{inlineError}</p>}
    </div>
  )
}
