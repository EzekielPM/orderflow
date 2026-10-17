'use client'

import { useEffect } from 'react'

const replaceBrand = value => typeof value === 'string' ? value.replaceAll('OrderFlow', 'TradeFlow') : value

export default function TradeFlowBranding() {
  useEffect(() => {
    const updateNode = node => {
      if (node.nodeType === Node.TEXT_NODE && node.nodeValue?.includes('OrderFlow')) {
        node.nodeValue = replaceBrand(node.nodeValue)
        return
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return

      for (const attr of ['aria-label', 'title', 'placeholder', 'alt']) {
        const value = node.getAttribute?.(attr)
        if (value?.includes('OrderFlow')) node.setAttribute(attr, replaceBrand(value))
      }
    }

    const updateTree = root => {
      updateNode(root)
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT)
      while (walker.nextNode()) updateNode(walker.currentNode)
    }

    updateTree(document.body)

    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') updateNode(mutation.target)
        mutation.addedNodes.forEach(updateTree)
      }
    })

    observer.observe(document.body, { subtree: true, childList: true, characterData: true })
    return () => observer.disconnect()
  }, [])

  return null
}
