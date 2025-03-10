import { CaseReducer, PayloadAction } from "@reduxjs/toolkit"
import { applyChange } from "deep-diff"
import { has, set } from "lodash"
import {
  DependenciesState,
  ErrorShape,
  ExecutionState,
  UpdateExecutionByDisplayNamePayload,
  UpdateWidgetLayoutInfoPayload,
  executionInitialState,
  setExecutionResultPayload,
} from "@/redux/currentApp/executionTree/executionState"
import { CUSTOM_STORAGE_PREFIX } from "@/utils/storage"
import { isObject } from "@/utils/typeHelper"

export const setDependenciesReducer: CaseReducer<
  ExecutionState,
  PayloadAction<DependenciesState>
> = (state, action) => {
  state.dependencies = action.payload
}

export const setIndependenciesReducer: CaseReducer<
  ExecutionState,
  PayloadAction<DependenciesState>
> = (state, action) => {
  state.independencies = action.payload
}

export const setExecutionResultReducer: CaseReducer<
  ExecutionState,
  PayloadAction<setExecutionResultPayload>
> = (state, action) => {
  const { updates } = action.payload
  if (updates.length === 0) {
    return state
  }

  for (const update of updates) {
    if (!Array.isArray(update.path) || update.path.length === 0) {
      continue
    }
    try {
      applyChange(state.result, undefined, update)
    } catch (e) {
      console.error(e)
    }
  }
}

export const setExecutionErrorReducer: CaseReducer<
  ExecutionState,
  PayloadAction<Record<string, ErrorShape[]>>
> = (state, action) => {
  state.error = action.payload
}

export const setExecutionDebuggerDataReducer: CaseReducer<
  ExecutionState,
  PayloadAction<Record<string, ErrorShape[]>>
> = (state, action) => {
  state.debuggerData = action.payload
}

export const startExecutionReducer: CaseReducer<
  ExecutionState,
  PayloadAction<void>
> = (state) => {
  return state
}

export const updateExecutionByDisplayNameReducer: CaseReducer<
  ExecutionState,
  PayloadAction<UpdateExecutionByDisplayNamePayload>
> = (state, action) => {
  const { displayName, value } = action.payload
  state.result[displayName] = {
    ...state.result[displayName],
    ...value,
  }
}

export const updateExecutionByMultiDisplayNameReducer: CaseReducer<
  ExecutionState,
  PayloadAction<UpdateExecutionByDisplayNamePayload[]>
> = (state, action) => {
  action.payload.forEach(({ displayName, value }) => {
    state.result[displayName] = {
      ...state.result[displayName],
      ...value,
    }
  })
}

export const updateModalDisplayReducer: CaseReducer<
  ExecutionState,
  PayloadAction<{
    displayName: string
    display: boolean
  }>
> = (state, action) => {
  const result = state.result
  const currentNode = result[action.payload.displayName]
  if (!currentNode) return state
  const parentNodeDisplayName = currentNode.$parentNode
  if (!parentNodeDisplayName) return state
  const parentNode = result[parentNodeDisplayName]
  if (
    !parentNode ||
    !Array.isArray(parentNode.$childrenNode) ||
    parentNode.$childrenNode.length === 0
  )
    return state
  const otherNodeDisplayNames = parentNode.$childrenNode.filter(
    (key: string) => key !== action.payload.displayName,
  )
  currentNode.isVisible = action.payload.display
  if (action.payload.display) {
    otherNodeDisplayNames.forEach((key: string) => {
      const node = result[key]
      if (node) {
        node.isVisible = false
      }
    })
  }
}

export const resetExecutionResultReducer: CaseReducer<
  ExecutionState,
  PayloadAction
> = (state, action) => {
  return executionInitialState
}

export const setWidgetLayoutInfoReducer: CaseReducer<
  ExecutionState,
  PayloadAction<ExecutionState["widgetsLayoutInfo"]>
