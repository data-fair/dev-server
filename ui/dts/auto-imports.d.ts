/* eslint-disable */
/* prettier-ignore */
// @ts-nocheck
// noinspection JSUnusedGlobalSymbols
// Generated by unplugin-auto-import
// biome-ignore lint: disable
export {}
declare global {
  const EffectScope: typeof import('vue')['EffectScope']
  const computed: typeof import('vue')['computed']
  const createApp: typeof import('vue')['createApp']
  const customRef: typeof import('vue')['customRef']
  const defineAsyncComponent: typeof import('vue')['defineAsyncComponent']
  const defineComponent: typeof import('vue')['defineComponent']
  const dfPersonalMenu: typeof import('@data-fair/lib-vuetify/personal-menu.vue')['default']
  const dfTutorialAlert: typeof import('@data-fair/lib-vuetify/tutorial-alert.vue')['default']
  const dfUserAvatar: typeof import('@data-fair/lib-vuetify/user-avatar.vue')['default']
  const effectScope: typeof import('vue')['effectScope']
  const getCurrentInstance: typeof import('vue')['getCurrentInstance']
  const getCurrentScope: typeof import('vue')['getCurrentScope']
  const h: typeof import('vue')['h']
  const inject: typeof import('vue')['inject']
  const isProxy: typeof import('vue')['isProxy']
  const isReactive: typeof import('vue')['isReactive']
  const isReadonly: typeof import('vue')['isReadonly']
  const isRef: typeof import('vue')['isRef']
  const markRaw: typeof import('vue')['markRaw']
  const nextTick: typeof import('vue')['nextTick']
  const onActivated: typeof import('vue')['onActivated']
  const onBeforeMount: typeof import('vue')['onBeforeMount']
  const onBeforeRouteLeave: typeof import('vue-router')['onBeforeRouteLeave']
  const onBeforeRouteUpdate: typeof import('vue-router')['onBeforeRouteUpdate']
  const onBeforeUnmount: typeof import('vue')['onBeforeUnmount']
  const onBeforeUpdate: typeof import('vue')['onBeforeUpdate']
  const onDeactivated: typeof import('vue')['onDeactivated']
  const onErrorCaptured: typeof import('vue')['onErrorCaptured']
  const onMounted: typeof import('vue')['onMounted']
  const onRenderTracked: typeof import('vue')['onRenderTracked']
  const onRenderTriggered: typeof import('vue')['onRenderTriggered']
  const onScopeDispose: typeof import('vue')['onScopeDispose']
  const onServerPrefetch: typeof import('vue')['onServerPrefetch']
  const onUnmounted: typeof import('vue')['onUnmounted']
  const onUpdated: typeof import('vue')['onUpdated']
  const onWatcherCleanup: typeof import('vue')['onWatcherCleanup']
  const provide: typeof import('vue')['provide']
  const reactive: typeof import('vue')['reactive']
  const readonly: typeof import('vue')['readonly']
  const ref: typeof import('vue')['ref']
  const resolveComponent: typeof import('vue')['resolveComponent']
  const shallowReactive: typeof import('vue')['shallowReactive']
  const shallowReadonly: typeof import('vue')['shallowReadonly']
  const shallowRef: typeof import('vue')['shallowRef']
  const toRaw: typeof import('vue')['toRaw']
  const toRef: typeof import('vue')['toRef']
  const toRefs: typeof import('vue')['toRefs']
  const toValue: typeof import('vue')['toValue']
  const triggerRef: typeof import('vue')['triggerRef']
  const unref: typeof import('vue')['unref']
  const useAsyncAction: typeof import('@data-fair/lib-vue/async-action.js')['useAsyncAction']
  const useAttrs: typeof import('vue')['useAttrs']
  const useBooleanSearchParam: typeof import('@data-fair/lib-vue/reactive-search-params.js')['useBooleanSearchParam']
  const useConceptFilters: typeof import('@data-fair/lib-vue/concept-filters.js')['useConceptFilters']
  const useCssModule: typeof import('vue')['useCssModule']
  const useCssVars: typeof import('vue')['useCssVars']
  const useFetch: typeof import('@data-fair/lib-vue/fetch.js')['useFetch']
  const useI18n: typeof import('vue-i18n')['useI18n']
  const useId: typeof import('vue')['useId']
  const useLink: typeof import('vue-router')['useLink']
  const useLocaleDayjs: typeof import('@data-fair/lib-vue/locale-dayjs.js')['useLocaleDayjs']
  const useModel: typeof import('vue')['useModel']
  const useNumberSearchParam: typeof import('@data-fair/lib-vue/reactive-search-params.js')['useNumberSearchParam']
  const useReactiveSearchParams: typeof import('@data-fair/lib-vue/reactive-search-params.js')['useReactiveSearchParams']
  const useRoute: typeof import('vue-router')['useRoute']
  const useRouter: typeof import('vue-router')['useRouter']
  const useSession: typeof import('@data-fair/lib-vue/session.js')['useSession']
  const useSessionAuthenticated: typeof import('@data-fair/lib-vue/session.js')['useSessionAuthenticated']
  const useSlots: typeof import('vue')['useSlots']
  const useStringSearchParam: typeof import('@data-fair/lib-vue/reactive-search-params.js')['useStringSearchParam']
  const useStringsArraySearchParam: typeof import('@data-fair/lib-vue/reactive-search-params.js')['useStringsArraySearchParam']
  const useTemplateRef: typeof import('vue')['useTemplateRef']
  const useUiNotif: typeof import('@data-fair/lib-vue/ui-notif.js')['useUiNotif']
  const useWS: typeof import('@data-fair/lib-vue/ws.js')['useWS']
  const watch: typeof import('vue')['watch']
  const watchEffect: typeof import('vue')['watchEffect']
  const watchPostEffect: typeof import('vue')['watchPostEffect']
  const watchSyncEffect: typeof import('vue')['watchSyncEffect']
  const withUiNotif: typeof import('@data-fair/lib-vue/ui-notif.js')['withUiNotif']
}
// for type re-export
declare global {
  // @ts-ignore
  export type { Component, Slot, Slots, ComponentPublicInstance, ComputedRef, DirectiveBinding, ExtractDefaultPropTypes, ExtractPropTypes, ExtractPublicPropTypes, InjectionKey, PropType, Ref, MaybeRef, MaybeRefOrGetter, VNode, WritableComputedRef } from 'vue'
  import('vue')
  // @ts-ignore
  export type { Organization, User, Member, Partner, Invitation, Site, Limits } from '@sd/api/types'
  import('@sd/api/types')
}

