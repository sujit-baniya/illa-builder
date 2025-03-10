import { FC, useEffect, useMemo } from "react"
import { useSelector } from "react-redux"
import { useParams } from "react-router-dom"
import { ILLA_MIXPANEL_EVENT_TYPE } from "@/illa-public-component/MixpanelUtils/interface"
import { applyViewportContainerWrapperStyle } from "@/page/App/components/DotPanel/style"
import {
  getIllaMode,
  getIsILLAProductMode,
} from "@/redux/config/configSelector"
import {
  getCanvas,
  getViewportSizeSelector,
} from "@/redux/currentApp/editor/components/componentsSelector"
import {
  PageNode,
  RootComponentNode,
} from "@/redux/currentApp/editor/components/componentsState"
import {
  getExecutionResult,
  getRootNodeExecutionResult,
} from "@/redux/currentApp/executionTree/executionSelector"
import { trackInEditor } from "@/utils/mixpanelHelper"
import { MouseHoverProvider } from "./context/mouseHoverContext"
import { MouseMoveProvider } from "./context/mouseMoveContext"
import { RenderPage } from "./renderPage"

export const DotPanel: FC = () => {
  const canvasTree = useSelector(getCanvas) as RootComponentNode
  const rootExecutionProps = useSelector(getRootNodeExecutionResult)
  const executionResult = useSelector(getExecutionResult)
  const mode = useSelector(getIllaMode)
  const isProductionMode = useSelector(getIsILLAProductMode)
  const viewportSize = useSelector(getViewportSizeSelector)

  const { currentPageIndex, pageSortedKey, homepageDisplayName } =
    rootExecutionProps
  let { pageName } = useParams()
  const currentDisplayName = useMemo(() => {
    if (isProductionMode) {
      return (
        pageName ||
        homepageDisplayName ||
        pageSortedKey[currentPageIndex] ||
        "page1"
      )
    } else {
      return pageSortedKey[currentPageIndex] || homepageDisplayName
    }
  }, [
    currentPageIndex,
    homepageDisplayName,
    isProductionMode,
    pageName,
    pageSortedKey,
  ])
  const canRenders = !!executionResult.root

  useEffect(() => {
    if (canRenders) {
      trackInEditor(ILLA_MIXPANEL_EVENT_TYPE.INITIALIZE)
    }
  }, [canRenders])

  if (
    !canvasTree ||
    canvasTree.containerType !== "EDITOR_DOT_PANEL" ||
    canvasTree.type !== "DOT_PANEL" ||
    canvasTree.displayName !== "root" ||
    !rootExecutionProps
  )
    return null

  const currentChildrenNode = canvasTree.childrenNode.find((node) => {
    return node.displayName === currentDisplayName
  })

  if (currentChildrenNode == undefined) return null
  return (
    <MouseHoverProvider>
      <MouseMoveProvider>
        <div
          css={applyViewportContainerWrapperStyle(
            mode,
            viewportSize.viewportWidth,
            viewportSize.viewportHeight,
          )}
        >
          <RenderPage
            key={currentDisplayName}
            pageNode={currentChildrenNode as PageNode}
            currentPageDisplayName={currentDisplayName}
          />
        </div>
      </MouseMoveProvider>
    </MouseHoverProvider>
  )
}

DotPanel.displayName = "DotPanel"
