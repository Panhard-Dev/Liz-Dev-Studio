import { Context } from "effect"
import type { InstanceContext } from "@/project/instance"
import type { WorkspaceID } from "@/control-plane/schema"

export const InstanceRef = Context.Reference<InstanceContext | undefined>("~liz/InstanceRef", {
  defaultValue: () => undefined,
})

export const WorkspaceRef = Context.Reference<WorkspaceID | undefined>("~liz/WorkspaceRef", {
  defaultValue: () => undefined,
})
