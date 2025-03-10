import { FC, useCallback, useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { BuilderApi } from "@/api/base"
import { CODE_LANG } from "@/components/CodeEditor/CodeMirror/extensions/interface"
import { ActionEventHandler } from "@/page/App/components/Actions/ActionPanel/ActionEventHandler"
import {
  actionItemContainer,
  redisContainerStyle,
} from "@/page/App/components/Actions/ActionPanel/RedisPanel/style"
import { ResourceChoose } from "@/page/App/components/Actions/ActionPanel/ResourceChoose"
import { TransformerComponent } from "@/page/App/components/Actions/ActionPanel/TransformerComponent"
import { InputEditor } from "@/page/App/components/InputEditor"
import { getCachedAction } from "@/redux/config/configSelector"
import { configActions } from "@/redux/config/configSlice"
import { RedisAction } from "@/redux/currentApp/action/redisAction"
import { ResourcesData } from "@/redux/resource/resourceState"
import { VALIDATION_TYPES } from "@/utils/validationFactory"

export const RedisPanel: FC = () => {
  const action = useSelector(getCachedAction)!!
  const [sqlTable, setSqlTable] = useState<Record<string, unknown>>()

  useEffect(() => {
    BuilderApi.teamRequest(
      {
        url: `/resources/${action.resourceId}/meta`,
        method: "GET",
      },
      ({ data }: { data: ResourcesData }) => {
        setSqlTable(data?.schema ?? {})
      },
      () => {},
      () => {},
      () => {},
    )
  }, [action.resourceId])

  const currentContent = action.content as RedisAction
  const dispatch = useDispatch()

  const handleValueChange = useCallback(
    (value: string) => {
      dispatch(
        configActions.updateCachedAction({
          ...action,
          content: {
            ...currentContent,
            query: value,
          },
        }),
      )
    },
    [action, currentContent, dispatch],
  )

  return (
    <div css={redisContainerStyle}>
      <ResourceChoose />
      <div css={actionItemContainer}>
        <InputEditor
          style={{ maxHeight: "88px" }}
          placeholder="SET runoobkey redis"
          lineNumbers
          canShowCompleteInfo
          value={currentContent.query}
          mode={CODE_LANG.JAVASCRIPT}
          expectedType={VALIDATION_TYPES.STRING}
          sqlScheme={sqlTable}
          onChange={handleValueChange}
        />

        <TransformerComponent fullWidth />
      </div>

      <ActionEventHandler />
    </div>
  )
}
