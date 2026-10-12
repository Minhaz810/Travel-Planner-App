import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate, useParams } from 'react-router-dom'
import { plannerApi } from '../api'
import { useAuth } from '../auth/AuthContext'
import Icon from '../components/Icon'
import Markdown from '../components/Markdown'
import { LANGUAGE_OPTIONS } from '../constants'
import useApi from '../hooks/useApi'
import { formatDate } from '../utils'

const SUGGESTIONS = [
  'Plan 3 days in Sylhet for 2 people under 10,000 taka',
  "Best time to visit Cox's Bazar and how to get there by train",
  'A weekend trip from Dhaka to Sajek Valley',
  'Budget-friendly 5-day trip to the Sundarbans',
]

function chatTitle(chat) {
  return chat.title || 'New chat'
}

function SaveTripForm({ message, defaultTitle, onSaved, onCancel }) {
  const [title, setTitle] = useState(defaultTitle)
  const [startDate, setStartDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const trip = await plannerApi.createTrip({
        source_message: message.id,
        title: title.trim(),
        start_date: startDate || null,
      })
      onSaved(trip)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <form className="save-trip" onSubmit={handleSubmit}>
      <div className="save-trip__fields">
        <label className="field">
          <span className="field__label">Trip title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} required autoFocus />
        </label>
        <label className="field">
          <span className="field__label">Start date (optional)</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
      </div>
      {error && <p className="field__error">{error}</p>}
      <div className="save-trip__actions">
        <button type="button" className="btn btn--ghost btn--sm" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary btn--sm" disabled={saving || !title.trim()}>
          {saving ? <span className="spinner spinner--light" /> : 'Save trip'}
        </button>
      </div>
    </form>
  )
}