// for vue template auto import
import { UnwrapRef } from 'vue'
declare module 'vue' {
  interface GlobalComponents {}
  interface ComponentCustomProperties {
    readonly EffectScope: UnwrapRef<typeof import('vue')['EffectScope']>
    readonly computed: UnwrapRef<typeof import('vue')['computed']>
    readonly createApp: UnwrapRef<typeof import('vue')['createApp']>
    readonly customRef: UnwrapRef<typeof import('vue')['customRef']>
    readonly defineAsyncComponent: UnwrapRef<typeof import('vue')['defineAsyncComponent']>
    readonly defineComponent: UnwrapRef<typeof import('vue')['defineComponent']>
    readonly dfPersonalMenu: UnwrapRef<typeof import('@data-fair/lib-vuetify/personal-menu.vue')['default']>
    readonly dfTutorialAlert: UnwrapRef<typeof import('@data-fair/lib-vuetify/tutorial-alert.vue')['default']>
    readonly dfUserAvatar: UnwrapRef<typeof import('@data-fair/lib-vuetify/user-avatar.vue')['default']>
    readonly effectScope: UnwrapRef<typeof import('vue')['effectScope']>
    readonly getCurrentInstance: UnwrapRef<typeof import('vue')['getCurrentInstance']>
    readonly getCurrentScope: UnwrapRef<typeof import('vue')['getCurrentScope']>
    readonly h: UnwrapRef<typeof import('vue')['h']>
    readonly inject: UnwrapRef<typeof import('vue')['inject']>
    readonly isProxy: UnwrapRef<typeof import('vue')['isProxy']>
    readonly isReactive: UnwrapRef<typeof import('vue')['isReactive']>
    readonly isReadonly: UnwrapRef<typeof import('vue')['isReadonly']>
    readonly isRef: UnwrapRef<typeof import('vue')['isRef']>
    readonly markRaw: UnwrapRef<typeof import('vue')['markRaw']>
    readonly nextTick: UnwrapRef<typeof import('vue')['nextTick']>
    readonly onActivated: UnwrapRef<typeof import('vue')['onActivated']>
    readonly onBeforeMount: UnwrapRef<typeof import('vue')['onBeforeMount']>
    readonly onBeforeRouteLeave: UnwrapRef<typeof import('vue-router')['onBeforeRouteLeave']>
    readonly onBeforeRouteUpdate: UnwrapRef<typeof import('vue-router')['onBeforeRouteUpdate']>
    readonly onBeforeUnmount: UnwrapRef<typeof import('vue')['onBeforeUnmount']>
    readonly onBeforeUpdate: UnwrapRef<typeof import('vue')['onBeforeUpdate']>
    readonly onDeactivated: UnwrapRef<typeof import('vue')['onDeactivated']>
    readonly onErrorCaptured: UnwrapRef<typeof import('vue')['onErrorCaptured']>
    readonly onMounted: UnwrapRef<typeof import('vue')['onMounted']>
    readonly onRenderTracked: UnwrapRef<typeof import('vue')['onRenderTracked']>
    readonly onRenderTriggered: UnwrapRef<typeof import('vue')['onRenderTriggered']>
    readonly onScopeDispose: UnwrapRef<typeof import('vue')['onScopeDispose']>
    readonly onServerPrefetch: UnwrapRef<typeof import('vue')['onServerPrefetch']>
    readonly onUnmounted: UnwrapRef<typeof import('vue')['onUnmounted']>
    readonly onUpdated: UnwrapRef<typeof import('vue')['onUpdated']>
    readonly onWatcherCleanup: UnwrapRef<typeof import('vue')['onWatcherCleanup']>
    readonly provide: UnwrapRef<typeof import('vue')['provide']>
    readonly reactive: UnwrapRef<typeof import('vue')['reactive']>
    readonly readonly: UnwrapRef<typeof import('vue')['readonly']>
    readonly ref: UnwrapRef<typeof import('vue')['ref']>
    readonly resolveComponent: UnwrapRef<typeof import('vue')['resolveComponent']>
    readonly shallowReactive: UnwrapRef<typeof import('vue')['shallowReactive']>
    readonly shallowReadonly: UnwrapRef<typeof import('vue')['shallowReadonly']>
    readonly shallowRef: UnwrapRef<typeof import('vue')['shallowRef']>
    readonly toRaw: UnwrapRef<typeof import('vue')['toRaw']>
    readonly toRef: UnwrapRef<typeof import('vue')['toRef']>
    readonly toRefs: UnwrapRef<typeof import('vue')['toRefs']>
    readonly toValue: UnwrapRef<typeof import('vue')['toValue']>
    readonly triggerRef: UnwrapRef<typeof import('vue')['triggerRef']>
    readonly unref: UnwrapRef<typeof import('vue')['unref']>
    readonly useAsyncAction: UnwrapRef<typeof import('@data-fair/lib-vue/async-action.js')['useAsyncAction']>
    readonly useAttrs: UnwrapRef<typeof import('vue')['useAttrs']>
    readonly useBooleanSearchParam: UnwrapRef<typeof import('@data-fair/lib-vue/reactive-search-params.js')['useBooleanSearchParam']>
    readonly useConceptFilters: UnwrapRef<typeof import('@data-fair/lib-vue/concept-filters.js')['useConceptFilters']>
    readonly useCssModule: UnwrapRef<typeof import('vue')['useCssModule']>
    readonly useCssVars: UnwrapRef<typeof import('vue')['useCssVars']>
    readonly useFetch: UnwrapRef<typeof import('@data-fair/lib-vue/fetch.js')['useFetch']>
    readonly useI18n: UnwrapRef<typeof import('vue-i18n')['useI18n']>
    readonly useId: UnwrapRef<typeof import('vue')['useId']>
    readonly useLink: UnwrapRef<typeof import('vue-router')['useLink']>
    readonly useLocaleDayjs: UnwrapRef<typeof import('@data-fair/lib-vue/locale-dayjs.js')['useLocaleDayjs']>
    readonly useModel: UnwrapRef<typeof import('vue')['useModel']>
    readonly useNumberSearchParam: UnwrapRef<typeof import('@data-fair/lib-vue/reactive-search-params.js')['useNumberSearchParam']>
    readonly useReactiveSearchParams: UnwrapRef<typeof import('@data-fair/lib-vue/reactive-search-params.js')['useReactiveSearchParams']>
    readonly useRoute: UnwrapRef<typeof import('vue-router')['useRoute']>
    readonly useRouter: UnwrapRef<typeof import('vue-router')['useRouter']>
    readonly useSession: UnwrapRef<typeof import('@data-fair/lib-vue/session.js')['useSession']>
    readonly useSessionAuthenticated: UnwrapRef<typeof import('@data-fair/lib-vue/session.js')['useSessionAuthenticated']>
    readonly useSlots: UnwrapRef<typeof import('vue')['useSlots']>
    readonly useStringSearchParam: UnwrapRef<typeof import('@data-fair/lib-vue/reactive-search-params.js')['useStringSearchParam']>
    readonly useStringsArraySearchParam: UnwrapRef<typeof import('@data-fair/lib-vue/reactive-search-params.js')['useStringsArraySearchParam']>
    readonly useTemplateRef: UnwrapRef<typeof import('vue')['useTemplateRef']>
    readonly useUiNotif: UnwrapRef<typeof import('@data-fair/lib-vue/ui-notif.js')['useUiNotif']>
    readonly useWS: UnwrapRef<typeof import('@data-fair/lib-vue/ws.js')['useWS']>
    readonly watch: UnwrapRef<typeof import('vue')['watch']>
    readonly watchEffect: UnwrapRef<typeof import('vue')['watchEffect']>
    readonly watchPostEffect: UnwrapRef<typeof import('vue')['watchPostEffect']>
    readonly watchSyncEffect: UnwrapRef<typeof import('vue')['watchSyncEffect']>
    readonly withUiNotif: UnwrapRef<typeof import('@data-fair/lib-vue/ui-notif.js')['withUiNotif']>
  }
}