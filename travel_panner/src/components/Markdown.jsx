import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Renders AI replies. Raw HTML in the text is ignored, so this is safe for untrusted content.
export default function Markdown({ children }) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{ a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" /> }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