function Message({ message, savedTripId, defaultTripTitle, onTripSaved }) {
  const [saving, setSaving] = useState(false)

  if (message.role === 'user') {
    return (
      <div className="msg msg--user">
        <p>{message.text}</p>
      </div>
    )
  }

  return (
    <div className="msg msg--model">
      <span className="msg__avatar">
        <Icon name="sparkles" size={16} />
      </span>
      <div className="msg__body">
        <Markdown>{message.text}</Markdown>
        {saving ? (
          <SaveTripForm
            message={message}
            defaultTitle={defaultTripTitle}
            onCancel={() => setSaving(false)}
            onSaved={(trip) => {
              setSaving(false)
              onTripSaved(trip)
            }}
          />
        ) : (
          <div className="msg__actions">
            {savedTripId ? (
              <Link to={`/trips/${savedTripId}`} className="btn btn--ghost btn--sm">
                <Icon name="check" size={16} />
                Saved · View trip
              </Link>
            ) : (
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setSaving(true)}>
                <Icon name="bookmark" size={16} />
                Save as trip
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ChatHeader({ chat, onRename, onLanguage, onDelete, onOpenSidebar }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(chat.title)

  const submit = async (e) => {
    e.preventDefault()
    await onRename(title.trim())
    setEditing(false)
  }

  return (
    <header className="planner__header">
      <button type="button" className="icon-btn planner__menu" aria-label="Show chats" onClick={onOpenSidebar}>
        <Icon name="menu" size={20} />
      </button>
      {editing ? (
        <form className="planner__rename" onSubmit={submit}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={150}
            aria-label="Chat title"
            autoFocus
          />
          <button type="submit" className="icon-btn" aria-label="Save title">
            <Icon name="check" size={18} />
          </button>
          <button type="button" className="icon-btn" aria-label="Cancel" onClick={() => setEditing(false)}>
            <Icon name="x" size={18} />
          </button>
        </form>
      ) : (
        <h1 className="planner__title">
          {chatTitle(chat)}
          <button
            type="button"
            className="icon-btn"
            aria-label="Rename chat"
            onClick={() => {
              setTitle(chat.title)
              setEditing(true)
            }}
          >
            <Icon name="pencil" size={16} />
          </button>
        </h1>
      )}
      <div className="planner__tools">
        <select value={chat.language} onChange={(e) => onLanguage(e.target.value)} aria-label="Reply language">
          {LANGUAGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button type="button" className="icon-btn icon-btn--danger" aria-label="Delete chat" onClick={onDelete}>
          <Icon name="trash" size={18} />
        </button>
      </div>
    </header>
  )
}

export default function Planner() {
  const { chatId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const chats = useApi(plannerApi.chatsPath)
  const chat = useApi(chatId ? plannerApi.chatPath(chatId) : null)
  const trips = useApi(plannerApi.tripsPath)

  // A destination page can open the planner with a ready-made prompt.
  const [text, setText] = useState(location.state?.prompt || '')
  const [pending, setPending] = useState(null)
  const [sendError, setSendError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [newLanguage, setNewLanguage] = useState(user.profile?.preferred_language || 'en')
  const endRef = useRef(null)

  const messages = chat.data?.messages || []
  const savedTrips = Object.fromEntries(
    (trips.data || []).filter((t) => t.source_message).map((t) => [t.source_message, t.id]),
  )

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, pending])

  // Moves a chat to the top of the sidebar with its latest fields.
  const upsertChat = (updated) => {
    const summary = {
      id: updated.id,
      title: updated.title,
      language: updated.language,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
    }
    chats.setData((list) => [summary, ...(list || []).filter((c) => c.id !== summary.id)])
  }

  const send = async (raw) => {
    const message = raw.trim()
    if (!message || pending) return
    setPending(message)
    setSendError(null)
    setText('')

    let id = chatId ? Number(chatId) : null
    try {
      if (!id) {
        const created = await plannerApi.createChat({ language: newLanguage })
        id = created.id
        upsertChat(created)
        navigate(`/planner/${id}`)
      }
      const res = await plannerApi.sendMessage(id, message)
      if (chat.data?.id === id && chat.data.title) {
        chat.setData((d) => ({ ...d, messages: [...d.messages, res.user_message, res.reply] }))
        upsertChat({ ...chat.data, updated_at: res.reply.created_at })
      } else {
        // First message: reload so the server-generated title is picked up.
        const full = await plannerApi.getChat(id)
        chat.setData(full)
        upsertChat(full)
      }
    } catch (err) {
      setText(message)
      setSendError(err.message)
    } finally {
      setPending(null)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send(text)
    }
  }

  const updateChat = async (changes) => {
    setActionError(null)
    try {
      const updated = await plannerApi.updateChat(chat.data.id, changes)
      chat.setData(updated)
      upsertChat(updated)
    } catch (err) {
      setActionError(err.message)
    }
  }

  const deleteChat = async () => {
    if (!window.confirm('Delete this chat? Trips you saved from it are kept.')) return
    setActionError(null)
    try {
      await plannerApi.deleteChat(chat.data.id)
      chats.setData((list) => list.filter((c) => c.id !== chat.data.id))
      navigate('/planner')
    } catch (err) {
      setActionError(err.message)
    }
  }

  const renderThread = () => {
    if (chatId && chat.loading && !pending) {
      return (
        <div className="page-loader" role="status" aria-label="Loading">
          <span className="spinner" />
        </div>
      )
    }

    if (chatId && chat.error) {
      return (
        <div className="empty-state planner__empty">
          <Icon name="chat" size={28} />
          <h3>{chat.error.status === 404 ? 'Chat not found' : 'Could not load this chat'}</h3>
          <p>{chat.error.status === 404 ? 'It may have been deleted.' : chat.error.message}</p>
          <Link to="/planner" className="btn btn--primary btn--sm">
            Start a new chat
          </Link>
        </div>
      )
    }

    if (!chatId && !pending) {
      return (
        <div className="planner__welcome">
          <span className="feature__icon">
            <Icon name="sparkles" size={22} />
          </span>
          <h2>Where would you like to go?</h2>
          <p>Ask for a trip plan, costs in taka, the best season or how to get there.</p>
          <fieldset className="segmented planner__lang">
            <legend>Reply language</legend>
            <div className="segmented__options">
              {LANGUAGE_OPTIONS.map((o) => (
                <label key={o.value} className={newLanguage === o.value ? 'is-active' : ''}>
                  <input
                    type="radio"
                    name="new_language"
                    value={o.value}
                    checked={newLanguage === o.value}
                    onChange={(e) => setNewLanguage(e.target.value)}
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="planner__suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" className="suggestion" onClick={() => send(s)}>
                {s}
                <Icon name="arrowRight" size={16} />
              </button>
            ))}
          </div>
        </div>
      )
    }

    return (
      <div className="planner__messages">
        {messages.map((m) => (
          <Message
            key={m.id}
            message={m}
            savedTripId={savedTrips[m.id]}
            defaultTripTitle={chat.data?.title || 'My trip'}
            onTripSaved={(trip) => trips.setData((list) => [trip, ...(list || [])])}
          />
        ))}
        {pending && (
          <>
            <div className="msg msg--user">
              <p>{pending}</p>
            </div>
            <div className="msg msg--model">
              <span className="msg__avatar">
                <Icon name="sparkles" size={16} />
              </span>
              <div className="typing" role="status" aria-label="The assistant is typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          </>
        )}
        <div ref={endRef} />
      </div>
    )
  }

  return (
    <div className="planner">
      <aside className={`planner__sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <div className="planner__sidebar-head">
          <Link to="/planner" className="btn btn--primary btn--block" onClick={() => setSidebarOpen(false)}>
            <Icon name="plus" size={18} />
            New chat
          </Link>
          <button
            type="button"
            className="icon-btn planner__menu"
            aria-label="Close chats"
            onClick={() => setSidebarOpen(false)}
          >
            <Icon name="x" size={20} />
          </button>
        </div>
        <nav className="planner__chats" aria-label="Your chats">
          {chats.loading && <span className="spinner" role="status" aria-label="Loading" />}
          {chats.error && <p className="field__error">{chats.error.message}</p>}
          {chats.data?.length === 0 && <p className="muted">No chats yet.</p>}
          {chats.data?.map((c) => (
            <NavLink key={c.id} to={`/planner/${c.id}`} className="chat-link" onClick={() => setSidebarOpen(false)}>
              <span>{chatTitle(c)}</span>
              <small>{formatDate(c.updated_at)}</small>
            </NavLink>
          ))}
        </nav>
        <Link to="/trips" className="planner__trips-link" onClick={() => setSidebarOpen(false)}>
          <Icon name="bookmark" size={16} />
          My saved trips
        </Link>
      </aside>
      {sidebarOpen && <div className="planner__backdrop" onClick={() => setSidebarOpen(false)} />}

      <section className="planner__main">
        {chat.data && chatId ? (
          <ChatHeader
            key={chat.data.id}
            chat={chat.data}
            onRename={(title) => updateChat({ title })}
            onLanguage={(language) => updateChat({ language })}
            onDelete={deleteChat}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        ) : (
          <header className="planner__header">
            <button
              type="button"
              className="icon-btn planner__menu"
              aria-label="Show chats"
              onClick={() => setSidebarOpen(true)}
            >
              <Icon name="menu" size={20} />
            </button>
            <h1 className="planner__title">Trip planner</h1>
          </header>
        )}

        {actionError && (
          <div className="alert alert--error planner__alert" role="alert">
            <Icon name="alert" size={18} />
            {actionError}
          </div>
        )}

        <div className="planner__thread">{renderThread()}</div>

        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault()
            send(text)
          }}
        >
          {sendError && (
            <div className="alert alert--error" role="alert">
              <Icon name="alert" size={18} />
              {sendError}
            </div>
          )}
          <div className="composer__box">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about a trip in Bangladesh…"
              aria-label="Message"
              rows={2}
              maxLength={2000}
              disabled={Boolean(pending) || Boolean(chatId && chat.error)}
            />
            <button
              type="submit"
              className="btn btn--primary composer__send"
              aria-label="Send"
              disabled={!text.trim() || Boolean(pending)}
            >
              {pending ? <span className="spinner spinner--light" /> : <Icon name="send" size={18} />}
            </button>
          </div>
          <p className="composer__hint">Enter to send · Shift + Enter for a new line · AI replies can be wrong, so check costs and times.</p>
        </form>
      </section>
    </div>
  )
}
