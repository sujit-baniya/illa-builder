import { PayloadAction } from "@reduxjs/toolkit"
import {
  Connection,
  getTextMessagePayload,
  transformComponentReduxPayloadToWsPayload,
} from "@/api/ws"
import { Signal, Target } from "@/api/ws/ILLA_PROTO"
import {
  UpdateComponentContainerPayload,
  UpdateComponentNodeLayoutInfoPayload,
  UpdateComponentSlicePropsPayload,
} from "@/redux/currentApp/editor/components/componentsPayload"
import {
  getCanvas,
  searchDsl,
} from "@/redux/currentApp/editor/components/componentsSelector"
import {
  AddModalComponentPayload,
  AddSectionViewPayload,
  AddTargetPageSectionPayload,
  ComponentNode,
  CopyComponentPayload,
  DeleteComponentNodePayload,
  DeletePageNodePayload,
  DeleteSectionViewPayload,
  DeleteTargetPageSectionPayload,
  SortComponentNodeChildrenPayload,
  UpdateComponentDisplayNamePayload,
  UpdateComponentNodeHeightPayload,
  UpdateComponentPropsPayload,
  UpdateComponentReflowPayload,
  UpdateSectionViewPropsPayload,
  UpdateTargetPageLayoutPayload,
  UpdateTargetPagePropsPayload,
} from "@/redux/currentApp/editor/components/componentsState"
import { RootState } from "@/store"

