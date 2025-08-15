"use client"

import { Highlight, themes } from 'prism-react-renderer'
import { motion } from 'framer-motion'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface RustCodeBlockProps {
  code: string
  filename?: string
  showLineNumbers?: boolean
  className?: string
}

// Custom Rust theme based on VS Code Dark+
const customTheme = {
  ...themes.vsDark,
  styles: [
    ...themes.vsDark.styles,
    {
      types: ['comment'],
      style: {
        color: '#6A9955',
        fontStyle: 'italic' as const,
      },
    },
    {
      types: ['keyword', 'control'],
      style: {
        color: '#C586C0',
      },
    },
    {
      types: ['function', 'method'],
      style: {
        color: '#DCDCAA',
      },
    },
    {
      types: ['string'],
      style: {
        color: '#CE9178',
      },
    },
    {
      types: ['number'],
      style: {
        color: '#B5CEA8',
      },
    },
    {
      types: ['variable', 'parameter'],
      style: {
        color: '#9CDCFE',
      },
    },
    {
      types: ['type', 'class-name'],
      style: {
        color: '#4EC9B0',
      },
    },
    {
      types: ['macro'],
      style: {
        color: '#569CD6',
      },
    },
    {
      types: ['attribute', 'decorator'],
      style: {
        color: '#FFD700',
      },
    },
    {
      types: ['operator'],
      style: {
        color: '#D4D4D4',
      },
    },
    {
      types: ['punctuation'],
      style: {
        color: '#D4D4D4',
      },
    },
    {
      types: ['constant'],
      style: {
        color: '#4FC1FF',
      },
    },
  ],
}

export default function RustCodeBlock({ 
  code, 
  filename, 
  showLineNumbers = true,
  className = ""
}: RustCodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Pre-process code to enhance Rust syntax detection
  const processedCode = code
    // Highlight impl blocks
    .replace(/\b(impl)(\s+)(\w+)/g, 'impl $3')
    .replace(/\b(impl)(<[^>]+>)?(\s+)(\w+)(\s+)(for)(\s+)(\w+)/g, 'impl$2 $4 for $8')
    // Highlight trait definitions
    .replace(/\b(trait)(\s+)(\w+)/g, 'trait $3')
    // Highlight pub keywords
    .replace(/\b(pub)(\s+)(fn|struct|enum|trait|mod|use)/g, 'pub $3')
    // Highlight async/await
    .replace(/\b(async)(\s+)(fn)/g, 'async fn')
    // Highlight Result and Option types
    .replace(/\b(Result|Option|Vec|Box|Arc|Rc|RefCell|Mutex|RwLock)\b/g, '$1')
    // Highlight self
    .replace(/\b(self|Self)\b/g, '$1')
    // Highlight macros
    .replace(/(\w+)!/g, '$1!')
    // Highlight lifetime annotations
    .replace(/'(\w+)/g, "'$1")

  return (
    <div className={`relative group ${className}`}>
      {filename && (
        <div className="flex items-center justify-between bg-zinc-900 border-b border-zinc-800 px-4 py-2 rounded-t-lg">
          <span className="text-xs font-mono text-zinc-400">{filename}</span>
          <button
            onClick={handleCopy}
            className="text-zinc-400 hover:text-white transition-colors p-1 rounded hover:bg-zinc-800"
            title="Copy code"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      )}
      
      <div className={`bg-black/50 ${filename ? '' : 'rounded-lg'} ${filename ? 'rounded-b-lg' : ''} border ${filename ? 'border-t-0' : ''} border-zinc-800 overflow-x-auto`}>
        <Highlight
          theme={customTheme}
          code={processedCode.trim()}
          language="rust"
        >
          {({ className: highlightClassName, style, tokens, getLineProps, getTokenProps }) => (
            <pre 
              className={`${highlightClassName} text-xs font-mono p-4`}
              style={{ ...style, background: 'transparent', margin: 0 }}
            >
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line, key: i })} className="table-row">
                  {showLineNumbers && (
                    <span className="table-cell text-zinc-600 pr-4 select-none text-right">
                      {i + 1}
                    </span>
                  )}
                  <span className="table-cell">
                    {line.map((token, key) => {
                      // Special handling for certain Rust keywords and patterns
                      const tokenContent = token.content
                      let extraProps = {}

                      // Highlight impl blocks
                      if (tokenContent === 'impl' || tokenContent === 'trait' || tokenContent === 'pub') {
                        extraProps = { style: { color: '#569CD6', fontWeight: 'bold' } }
                      }
                      // Highlight types
                      else if (/^[A-Z]/.test(tokenContent) && tokenContent !== 'Self') {
                        extraProps = { style: { color: '#4EC9B0' } }
                      }
                      // Highlight self/Self
                      else if (tokenContent === 'self' || tokenContent === 'Self') {
                        extraProps = { style: { color: '#569CD6', fontStyle: 'italic' } }
                      }
                      // Highlight Result/Option
                      else if (['Result', 'Option', 'Vec', 'Box', 'Arc', 'Mutex'].includes(tokenContent)) {
                        extraProps = { style: { color: '#4EC9B0' } }
                      }
                      // Highlight async/await
                      else if (tokenContent === 'async' || tokenContent === 'await') {
                        extraProps = { style: { color: '#C586C0' } }
                      }
                      // Highlight macros
                      else if (tokenContent.endsWith('!')) {
                        extraProps = { style: { color: '#4EC9B0' } }
                      }
                      // Highlight lifetimes
                      else if (tokenContent.startsWith("'")) {
                        extraProps = { style: { color: '#FFB86C' } }
                      }
                      // Highlight &mut and &
                      else if (tokenContent === '&mut' || tokenContent === '&') {
                        extraProps = { style: { color: '#C586C0' } }
                      }

                      return (
                        <span key={key} {...getTokenProps({ token, key })} {...extraProps} />
                      )
                    })}
                  </span>
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>

      {!filename && (
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-white p-2 rounded hover:bg-zinc-800/50"
          title="Copy code"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  )
}