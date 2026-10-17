'use client'

import { useEffect } from 'react'

const replaceBrand = value => {
  if (typeof value !== 'string') return value
  return value
    .replaceAll('OrderFlow', 'TradeFlow')
    .replaceAll('Orderflow', 'TradeFlow')
    .replaceAll('ORDERFLOW', 'TRADEFLOW')
}

export default function TradeFlowBranding() {
  useEffect(() => {
    const updateElementBranding = element => {
      if (!(element instanceof Element)) return

      for (const attr of ['aria-label', 'title', 'placeholder', 'alt']) {
        const value = element.getAttribute(attr)
        if (value && /orderflow/i.test(value)) element.setAttribute(attr, replaceBrand(value))
      }

      if (element.matches('.orderflow-logo strong, .ux-header-brand')) {
        if (element.textContent?.trim().toLowerCase() === 'orderflow') {
          element.innerHTML = 'Trade<span>Flow</span>'
        }
      }

      if (element.matches('.brand') && element.textContent?.trim().toLowerCase() === 'orderflow') {
        element.textContent = 'TradeFlow'
      }
    }

    const updateNode = node => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (/orderflow/i.test(node.nodeValue || '')) node.nodeValue = replaceBrand(node.nodeValue)
        return
      }

      if (node.nodeType === Node.ELEMENT_NODE) updateElementBranding(node)
    }

    const updateTree = root => {
      updateNode(root)
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT)
      while (walker.nextNode()) updateNode(walker.currentNode)
    }

    const originalOpen = window.open
    window.open = function patchedOpen(url, ...args) {
      const nextUrl = typeof url === 'string' ? replaceBrand(url) : url
      return originalOpen.call(window, nextUrl, ...args)
    }

    updateTree(document.body)

    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') updateNode(mutation.target)
        mutation.addedNodes.forEach(updateTree)
        if (mutation.target?.nodeType === Node.ELEMENT_NODE) updateElementBranding(mutation.target)
      }
    })

    observer.observe(document.body, { subtree: true, childList: true, characterData: true })

    return () => {
      observer.disconnect()
      window.open = originalOpen
    }
  }, [])

  return null
}
