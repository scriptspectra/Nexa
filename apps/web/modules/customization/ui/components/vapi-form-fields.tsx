import { UseFormReturn } from "react-hook-form";
import { useVapiAssistants, useVapiPhoneNumbers } from "@/modules/plugins/hooks/use-vapi-data";
import { FormSchema } from "../../types";

interface VapiFormFieldsProps {
  form: UseFormReturn<FormSchema>;
};

export const VapiFormFields = ({
  form,
}: VapiFormFieldsProps) => {
  const { data: assistants, isLoading: assistantsLoading } = useVapiAssistants();
  const { data: phoneNumbers, isLoading: phoneNumbersLoading } = useVapiPhoneNumbers();

  const disabled = form.formState.isSubmitting;

  return (
    <>
      <div>
        <label className="block text-label-sm font-label-sm text-on-surface-variant mb-base">Assistant Profile</label>
        <select 
          className="w-full bg-black border border-outline-variant p-sm text-body-sm font-label-md rounded appearance-none focus:border-primary transition-colors focus:outline-none disabled:opacity-50"
          disabled={assistantsLoading || disabled}
          {...form.register("vapiSettings.assistantId")}
        >
          <option value="none">{assistantsLoading ? "Loading..." : "Select an assistant"}</option>
          {assistants?.map((assistant) => (
            <option key={assistant.id} value={assistant.id}>
              {assistant.name || "Unnamed Assistant"} - {assistant.model?.model || "Unknown model"}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-label-sm font-label-sm text-on-surface-variant mb-base">Display Phone Number</label>
        <select 
          className="w-full bg-black border border-outline-variant p-sm text-body-sm font-label-md rounded appearance-none focus:border-primary transition-colors focus:outline-none disabled:opacity-50"
          disabled={phoneNumbersLoading || disabled}
          {...form.register("vapiSettings.phoneNumber")}
        >
          <option value="none">{phoneNumbersLoading ? "Loading..." : "Select a phone number"}</option>
          {phoneNumbers?.map((phone) => (
            <option key={phone.id} value={phone.number || phone.id}>
              {phone.number || "Unknown"} - {phone.name || "Unnamed"}
            </option>
          ))}
        </select>
      </div>
    </>
  )
};