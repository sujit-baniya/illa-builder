import { forwardRef, useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useDispatch, useSelector } from "react-redux"
import {
  DropList,
  DropListItem,
  Dropdown,
  Input,
  LoadingIcon,
  WarningCircleIcon,
  getColor,
  useMessage,
} from "@illa-design/react"
import { BuilderApi } from "@/api/base"
import { ILLA_MIXPANEL_EVENT_TYPE } from "@/illa-public-component/MixpanelUtils/interface"
import { ActionListItemProps } from "@/page/App/components/Actions/ActionListItem/interface"
import { getIconFromActionType } from "@/page/App/components/Actions/getIcon"
import {
  getCachedAction,
  getIsILLAGuideMode,
  getSelectedAction,
} from "@/redux/config/configSelector"
import { actionActions } from "@/redux/currentApp/action/actionSlice"
import { getAppInfo } from "@/redux/currentApp/appInfo/appInfoSelector"
import { getExecutionResult } from "@/redux/currentApp/executionTree/executionSelector"
import { RootState } from "@/store"
import { DisplayNameGenerator } from "@/utils/generators/generateDisplayName"
import { trackInEditor } from "@/utils/mixpanelHelper"
import { isObject, isValidDisplayName } from "@/utils/typeHelper"
import {
  actionIconContainer,
  actionItemDotStyle,
  actionItemLeftStyle,
  applyActionItemContainerStyle,
  applyActionItemTitleStyle,
  runningTimeStyle,
  warningCircleStyle,
} from "./style"

const Item = DropListItem

