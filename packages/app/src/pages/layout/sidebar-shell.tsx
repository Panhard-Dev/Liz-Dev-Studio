import { createEffect, createMemo, For, Show, type Accessor, type JSX } from "solid-js"
import {
  DragDropProvider,
  DragDropSensors,
  DragOverlay,
  SortableProvider,
  closestCenter,
  type DragEvent,
} from "@thisbeyond/solid-dnd"
import { ConstrainDragXAxis } from "@/utils/solid-dnd"
import { Avatar } from "@liz-ai-brasil/ui/avatar"
import { IconButton } from "@liz-ai-brasil/ui/icon-button"
import { Tooltip, TooltipKeybind } from "@liz-ai-brasil/ui/tooltip"
import { type LocalProject } from "@/context/layout"
import { DropdownMenu } from "@liz-ai-brasil/ui/dropdown-menu"
import defaultProfileAvatar from "./default-profile-avatar.svg"

const DEFAULT_PROFILE_AVATAR = defaultProfileAvatar

export const SidebarContent = (props: {
  mobile?: boolean
  opened: Accessor<boolean>
  aimMove: (event: MouseEvent) => void
  projects: Accessor<LocalProject[]>
  renderProject: (project: LocalProject) => JSX.Element
  handleDragStart: (event: unknown) => void
  handleDragEnd: () => void
  handleDragOver: (event: DragEvent) => void
  openProjectLabel: JSX.Element
  openProjectKeybind: Accessor<string | undefined>
  onOpenProject: () => void
  renderProjectOverlay: () => JSX.Element
  profileLabel: Accessor<string>
  profileFallback: Accessor<string>
  profileAvatarUrl: Accessor<string | undefined>
  profileConnected: Accessor<boolean>
  onOpenProfile: () => void
  onDisconnectProfile: () => void
  settingsLabel: Accessor<string>
  settingsKeybind: Accessor<string | undefined>
  onOpenSettings: () => void
  helpLabel: Accessor<string>
  onOpenHelp: () => void
  renderPanel: () => JSX.Element
}): JSX.Element => {
  const expanded = createMemo(() => !!props.mobile || props.opened())
  const placement = () => (props.mobile ? "bottom" : "right")
  let panel: HTMLDivElement | undefined

  createEffect(() => {
    const el = panel
    if (!el) return
    if (expanded()) {
      el.removeAttribute("inert")
      return
    }
    el.setAttribute("inert", "")
  })

  return (
    <div class="flex h-full w-full min-w-0 overflow-hidden">
      <div
        data-component="sidebar-rail"
        class="w-16 shrink-0 bg-background-base flex flex-col items-center overflow-hidden"
        onMouseMove={props.aimMove}
      >
        <div class="flex-1 min-h-0 w-full">
          <DragDropProvider
            onDragStart={props.handleDragStart}
            onDragEnd={props.handleDragEnd}
            onDragOver={props.handleDragOver}
            collisionDetector={closestCenter}
          >
            <DragDropSensors />
            <ConstrainDragXAxis />
            <div class="h-full w-full flex flex-col items-center gap-3 px-3 py-3 overflow-y-auto no-scrollbar">
              <SortableProvider ids={props.projects().map((p) => p.worktree)}>
                <For each={props.projects()}>{(project) => props.renderProject(project)}</For>
              </SortableProvider>
              <Tooltip
                placement={placement()}
                value={
                  <div class="flex items-center gap-2">
                    <span>{props.openProjectLabel}</span>
                    <Show when={!props.mobile && !!props.openProjectKeybind()}>
                      <span class="text-icon-base text-12-medium">{props.openProjectKeybind()}</span>
                    </Show>
                  </div>
                }
              >
                <IconButton
                  icon="plus"
                  variant="ghost"
                  size="large"
                  onClick={props.onOpenProject}
                  aria-label={typeof props.openProjectLabel === "string" ? props.openProjectLabel : undefined}
                />
              </Tooltip>
            </div>
            <DragOverlay>{props.renderProjectOverlay()}</DragOverlay>
          </DragDropProvider>
        </div>
        <div class="shrink-0 w-full pt-3 pb-6 flex flex-col items-center gap-2">
          <Show
            when={props.profileConnected()}
            fallback={
              <Tooltip placement={placement()} value={props.profileLabel()}>
                <button
                  data-component="icon-button"
                  data-size="large"
                  data-variant="ghost"
                  class="relative"
                  onClick={props.onOpenProfile}
                  aria-label={props.profileLabel()}
                >
                  <Avatar
                    class="size-6 rounded-md"
                    fallback={props.profileFallback()}
                    src={props.profileAvatarUrl() || DEFAULT_PROFILE_AVATAR}
                  />
                </button>
              </Tooltip>
            }
          >
            <DropdownMenu modal={!props.mobile} placement={placement()}>
              <DropdownMenu.Trigger
                as="button"
                data-component="icon-button"
                data-size="large"
                data-variant="ghost"
                class="relative"
                aria-label={props.profileLabel()}
              >
                <Avatar
                  class="size-6 rounded-md"
                  fallback={props.profileFallback()}
                  src={props.profileAvatarUrl() || DEFAULT_PROFILE_AVATAR}
                />
                <span class="absolute right-0.5 bottom-0.5 size-1.5 rounded-full bg-text-interactive-base" />
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content class="mt-1">
                  <DropdownMenu.Item disabled>
                    <DropdownMenu.ItemLabel>{props.profileLabel()}</DropdownMenu.ItemLabel>
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item onSelect={props.onDisconnectProfile}>
                    <DropdownMenu.ItemLabel>Desconectar</DropdownMenu.ItemLabel>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu>
          </Show>
          <TooltipKeybind placement={placement()} title={props.settingsLabel()} keybind={props.settingsKeybind() ?? ""}>
            <IconButton
              icon="settings-gear"
              variant="ghost"
              size="large"
              onClick={props.onOpenSettings}
              aria-label={props.settingsLabel()}
            />
          </TooltipKeybind>
          <Tooltip placement={placement()} value={props.helpLabel()}>
            <IconButton
              icon="help"
              variant="ghost"
              size="large"
              onClick={props.onOpenHelp}
              aria-label={props.helpLabel()}
            />
          </Tooltip>
        </div>
      </div>

      <div
        ref={(el) => {
          panel = el
        }}
        classList={{ "flex-1 flex h-full min-h-0 min-w-0 overflow-hidden": true, "pointer-events-none": !expanded() }}
        aria-hidden={!expanded()}
      >
        {props.renderPanel()}
      </div>
    </div>
  )
}
