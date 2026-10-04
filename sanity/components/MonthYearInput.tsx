import { TextInput } from '@sanity/ui'
import { set, unset, type StringInputProps } from 'sanity'

export default function MonthYearInput(props: StringInputProps) {
  const { value = '', onChange, elementProps } = props

  return (
    <TextInput
      {...elementProps}
      type="month"
      value={value}
      onChange={(event) => {
        const nextValue = event.currentTarget.value
        onChange(nextValue ? set(nextValue) : unset())
      }}
    />
  )
}
