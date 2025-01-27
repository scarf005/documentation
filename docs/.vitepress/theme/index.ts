// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import { onMounted, nextTick, watch } from 'vue'
import { inBrowser, useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

import Layout from './layout.vue'

import TwoslashFloatingVue from '@shikijs/vitepress-twoslash/client'
import '@shikijs/vitepress-twoslash/style.css'

import './custom.css'

import type { EnhanceAppContext } from 'vitepress'
import type { Theme } from 'vitepress'

export default {
    extends: DefaultTheme,
    Layout,
    enhanceApp({ app }: EnhanceAppContext) {
        app.use(TwoslashFloatingVue)
    },

    // https://github.com/vuejs/vitepress/issues/2954#issuecomment-2517789015
    setup() {
        if (!inBrowser) return
        const route = useRoute()

        // Click on the tab with the given label text
        const showCodeWithLabel = (labelText: string) => {
            document
                .querySelectorAll<HTMLLabelElement>(
                    `.vp-code-group .tabs label`
                )
                .forEach((label) => {
                    if (label.innerText !== labelText) return
                    const forAttr = label.getAttribute('for')
                    if (!forAttr) return

                    const input = document.getElementById(forAttr)
                    if (!(input as any)?.checked) label.click()
                })
        }

        let preventScroll = false

        function bindClickEvents() {
            // Find all the labels
            const labels = document.querySelectorAll(
                '.vp-code-group .tabs label'
            )

            labels.forEach((label) => {
                label.addEventListener('click', ($event) => {
                    const labelFor = label.getAttribute('for')
                    const initialRect = label.getBoundingClientRect()
                    const initialScrollY = window.scrollY

                    // Save the selected tab
                    localStorage.setItem(
                        'codeGroupTab',
                        (label as any).innerText
                    )

                    // Show the selected tab on each code group
                    showCodeWithLabel((label as any).innerText)

                    // Use nextTick to ensure DOM is updated and scroll to the position
                    // so that the clicked label is at the same position as before
                    nextTick(() => {
                        if (preventScroll || !$event.isTrusted) return

                        // Find the new position of the label
                        const labelNew = document.querySelector(
                            `label[for="${labelFor}"]`
                        )
                        if (!labelNew) return
                        const newRect = labelNew.getBoundingClientRect()

                        // Calculate the difference in position relative to the document
                        const yDiff =
                            newRect.top +
                            window.scrollY -
                            (initialRect.top + initialScrollY)

                        // Scroll to maintain the label's position
                        scrollToY(initialScrollY + yDiff)
                    })
                })
            })
        }

        // Scroll to the given Y position without animation
        function scrollToY(y: number) {
            window.scrollTo({
                top: y,
                behavior: 'instant'
            })
        }

        // Select the given tab and scroll to the top of the page
        function selectTabAndScrollToTop(tab) {
            if (!tab) {
                return
            }

            // Restore the last selected tab and scroll back to to top
            // Enable 'preventScroll' to avoid scrolling to all the tabs
            preventScroll = true
            showCodeWithLabel(tab)
            nextTick(() => {
                preventScroll = false
                scrollToY(0)
            })
        }

        // Bind click event on initial page and restore the last selected tab
        onMounted(() =>
            nextTick(() => {
                bindClickEvents()
                selectTabAndScrollToTop(localStorage.getItem('codeGroupTab'))
            })
        )

        watch(
            () => route.path,
            () => {
                nextTick(() => {
                    // Bind click event on new page
                    bindClickEvents()
                    selectTabAndScrollToTop(
                        localStorage.getItem('codeGroupTab')
                    )
                })
            }
        )
    }
} satisfies Theme
