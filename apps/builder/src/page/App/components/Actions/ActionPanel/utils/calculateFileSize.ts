import { createMessage } from "@illa-design/react"
import { BUILDER_CALC_CONTEXT } from "@/page/App/context/globalDataProvider"
import { ActionType } from "@/redux/currentApp/action/actionState"
import { evaluateDynamicString } from "@/utils/evaluateDynamicString"
import { isDynamicString } from "@/utils/evaluateDynamicString/utils"
import { calculateFileSize } from "@/utils/file"

const message = createMessage()
const MAX_SIZE = 5 * 1024 * 1024

export const getFileValue = (data: string) => {
  let value = data
  if (isDynamicString(data)) {
    try {
      value = evaluateDynamicString("", data, BUILDER_CALC_CONTEXT)
    } catch (ignore) {}
  }
  return value
}

export const isFileOversize = (data: string, type?: ActionType) => {
  if (!data.length) {
    return false
  }
  const content = getFileValue(data)
  const isSMTP = type && type === "smtp"
  if (Array.isArray(content)) {
    if (content.length <= 0) {
      return false
    }
    return content.every((value) => {
      const calculateValue = isSMTP ? value.data || "" : value
      return !!(calculateFileSize(calculateValue) > MAX_SIZE)
    })
  } else {
    return !!(calculateFileSize(content) > MAX_SIZE)
  }
}
