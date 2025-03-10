import { FC, useState } from "react"
import { useTranslation } from "react-i18next"
import { useDispatch, useSelector } from "react-redux"
import { v4 } from "uuid"
import { Spin, useMessage } from "@illa-design/react"
import { BuilderApi } from "@/api/base"
import { WhiteList } from "@/components/WhiteList"
import {
  ILLA_MIXPANEL_BUILDER_PAGE_NAME,
  ILLA_MIXPANEL_EVENT_TYPE,
} from "@/illa-public-component/MixpanelUtils/interface"
import { ActionTypeList } from "@/page/App/components/Actions/ActionGenerator/config"
import { getIsILLAGuideMode } from "@/redux/config/configSelector"
import { configActions } from "@/redux/config/configSlice"
import { actionActions } from "@/redux/currentApp/action/actionSlice"
import {
  ActionContent,
  ActionItem,
  actionItemInitial,
} from "@/redux/currentApp/action/actionState"
import { getInitialContent } from "@/redux/currentApp/action/getInitialContent"
import { getAppInfo } from "@/redux/currentApp/appInfo/appInfoSelector"
import { DisplayNameGenerator } from "@/utils/generators/generateDisplayName"
import { track } from "@/utils/mixpanelHelper"
import { ActionCard } from "../ActionCard"
import { ActionTypeSelectorProps } from "./interface"
import { categoryStyle, containerStyle, resourceListStyle } from "./style"

export const ActionTypeSelector: FC<ActionTypeSelectorProps> = (props) => {
  const { onSelect } = props

  const [loading, setLoading] = useState(false)
  const appInfo = useSelector(getAppInfo)
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const message = useMessage()
  const isGuideMode = useSelector(getIsILLAGuideMode)
  return (
    <Spin css={containerStyle} colorScheme="techPurple" loading={loading}>
      {ActionTypeList.map(({ title, item, category }) => (
        <div key={category}>
          <span css={categoryStyle}>{title}</span>
          <div css={resourceListStyle}>
            {item.map((prop) => (
              <ActionCard
                key={prop.actionType}
                onSelect={(item) => {
                  if (item === "transformer") {
                    const displayName =
                      DisplayNameGenerator.generateDisplayName(item)
                    const initialContent = getInitialContent(item)
                    const data: Omit<ActionItem<ActionContent>, "actionId"> = {
                      actionType: item,
                      displayName,
                      content: initialContent,
                      ...actionItemInitial,
                    }
                    if (isGuideMode) {
                      const createActionData: ActionItem<ActionContent> = {
                        ...data,
                        actionId: v4(),
                      }
                      dispatch(
                        actionActions.addActionItemReducer(createActionData),
                      )
                      dispatch(
                        configActions.changeSelectedAction(createActionData),
                      )
                      onSelect(item)
                      return
                    }
                    BuilderApi.teamRequest(
                      {
                        url: `/apps/${appInfo.appId}/actions`,
                        method: "POST",
                        data,
                      },
                      ({ data }: { data: ActionItem<ActionContent> }) => {
                        message.success({
                          content: t(
                            "editor.action.action_list.message.success_created",
                          ),
                        })
                        dispatch(actionActions.addActionItemReducer(data))
                        dispatch(configActions.changeSelectedAction(data))
                        onSelect(item)
                      },
                      () => {
                        message.error({
                          content: t(
                            "editor.action.action_list.message.failed",
                          ),
                        })
                        DisplayNameGenerator.removeDisplayName(displayName)
                      },
                      () => {
                        DisplayNameGenerator.removeDisplayName(displayName)
                      },
                      (loading) => {
                        setLoading(loading)
                      },
                    )
                  } else {
                    onSelect(item)
                  }
                }}
                {...prop}
              />
            ))}
          </div>
        </div>
      ))}
      <WhiteList
        onCopyIpReport={() => {
          track(
            ILLA_MIXPANEL_EVENT_TYPE.CLICK,
            ILLA_MIXPANEL_BUILDER_PAGE_NAME.EDITOR,
            { element: "resource_type_modal_copy" },
          )
        }}
      />
    </Spin>
  )
}

ActionTypeSelector.displayName = "ActionTypeSelector"