export const ActionListItem = forwardRef<HTMLDivElement, ActionListItemProps>(
  (props, ref) => {
    const { action, onItemClick, onCopyItem, onDeleteItem } = props

    const { t } = useTranslation()
    const selectedAction = useSelector(getSelectedAction)!!
    const cachedAction = useSelector(getCachedAction)
    const message = useMessage()

    const error = useSelector((state: RootState) => {
      const targetActionErrors =
        state.currentApp.execution.error[action.displayName]
      if (isObject(targetActionErrors)) {
        return Object.keys(targetActionErrors).length > 0
      }
      return false
    })

    const currentApp = useSelector(getAppInfo)
    const isGuideMode = useSelector(getIsILLAGuideMode)
    const executionResult = useSelector(getExecutionResult)

    const startRunningTime: number =
      executionResult[action.displayName]?.startTime

    const endRunningTime: number = executionResult[action.displayName]?.endTime

    const isRunning: boolean = executionResult[action.displayName]?.isRunning

    const [currentRunningTime, setCurrentRunningTime] = useState(0)

    const dealData = useCallback(() => {
      return window.setInterval(() => {
        const currentTime = new Date().getTime() - startRunningTime
        setCurrentRunningTime(currentTime)
      }, 10)
    }, [startRunningTime])

    useEffect((): any => {
      let time = -1
      if (isRunning) {
        time = dealData()
      }
      return () => {
        if (time !== -1) {
          window.clearInterval(time)
        }
      }
    }, [isRunning, dealData])

    const isChanged =
      selectedAction?.actionId === action.actionId &&
      JSON.stringify(selectedAction) !== JSON.stringify(cachedAction)

    const [editName, setEditName] = useState(false)
    const [changing, setChanging] = useState(false)
    const dispatch = useDispatch()

    const changeDisplayName = useCallback(
      (newName: string) => {
        if (newName === action.displayName) {
          setEditName(false)
          return
        }
        if (!isValidDisplayName(newName)) {
          message.error({
            content: t("editor.display_name.validate_error", {
              displayName: newName,
            }),
          })
          setEditName(false)
          return
        }
        if (DisplayNameGenerator.isAlreadyGenerate(newName)) {
          message.error({
            content: t("editor.display_name.duplicate_error", {
              displayName: newName,
            }),
          })
          setEditName(false)
          return
        }
        const newAction = {
          ...action,
          displayName: newName,
        }
        if (isGuideMode) {
          dispatch(
            actionActions.updateActionDisplayNameReducer({
              newDisplayName: newName,
              oldDisplayName: action.displayName,
              actionID: newAction.actionId,
            }),
          )
          setEditName(false)
          return
        }
        BuilderApi.teamRequest(
          {
            method: "PUT",
            url: `/apps/${currentApp.appId}/actions/${action.actionId}`,
            data: newAction,
          },
          () => {
            dispatch(
              actionActions.updateActionDisplayNameReducer({
                newDisplayName: newName,
                oldDisplayName: action.displayName,
                actionID: newAction.actionId,
              }),
            )
            setEditName(false)
          },
          () => {
            message.error({
              content: t("change_fail"),
            })
            setEditName(false)
          },
          () => {
            message.error({
              content: t("change_fail"),
            })
            setEditName(false)
          },
          (l) => {
            setChanging(l)
          },
        )
      },
      [action, currentApp.appId, isGuideMode, dispatch, message, t],
    )

    const calcTimeString = useCallback(
      (startTime?: number, endTime?: number) => {
        if (startTime && endTime) {
          const time = endTime - startTime
          if (time > 1000) {
            return `${(time / 1000).toFixed(2)}s`
          }
          return `${time}ms`
        } else {
          return ""
        }
      },
      [],
    )

    const calcLoadingTimeString = useCallback((currentRunningTime: number) => {
      return currentRunningTime > 1000
        ? `${(currentRunningTime / 1000).toFixed(2)}s`
        : `${currentRunningTime}ms`
    }, [])

    return (
      <Dropdown
        trigger="contextmenu"
        position="right-start"
        dropList={
          <DropList w="184px">
            <Item
              key={"rename"}
              value={"rename"}
              title={t("editor.action.action_list.contextMenu.rename")}
              onClick={() => {
                trackInEditor(ILLA_MIXPANEL_EVENT_TYPE.RENAME, {
                  element: "action_rename",
                  parameter1: selectedAction.actionType,
                  parameter2: "manage",
                })
                setEditName(true)
              }}
            />
            <Item
              key={"duplicate"}
              value={"duplicate"}
              title={t("editor.action.action_list.contextMenu.duplicate")}
              onClick={() => {
                trackInEditor(ILLA_MIXPANEL_EVENT_TYPE.DUPLICATE, {
                  element: "action_duplicate",
                  parameter1: selectedAction.actionType,
                })
                onCopyItem(action)
              }}
            />
            <Item
              key={"delete"}
              value={"delete"}
              title={t("editor.action.action_list.contextMenu.delete")}
              deleted
              onClick={() => {
                trackInEditor(ILLA_MIXPANEL_EVENT_TYPE.DELETE, {
                  element: "action_delete",
                  parameter1: selectedAction.actionType,
                })
                onDeleteItem(action)
              }}
            />
          </DropList>
        }
      >
        <div
          css={applyActionItemContainerStyle(
            selectedAction?.displayName === action.displayName,
          )}
          ref={ref}
          onClick={() => {
            onItemClick(action)
          }}
          onDoubleClick={() => {
            onItemClick(action)
            setEditName(true)
          }}
        >
          <div css={actionItemLeftStyle}>
            <div css={actionIconContainer}>
              {getIconFromActionType(action.actionType, "16px")}
              {error && <WarningCircleIcon css={warningCircleStyle} />}
            </div>
            {!editName ? (
              <div css={applyActionItemTitleStyle(error)}>
                {action.displayName}
              </div>
            ) : (
              <Input
                ml="8px"
                colorScheme="techPurple"
                size="small"
                onPressEnter={(e) => {
                  changeDisplayName(e.currentTarget.value)
                }}
                defaultValue={action.displayName}
                autoFocus
                disabled={changing}
                suffix={
                  changing && (
                    <LoadingIcon c={getColor("grayBlue", "05")} spin={true} />
                  )
                }
                onBlur={(event) => {
                  changeDisplayName(event.target.value)
                }}
              />
            )}
            {isChanged && <div css={actionItemDotStyle} />}
          </div>
          <div css={runningTimeStyle}>
            {isRunning
              ? calcLoadingTimeString(currentRunningTime)
              : calcTimeString(startRunningTime, endRunningTime)}
          </div>
        </div>
      </Dropdown>
    )
  },
)

ActionListItem.displayName = "ActionListItem"
