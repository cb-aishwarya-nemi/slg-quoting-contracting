import {
  AccountCustomerPicker,
  type AccountCustomerPickerProps,
} from './AccountCustomerPicker'

/**
 * Isolated exploration surface for the next Account picker.
 *
 * It intentionally begins as a visual/behavioral copy of the current picker.
 * Replace this implementation while exploring V2; existing variants continue
 * importing AccountCustomerPicker directly and cannot be affected.
 */
export function AccountCustomerPickerV2(props: AccountCustomerPickerProps) {
  return <AccountCustomerPicker {...props} />
}

export default AccountCustomerPickerV2
