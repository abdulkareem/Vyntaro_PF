import { countryDialCodes } from '../../lib/countryDialCodes'

type CountrySelectProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

export default function CountrySelect({ value, onChange, disabled = false, className = 'neo-control' }: CountrySelectProps) {
  return (
    <select className={className} value={value} onChange={e => onChange(e.target.value)} disabled={disabled}>
      {countryDialCodes.map(country => (
        <option key={`${country.code}-${country.dial}`} value={country.dial}>
          {country.name} ({country.dial})
        </option>
      ))}
    </select>
  )
}
