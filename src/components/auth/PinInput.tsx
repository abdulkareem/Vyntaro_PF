import { useEffect, useMemo, useRef, useState } from 'react'

type PinInputProps = {
  value: string
  onChange: (nextValue: string) => void
  disabled?: boolean
  length?: number
}

function toDigits(value: string, length: number) {
  return value.padEnd(length, ' ').slice(0, length).split('').map(char => (char === ' ' ? '' : char))
}

export default function PinInput({ value, onChange, disabled = false, length = 4 }: PinInputProps) {
  const [digits, setDigits] = useState(() => toDigits(value, length))
  const refs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    setDigits(toDigits(value, length))
  }, [value, length])

  const currentValue = useMemo(() => digits.join(''), [digits])

  const updateDigits = (nextDigits: string[]) => {
    setDigits(nextDigits)
    onChange(nextDigits.join(''))
  }

  return (
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
          />
        ))}
      </div>
      <button
        className="neo-pin-back"
        type="button"
        onClick={() => {
          const reset = Array.from({ length }, () => '')
          updateDigits(reset)
          refs.current[0]?.focus()
        }}
        disabled={disabled || !currentValue}
        aria-label="Clear PIN"
      >
        ←
      </button>
    </div>
  )
}