> = (state, action) => {
  state.widgetsLayoutInfo = action.payload
}

export const updateWidgetLayoutInfoReducer: CaseReducer<
  ExecutionState,
  PayloadAction<UpdateWidgetLayoutInfoPayload>
> = (state, action) => {
  if (!state) return
  const { displayName, layoutInfo } = action.payload
  const widgetsLayoutInfo = state.widgetsLayoutInfo
  const currentWidget = widgetsLayoutInfo[displayName]
  if (!currentWidget || !layoutInfo || Object.keys(layoutInfo).length === 0) {
    return
  }
  currentWidget.layoutInfo = {
    ...currentWidget.layoutInfo,
    ...layoutInfo,
  }
}

export const batchUpdateWidgetLayoutInfoReducer: CaseReducer<
  ExecutionState,
  PayloadAction<UpdateWidgetLayoutInfoPayload[]>
> = (state, action) => {
  if (!state) return
  action.payload.forEach((updateSlice) => {
    const { displayName, layoutInfo } = updateSlice
    const widgetsLayoutInfo = state.widgetsLayoutInfo
    const currentWidget = widgetsLayoutInfo[displayName]
    if (!currentWidget || !layoutInfo || Object.keys(layoutInfo).length === 0) {
      return
    }
    currentWidget.layoutInfo = {
      ...currentWidget.layoutInfo,
      ...layoutInfo,
    }
  })
}

export const updateWidgetLayoutInfoWhenChangeDisplayNameReducer: CaseReducer<
  ExecutionState,
  PayloadAction<{ oldDisplayName: string; newDisplayName: string }>
> = (state, action) => {
  const { oldDisplayName, newDisplayName } = action.payload
  const widgetsLayoutInfo = state.widgetsLayoutInfo
  const currentWidget = widgetsLayoutInfo[oldDisplayName]
  if (!currentWidget) return
  delete widgetsLayoutInfo[oldDisplayName]
  widgetsLayoutInfo[newDisplayName] = currentWidget
}

export const setGlobalStateInExecutionReducer: CaseReducer<
  ExecutionState,
  PayloadAction<{
    key: string
    value: unknown
  }>
> = (state, action) => {
  const result = state.result
  if (!result) return
  const globalState = result.globalData
  const rootNode = result.root
  const rootGlobalState = rootNode.globalData
  if (!globalState || !rootGlobalState) return
  globalState[action.payload.key] = action.payload.value
  rootGlobalState[action.payload.key] = action.payload.value
}

export const setInGlobalStateInExecutionReducer: CaseReducer<
  ExecutionState,
  PayloadAction<{
    key: string
    path: string
    value: unknown
  }>
> = (state, action) => {
  const result = state.result
  if (!result) return
  const globalState = result.globalData
  const rootNode = result.root
  const rootGlobalState = rootNode.globalData
  if (!isObject(globalState) || !isObject(rootGlobalState)) return
  const targetState = globalState[action.payload.key]
  const targetRootState = rootGlobalState[action.payload.key]
  if (
    (isObject(targetState) || Array.isArray(targetState)) &&
    has(targetState, action.payload.path)
  ) {
    set(targetState, action.payload.path, action.payload.value)
    set(targetRootState, action.payload.path, action.payload.value)
  }
}

export const clearLocalStorageInExecutionReducer: CaseReducer<
  ExecutionState,
  PayloadAction
> = (state, action) => {
  state.result.localStorage = {}
}

export const setLocalStorageInExecutionReducer: CaseReducer<
  ExecutionState,
  PayloadAction<{
    key: string
    value: unknown
  }>
> = (state, action) => {
  const { key, value } = action.payload
  const localStorage = state.result.localStorage ?? {}
  const newLocalStorage = {
    ...localStorage,
    [key]: value,
  }
  state.result.localStorage = newLocalStorage
  window.localStorage.setItem(
    CUSTOM_STORAGE_PREFIX,
    JSON.stringify(newLocalStorage),
  )
}
