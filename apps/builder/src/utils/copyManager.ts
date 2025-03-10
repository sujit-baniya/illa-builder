import { onCopyActionItem } from "@/page/App/components/Actions/api"
import {
  ActionContent,
  ActionItem,
} from "@/redux/currentApp/action/actionState"
import { LayoutInfo } from "@/redux/currentApp/editor/components/componentsPayload"
import { searchCurrentPageContainerNode } from "@/redux/currentApp/editor/components/componentsSelector"
import { componentsActions } from "@/redux/currentApp/editor/components/componentsSlice"
import { ComponentNode } from "@/redux/currentApp/editor/components/componentsState"
import {
  getExecutionWidgetLayoutInfo,
  getRootNodeExecutionResult,
} from "@/redux/currentApp/executionTree/executionSelector"
import store from "@/store"
import { FocusManager } from "@/utils/focusManager"
import { DisplayNameGenerator } from "@/utils/generators/generateDisplayName"

export class CopyManager {
  static currentCopyComponentNodes: ComponentNode[] | null = null

  static currentPageIndex: number | null = null

  static currentPageSortedKey: string[] | null = null

  static currentCopyAction: ActionItem<ActionContent> | null = null

  static copyAction(action: ActionItem<ActionContent>) {
    this.currentCopyAction = action
  }

  static copyComponentNode(node: ComponentNode[]) {
    const { currentPageIndex, pageSortedKey } = getRootNodeExecutionResult(
      store.getState(),
    )
    this.currentPageIndex = currentPageIndex
    this.currentPageSortedKey = pageSortedKey
    this.currentCopyComponentNodes = node
  }

  static paste(sources: "keyboard" | "duplicate") {
    switch (FocusManager.getFocus()) {
      case "dataWorkspace_action":
      case "action":
        if (this.currentCopyAction != null) {
          onCopyActionItem(this.currentCopyAction)
        }
        break
      case "dataWorkspace_component":
      case "canvas":
        if (this.currentCopyComponentNodes != null) {
          const { currentPageIndex, pageSortedKey } =
            getRootNodeExecutionResult(store.getState())
          if (
            this.currentPageIndex === currentPageIndex &&
            this.currentPageSortedKey === pageSortedKey
          ) {
            store.dispatch(
              componentsActions.copyComponentReducer({
                copyComponents: this.currentCopyComponentNodes.map((node) => {
                  return {
                    newComponentNode: this.copyComponent(node),
                  }
                }),
                sources: sources,
              }),
            )
          } else {
            const containerNode = searchCurrentPageContainerNode(
              pageSortedKey,
              currentPageIndex,
            )
            if (containerNode) {
              store.dispatch(
                componentsActions.copyComponentReducer({
                  copyComponents: this.currentCopyComponentNodes.map((node) => {
                    return {
                      newComponentNode: this.copyComponent(node, containerNode),
                    }
                  }),
                  sources: sources,
                }),
              )
            }
          }
        }
        break
      case "none":
        break
      case "components":
        break
    }
  }

  static copyComponent(
    node: ComponentNode,
    newParentNode?: ComponentNode,
    offsetX?: number,
    offsetY?: number,
  ): ComponentNode {
    const executionResult = getExecutionWidgetLayoutInfo(store.getState())
    const currentLayoutInfo = executionResult[node.displayName]
      .layoutInfo as LayoutInfo
    const newNode = {
      ...node,
      displayName: DisplayNameGenerator.generateDisplayName(
        node.type,
        node.showName,
      ),
      x: (offsetX ?? 0) + currentLayoutInfo.x,
      y: (offsetY ?? 0) + currentLayoutInfo.y,
      w: currentLayoutInfo.w,
      h: currentLayoutInfo.h,
      parentNode: newParentNode?.displayName ?? node.parentNode,
    } as ComponentNode
    if (Array.isArray(node.childrenNode)) {
      newNode.childrenNode = node.childrenNode.map((n) =>
        this.copyComponent(n, newNode, 0, 0),
      )
    }
    return newNode
  }
}