export const componentsAsync = (
  reduxAction: string,
  currentAppID: string,
  action: PayloadAction<any>,
  teamID: string,
  uid: string,
  prevRootState: RootState,
  nextRootState: RootState,
) => {
  const { payload } = action
  switch (reduxAction) {
    case "addComponentReducer":
      Connection.getTextRoom("app", currentAppID)?.send(
        getTextMessagePayload(
          Signal.CREATE_STATE,
          Target.COMPONENTS,
          true,
          action,
          teamID,
          uid,
          payload,
        ),
      )
      break
    case "addModalComponentReducer": {
      const payload = action.payload as AddModalComponentPayload

      const parentNode = searchDsl(
        getCanvas(nextRootState),
        payload.modalComponentNode.parentNode,
      )
      if (!parentNode) return
      Connection.getTextRoom("app", currentAppID)?.send(
        getTextMessagePayload(
          Signal.CREATE_OR_UPDATE_STATE,
          Target.COMPONENTS,
          true,
          null,
          teamID,
          uid,
          [parentNode],
        ),
      )
      const allChildrenNodes = parentNode.childrenNode
      Connection.getTextRoom("app", currentAppID)?.send(
        getTextMessagePayload(
          Signal.CREATE_OR_UPDATE_STATE,
          Target.COMPONENTS,
          true,
          action,
          teamID,
          uid,
          allChildrenNodes,
        ),
      )
      break
    }
    case "copyComponentReducer":
      const copyComponentPayload = (
        payload as {
          copyComponents: CopyComponentPayload[]
          sources: "keyboard" | "duplicate"
        }
      ).copyComponents.map((copyShape) => copyShape.newComponentNode)
      Connection.getTextRoom("app", currentAppID)?.send(
        getTextMessagePayload(
          Signal.CREATE_STATE,
          Target.COMPONENTS,
          true,
          action,
          teamID,
          uid,
          copyComponentPayload,
        ),
      )
      break
    case "updateComponentReflowReducer":
      const updateComponentReflowPayload: UpdateComponentReflowPayload[] =
        payload
      const allEffectComponentNodes: ComponentNode[] =
        updateComponentReflowPayload.flatMap((payload) => {
          return payload.childNodes
        })
      const updateComponentReflowWSPayload =
        transformComponentReduxPayloadToWsPayload(allEffectComponentNodes)
      Connection.getTextRoom("app", currentAppID)?.send(
        getTextMessagePayload(
          Signal.UPDATE_STATE,
          Target.COMPONENTS,
          true,
          action,
          teamID,
          uid,
          updateComponentReflowWSPayload,
        ),
      )
      break
    case "sortComponentNodeChildrenReducer":
      const sortComponentNodeChildrenPayload: SortComponentNodeChildrenPayload =
        payload
      const sortComponentNodeChildrenWSPayload =
        transformComponentReduxPayloadToWsPayload(
          sortComponentNodeChildrenPayload.newChildrenNode,
        )
      Connection.getTextRoom("app", currentAppID)?.send(
        getTextMessagePayload(
          Signal.MOVE_STATE,
          Target.COMPONENTS,
          true,
          action,
          teamID,
          uid,
          sortComponentNodeChildrenWSPayload,
        ),
      )
      break
    case "updateComponentContainerReducer": {
      const updateComponentContainerPayload: UpdateComponentContainerPayload =
        payload

      const allDisplayNames = updateComponentContainerPayload.updateSlice.map(
        (slice) => slice.component.displayName,
      )
      const allNodes = allDisplayNames
        .map((displayName) => {
          return searchDsl(
            getCanvas(nextRootState),
            displayName,
          ) as ComponentNode
        })
        .filter((node) => node !== null) as ComponentNode[]
      Connection.getTextRoom("app", currentAppID)?.send(
        getTextMessagePayload(
          Signal.MOVE_STATE,
          Target.COMPONENTS,
          true,
          action,
          teamID,
          uid,
          allNodes,
        ),
      )
      break
    }
    case "updateComponentPropsReducer":
      const updatePayload: UpdateComponentPropsPayload = payload
      const finalNode = searchDsl(
        getCanvas(nextRootState),
        updatePayload.displayName,
      )
      if (finalNode != null) {
        Connection.getTextRoom("app", currentAppID)?.send(
          getTextMessagePayload(
            Signal.UPDATE_STATE,
            Target.COMPONENTS,
            true,
            action,
            teamID,
            uid,
            [
              {
                before: {
                  displayName: updatePayload.displayName,
                },
                after: finalNode,
              },
            ],
          ),
        )
      }
      break
    case "batchUpdateMultiComponentSlicePropsReducer": {
      const batchUpdatePayload: UpdateComponentSlicePropsPayload[] = payload
      const allDisplayNames = batchUpdatePayload.map(
        ({ displayName }) => displayName,
      )
      const allNodes = allDisplayNames
        .map((displayName) => {
          return searchDsl(
            getCanvas(nextRootState),
            displayName,
          ) as ComponentNode
        })
        .filter((node) => node !== null) as ComponentNode[]
      const wsPayload = transformComponentReduxPayloadToWsPayload(allNodes)

      Connection.getTextRoom("app", currentAppID)?.send(
        getTextMessagePayload(
          Signal.UPDATE_STATE,
          Target.COMPONENTS,
          true,
          action,
          teamID,
          uid,
          wsPayload,
        ),
      )
      break
    }
    case "updateMultiComponentPropsReducer":
      const updateMultiPayload: UpdateComponentPropsPayload[] = payload
      const finalNodes = updateMultiPayload
        .map(({ displayName }) => {
          return searchDsl(getCanvas(nextRootState), displayName)
        })
        .filter((node) => node !== null) as ComponentNode[]
      if (Array.isArray(finalNodes)) {
        const wsPayload = transformComponentReduxPayloadToWsPayload(finalNodes)
        Connection.getTextRoom("app", currentAppID)?.send(
          getTextMessagePayload(
            Signal.UPDATE_STATE,
            Target.COMPONENTS,
            true,
            action,
            teamID,
            uid,
            wsPayload,
          ),
        )
      }
      break
    case "deleteComponentNodeReducer":
      const deletePayload: DeleteComponentNodePayload = payload
      Connection.getTextRoom("app", currentAppID)?.send(
        getTextMessagePayload(
          Signal.DELETE_STATE,
          Target.COMPONENTS,
          true,
          action,
          teamID,
          uid,
          deletePayload.displayNames,
        ),
      )
      break
    case "resetComponentPropsReducer":
      const resetWsPayload = transformComponentReduxPayloadToWsPayload(
        payload as ComponentNode,
      )
      Connection.getTextRoom("app", currentAppID)?.send(
        getTextMessagePayload(
          Signal.UPDATE_STATE,
          Target.COMPONENTS,
          true,
          action,
          teamID,
          uid,
          resetWsPayload,
        ),
      )
      break
    case "updateComponentDisplayNameReducer":
      const { displayName, newDisplayName } =
        action.payload as UpdateComponentDisplayNamePayload
      const canvasNode = getCanvas(nextRootState)
      const findOldNode = searchDsl(canvasNode, newDisplayName)
      if (!findOldNode) break
      const parentNode = searchDsl(canvasNode, findOldNode.parentNode)
      if (!parentNode) break
      const WSPayload = transformComponentReduxPayloadToWsPayload([
        parentNode,
        ...(findOldNode.childrenNode || []),
      ])
      Connection.getTextRoom("app", currentAppID)?.send(
        getTextMessagePayload(
          Signal.UPDATE_STATE,
          Target.COMPONENTS,
          true,
          action,
          teamID,
          uid,
          [
            {
              before: {
                displayName: displayName,
              },
              after: {
                ...findOldNode,
                displayName: newDisplayName,
              },
            },
            ...WSPayload,
          ],
        ),
      )
      break
    case "updateTargetPageLayoutReducer": {
      const { pageName } = action.payload as UpdateTargetPageLayoutPayload
      const canvasNode = getCanvas(nextRootState)
      const pageNode = searchDsl(canvasNode, pageName)
      if (!pageNode) break
      Connection.getTextRoom("app", currentAppID)?.send(
        getTextMessagePayload(
          Signal.DELETE_STATE,
          Target.COMPONENTS,
          true,
          null,
          teamID,
          uid,
          [pageName],
        ),
      )
      Connection.getTextRoom("app", currentAppID)?.send(
        getTextMessagePayload(
          Signal.CREATE_STATE,
          Target.COMPONENTS,
          true,
          action,
          teamID,
          uid,
          [pageNode],
        ),
      )
      break
    }
    case "deleteTargetPageSectionReducer": {
      const { pageName, deleteSectionName } =
        action.payload as DeleteTargetPageSectionPayload
      const originFinalNode = searchDsl(getCanvas(prevRootState), pageName)
      const finalNode = searchDsl(getCanvas(nextRootState), pageName)

      if (!finalNode || !originFinalNode) break
      const WSPayload = transformComponentReduxPayloadToWsPayload(finalNode)
      const targetPageChildrenNode = originFinalNode.childrenNode.find(
        (node) => node.showName === deleteSectionName,
      )
      if (!targetPageChildrenNode) return
      Connection.getTextRoom("app", currentAppID)?.send(
        getTextMessagePayload(
          Signal.DELETE_STATE,
          Target.COMPONENTS,
          true,
          action,
          teamID,
          uid,
          [targetPageChildrenNode.displayName],
        ),
      )

      Connection.getTextRoom("app", currentAppID)?.send(
        getTextMessagePayload(
          Signal.UPDATE_STATE,
          Target.COMPONENTS,
          true,
          null,
          teamID,
          uid,
          WSPayload,
        ),
      )
      break
    }
    case "addTargetPageSectionReducer": {
      const { pageName, addedSectionName } =
        action.payload as AddTargetPageSectionPayload
      const pageNode = searchDsl(getCanvas(nextRootState), pageName)
      if (!pageNode) break
      const addSectionNode = pageNode.childrenNode.find(
        (node) => node.showName === addedSectionName,
      )
      if (!addSectionNode) break

      const WSPagePayload = transformComponentReduxPayloadToWsPayload(pageNode)

      Connection.getTextRoom("app", currentAppID)?.send(
        getTextMessagePayload(
          Signal.UPDATE_STATE,
          Target.COMPONENTS,
          true,
          null,
          teamID,
          uid,
          WSPagePayload,
        ),
      )
      Connection.getTextRoom("app", currentAppID)?.send(
        getTextMessagePayload(
          Signal.CREATE_STATE,
          Target.COMPONENTS,
          true,
          action,
          teamID,
          uid,
          [addSectionNode],
        ),
      )
      break
    }
    case "updateTargetPagePropsReducer": {
      const { pageName } = action.payload as UpdateTargetPagePropsPayload
      const pageNode = searchDsl(getCanvas(nextRootState), pageName)

      if (!pageNode) break
      const WSPagePayload = transformComponentReduxPayloadToWsPayload(pageNode)

      Connection.getTextRoom("app", currentAppID)?.send(
        getTextMessagePayload(
          Signal.UPDATE_STATE,
          Target.COMPONENTS,
          true,
          action,
          teamID,
          uid,
          WSPagePayload,
        ),
      )
      break
    }
    case "updateViewportSizeReducer":
    case "updateRootNodePropsReducer": {
      const rootNode = getCanvas(nextRootState)
      if (!rootNode) break
      const WSPagePayload = transformComponentReduxPayloadToWsPayload(rootNode)
      Connection.getTextRoom("app", currentAppID)?.send(
        getTextMessagePayload(
          Signal.UPDATE_STATE,
          Target.COMPONENTS,
          true,
          action,
          teamID,
          uid,
          WSPagePayload,
        ),
      )
      break
    }
    case "addPageNodeWithSortOrderReducer": {
      const rootNode = getCanvas(nextRootState)
      const nodes = action.payload as ComponentNode[]
      if (!rootNode || !Array.isArray(nodes) || nodes.length === 0) break
      const rootNodeUpdateWSPayload =
        transformComponentReduxPayloadToWsPayload(rootNode)
      Connection.getTextRoom("app", currentAppID)?.send(
        getTextMessagePayload(
          Signal.UPDATE_STATE,
          Target.COMPONENTS,
          true,
          null,
          teamID,
          uid,
          rootNodeUpdateWSPayload,
        ),
      )
      Connection.getTextRoom("app", currentAppID)?.send(
        getTextMessagePayload(
          Signal.CREATE_STATE,
          Target.COMPONENTS,
          true,
          action,
          teamID,
          uid,
          nodes,
        ),
      )
      break
    }
    case "deletePageNodeReducer": {
      const deletePayload = payload as DeletePageNodePayload
      const rootNode = getCanvas(nextRootState)
      if (!rootNode) break
      const rootNodeUpdateWSPayload =
        transformComponentReduxPayloadToWsPayload(rootNode)
      Connection.getTextRoom("app", currentAppID)?.send(
        getTextMessagePayload(
          Signal.UPDATE_STATE,
          Target.COMPONENTS,
          true,
          null,
          teamID,
          uid,
          rootNodeUpdateWSPayload,
        ),
      )
      Connection.getTextRoom("app", currentAppID)?.send(
        getTextMessagePayload(
          Signal.DELETE_STATE,
          Target.COMPONENTS,
          true,
          action,
          teamID,
          uid,
          [deletePayload.displayName],
        ),
      )
      break
    }
    case "addSectionViewReducer": {
      const { parentNodeName, containerNode } = payload as AddSectionViewPayload
      const rootNode = getCanvas(nextRootState)

      if (!rootNode) break
      const targetNode = searchDsl(rootNode, parentNodeName)
      if (!targetNode) break
      const updateWSPayload =
        transformComponentReduxPayloadToWsPayload(targetNode)
      Connection.getTextRoom("app", currentAppID)?.send(
        getTextMessagePayload(
          Signal.UPDATE_STATE,
          Target.COMPONENTS,
          true,
          null,
          teamID,
          uid,
          updateWSPayload,
        ),
      )
      Connection.getTextRoom("app", currentAppID)?.send(
        getTextMessagePayload(
          Signal.CREATE_STATE,
          Target.COMPONENTS,
          true,
          action,
          teamID,
          uid,
          [containerNode],
        ),
      )
      break
    }
    case "deleteSectionViewReducer": {
      const { viewDisplayName, parentNodeName } =
        payload as DeleteSectionViewPayload
      const rootNode = getCanvas(nextRootState)
      if (!rootNode) break
      const targetNode = searchDsl(rootNode, parentNodeName)
      if (!targetNode) break
      const updateWSPayload =
        transformComponentReduxPayloadToWsPayload(targetNode)
      Connection.getTextRoom("app", currentAppID)?.send(
        getTextMessagePayload(
          Signal.DELETE_STATE,
          Target.COMPONENTS,
          true,
          null,
          teamID,
          uid,
          [viewDisplayName],
        ),
      )
      Connection.getTextRoom("app", currentAppID)?.send(
        getTextMessagePayload(
          Signal.UPDATE_STATE,
          Target.COMPONENTS,
          true,
          action,
          teamID,
          uid,
          updateWSPayload,
        ),
      )
      break
    }
    case "updateSectionViewPropsReducer": {
      const { parentNodeName } = payload as UpdateSectionViewPropsPayload
      const rootNode = getCanvas(nextRootState)
      if (!rootNode) break
      const targetNode = searchDsl(rootNode, parentNodeName)
      if (!targetNode) break
      const updateWSPayload =
        transformComponentReduxPayloadToWsPayload(targetNode)
      Connection.getTextRoom("app", currentAppID)?.send(
        getTextMessagePayload(
          Signal.UPDATE_STATE,
          Target.COMPONENTS,
          true,
          action,
          teamID,
          uid,
          updateWSPayload,
        ),
      )
      break
    }
    case "updateComponentNodeHeightReducer": {
      const { displayName } = payload as UpdateComponentNodeHeightPayload
      const rootNode = getCanvas(nextRootState)
      if (!rootNode) break
      const targetNode = searchDsl(rootNode, displayName)
      if (!targetNode) break
      const updateWSPayload =
        transformComponentReduxPayloadToWsPayload(targetNode)
      Connection.getTextRoom("app", currentAppID)?.send(
        getTextMessagePayload(
          Signal.UPDATE_STATE,
          Target.COMPONENTS,
          true,
          action,
          teamID,
          uid,
          updateWSPayload,
        ),
      )
      break
    }
    case "batchUpdateComponentLayoutInfoReducer": {
      const displayNames = (
        payload as UpdateComponentNodeLayoutInfoPayload[]
      ).map((item) => item.displayName)
      const rootNode = getCanvas(nextRootState)
      if (!rootNode) break
      const targetNodes = displayNames
        .map((displayName) => searchDsl(rootNode, displayName))
        .filter((node) => node !== null) as ComponentNode[]
      if (targetNodes.length < 1) break
      const updateWSPayload =
        transformComponentReduxPayloadToWsPayload(targetNodes)
      Connection.getTextRoom("app", currentAppID)?.send(
        getTextMessagePayload(
          Signal.UPDATE_STATE,
          Target.COMPONENTS,
          true,
          action,
          teamID,
          uid,
          updateWSPayload,
        ),
      )
      break
    }
    case "batchUpdateComponentLayoutInfoWhenReflowReducer": {
      const displayNames = (
        payload as UpdateComponentNodeLayoutInfoPayload[]
      ).map((item) => item.displayName)
      const rootNode = getCanvas(nextRootState)
      if (!rootNode) break
      const targetNodes = displayNames
        .map((displayName) => searchDsl(rootNode, displayName))
        .filter((node) => node !== null) as ComponentNode[]
      if (targetNodes.length < 1) break
      const updateWSPayload =
        transformComponentReduxPayloadToWsPayload(targetNodes)
      Connection.getTextRoom("app", currentAppID)?.send(
        getTextMessagePayload(
          Signal.UPDATE_STATE,
          Target.COMPONENTS,
          false,
          null,
          teamID,
          uid,
          updateWSPayload,
        ),
      )
      break
    }
    case "batchUpdateComponentStatusInfoReducer": {
      const displayNames = (
        payload as UpdateComponentNodeLayoutInfoPayload[]
      ).map((item) => item.displayName)
      const rootNode = getCanvas(nextRootState)
      if (!rootNode) break
      const targetNodes = displayNames
        .map((displayName) => searchDsl(rootNode, displayName))
        .filter((node) => node !== null) as ComponentNode[]
      if (targetNodes.length < 1) break
      const updateWSPayload =
        transformComponentReduxPayloadToWsPayload(targetNodes)
      Connection.getTextRoom("app", currentAppID)?.send(
        getTextMessagePayload(
          Signal.UPDATE_STATE,
          Target.COMPONENTS,
          true,
          action,
          teamID,
          uid,
          updateWSPayload,
        ),
      )
      break
    }
    case "updateComponentStatusInfoReducer":
    case "updateComponentLayoutInfoReducer": {
      const displayName = (payload as UpdateComponentNodeLayoutInfoPayload)
        .displayName
      const rootNode = getCanvas(nextRootState)
      if (!rootNode) break
      const targetNode = searchDsl(rootNode, displayName)
      if (!targetNode) break
      const updateWSPayload =
        transformComponentReduxPayloadToWsPayload(targetNode)
      Connection.getTextRoom("app", currentAppID)?.send(
        getTextMessagePayload(
          Signal.UPDATE_STATE,
          Target.COMPONENTS,
          true,
          action,
          teamID,
          uid,
          updateWSPayload,
        ),
      )
      break
    }
    case "setGlobalStateReducer": {
      const rootNode = getCanvas(nextRootState)
      if (!rootNode) break
      const updateWSPayload =
        transformComponentReduxPayloadToWsPayload(rootNode)
      Connection.getTextRoom("app", currentAppID)?.send(
        getTextMessagePayload(
          Signal.UPDATE_STATE,
          Target.COMPONENTS,
          true,
          action,
          teamID,
          uid,
          updateWSPayload,
        ),
      )
      break
    }
  }
}
