interface FormLabelProps {
  children: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
}

export const FormLabel = ({ children, required, htmlFor }: FormLabelProps) => {
  return (
    <label 
      htmlFor={htmlFor}
      className="block text-sm font-semibold text-gray-700 mb-2"
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
};
