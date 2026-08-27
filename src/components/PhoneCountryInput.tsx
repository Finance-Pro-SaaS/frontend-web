import { useState } from 'react'
import {
  OHADA_COUNTRIES,
  findCountryByName,
  type OhadaCountry,
} from '../data/ohadaCountries'

import { COUNTRY_FLAGS } from '../data/countryFlags'

interface PhoneCountryInputProps {
  countryName: string
  onCountryChange: (name: string) => void
  phoneDigits: string
  onPhoneDigitsChange: (digits: string) => void
  required?: boolean
}

export function PhoneCountryInput({
  countryName,
  onCountryChange,
  phoneDigits,
  onPhoneDigitsChange,
  required,
}: PhoneCountryInputProps) {
  const [open, setOpen] = useState(false)

  const country: OhadaCountry =
    findCountryByName(countryName) ?? OHADA_COUNTRIES[0]

  //const flagSrc = COUNTRY_FLAGS[country.iso]

  function handlePhoneChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const digitsOnly = e.target.value
      .replace(/\D/g, '')
      .slice(0, country.phoneDigits)

    onPhoneDigitsChange(digitsOnly)
  }

  function handleCountryChange(next: OhadaCountry) {
    onCountryChange(next.name)

    onPhoneDigitsChange(
      phoneDigits.slice(0, next.phoneDigits),
    )

    setOpen(false)
  }

  function Flag({
    country: flagCountry,
    className = 'w-6 h-4',
  }: {
    country: OhadaCountry
    className?: string
  }) {
    const src = COUNTRY_FLAGS[flagCountry.iso]

    if (!src) {
      return (
        <span
          className={`${className} inline-block rounded-sm bg-slate-200`}
          aria-hidden="true"
        />
      )
    }

    return (
      <img
        src={src}
        alt={flagCountry.name}
        className={`${className} object-cover rounded-sm shrink-0`}
      />
    )
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        Pays et téléphone
      </label>

      <div className="grid grid-cols-[9.5rem_1fr] gap-2">

        {/* Sélecteur pays */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="w-full h-[38px] rounded-md border border-slate-300 bg-white px-2 text-sm flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <span className="flex items-center gap-2 min-w-0">
              <Flag country={country} />

              <span className="truncate">
                +{country.dialCode}
              </span>
            </span>

            <span className="text-slate-400 text-xs">
              {open ? '▲' : '▼'}
            </span>
          </button>

          {open && (
            <div className="absolute z-50 mt-1 w-64 max-h-64 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
              {OHADA_COUNTRIES.map((c) => (
                <button
                  key={c.iso}
                  type="button"
                  onClick={() => handleCountryChange(c)}
                  className={`w-full px-3 py-2 flex items-center gap-3 text-sm text-left hover:bg-slate-50 ${
                    c.iso === country.iso
                      ? 'bg-slate-100'
                      : ''
                  }`}
                >
                  <Flag
                    country={c}
                    className="w-7 h-5"
                  />

                  <span className="flex-1">
                    {c.name}
                  </span>

                  <span className="text-slate-500">
                    +{c.dialCode}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Numéro */}
        <input
          type="tel"
          inputMode="numeric"
          required={required}
          value={phoneDigits}
          onChange={handlePhoneChange}
          placeholder={`${country.phoneDigits} chiffres`}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>

      <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
        <Flag
          country={country}
          className="w-4 h-3"
        />

        <span>
          {countryName} — {phoneDigits.length}/
          {country.phoneDigits} chiffres
        </span>

        {phoneDigits.length > 0 &&
          phoneDigits.length < country.phoneDigits && (
            <span className="text-amber-600">
              · incomplet
            </span>
          )}
      </p>
    </div>
  )
}