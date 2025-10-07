import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import clsx from 'clsx';

interface PhoneInputComponentProps {
  value: string;
  onChange: (phone: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  testId?: string;
}

export const PhoneInputComponent = ({
  value,
  onChange,
  label,
  placeholder = "Entrez votre numéro",
  error,
  required = false,
  disabled = false,
  testId,
}: PhoneInputComponentProps) => {
  const handleChange = (phone: string) => {
    const cleanedPhone = phone.replace(/\s/g, '');
    const phoneWithPlus = cleanedPhone.startsWith('+') ? cleanedPhone : `+${cleanedPhone}`;
    onChange(phoneWithPlus);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <PhoneInput
        country={'fr'}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        containerClass="w-full"
        inputClass={clsx(
          "w-full !py-4 !pl-16 !pr-4 !text-lg !border-gray-300 !rounded-xl focus:!border-primary-bolt-500 focus:!ring-2 focus:!ring-primary-bolt-500/20",
          error && "!border-red-500 focus:!border-red-500 focus:!ring-red-500/20"
        )}
        buttonClass="!border-gray-300 !bg-gray-50 !rounded-l-xl hover:!bg-gray-100"
        dropdownClass="!text-lg"
        enableSearch
        searchPlaceholder="Rechercher un pays..."
        disableSearchIcon={false}
        countryCodeEditable={false}
        preferredCountries={['fr', 'be', 'ch', 'ca', 'ma', 'tn', 'dz']}
        data-testid={testId}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      <p className="mt-1 text-xs text-gray-500">
        Format international avec indicatif pays
      </p>
    </div>
  );
};
