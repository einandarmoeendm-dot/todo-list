import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDownWideNarrow, CalendarDays, Check, CheckCheck, ChevronDown, CircleHelp, Clock3, Ellipsis, ListTodo, LogOut, Plus, Search, Settings2, Sparkles, Sun, Moon, Trash2, X, Pencil } from 'lucide-react'

const initialCategories = ['Work', 'Personal', 'Ideas']
const keyFor = (email) => `daylist:${email}`
const todayKey = () => new Date().toISOString().slice(0, 10)
const dateLabel = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())
const rank = { high: 0, medium: 1, low: 2 }

function App() {
  const [account, setAccount] = useState(() => { try { return JSON.parse(localStorage.getItem('daylist:session')) } catch { return null } })
  const [accounts, setAccounts] = useState(() => { try { return JSON.parse(localStorage.getItem('daylist:accounts') || '{}') } catch { return {} } })
  const [authMode, setAuthMode] = useState('login')
  const [auth, setAuth] = useState({ name: '', email: '', password: '' })
  const [authError, setAuthError] = useState('')
  const [tasks, setTasks] = useState([])
  const [categories, setCategories] = useState(initialCategories)
  const [filter, setFilter] = useState('All tasks')
  const [view, setView] = useState('today')
  const [query, setQuery] = useState('')
  const [sortHigh, setSortHigh] = useState(false)
  const [displayMode, setDisplayMode] = useState('list')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState({ title: '', category: 'Work', priority: 'medium', dueDate: todayKey(), notes: '' })
  const [toast, setToast] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [theme, setTheme] = useState(() => localStorage.getItem('daylist:theme') || 'light')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [helpTab, setHelpTab] = useState('help')
  const [feedbackDraft, setFeedbackDraft] = useState({ type: 'Suggestion', message: '' })
  const [preferences, setPreferences] = useState(() => { try { return { defaultView: 'today', priorityFirst: false, language: 'en', region: 'US', notifications: true, reminders: true, accent: 'violet', theme: localStorage.getItem('daylist:theme') || 'light', ...JSON.parse(localStorage.getItem('daylist:preferences') || '{}') } } catch { return { defaultView: 'today', priorityFirst: false, language: 'en', region: 'US', notifications: true, reminders: true, accent: 'violet', theme: 'light' } } })
  const [nameDraft, setNameDraft] = useState('')
  const [passwordDraft, setPasswordDraft] = useState({ current: '', next: '', confirm: '' })
  const [passwordError, setPasswordError] = useState('')
  const loadedFor = useRef(null)

  useEffect(() => { localStorage.setItem('daylist:theme', theme) }, [theme])
  useEffect(() => { localStorage.setItem('daylist:preferences', JSON.stringify(preferences)) }, [preferences])
  function toggleTheme() { setTheme(current => { const next = current === 'light' ? 'dark' : 'light'; setPreferences(p => ({ ...p, theme: next })); return next }) }

  useEffect(() => {
    if (!account) return
    setView(preferences.defaultView)
    setSortHigh(preferences.priorityFirst)
    const saved = JSON.parse(localStorage.getItem(keyFor(account.email)) || '{}')
    setTasks(saved.tasks || [])
    setCategories(saved.categories?.length ? saved.categories : initialCategories)
    loadedFor.current = account.email
  }, [account])
  useEffect(() => {
    if (account && loadedFor.current === account.email) localStorage.setItem(keyFor(account.email), JSON.stringify({ tasks, categories }))
  }, [account, tasks, categories])
  function notify(message) { setToast(message); window.setTimeout(() => setToast(''), 2400) }
  function submitAuth(event) {
    event.preventDefault(); setAuthError('')
    const email = auth.email.trim().toLowerCase()
    if (authMode === 'register') {
      if (auth.password.length < 6) return setAuthError('Use at least 6 characters for your password.')
      if (accounts[email]) return setAuthError('An account with this email already exists.')
      const next = { ...accounts, [email]: { name: auth.name.trim() || email.split('@')[0], password: auth.password } }
      setAccounts(next); localStorage.setItem('daylist:accounts', JSON.stringify(next))
      const session = { email, name: next[email].name }; localStorage.setItem('daylist:session', JSON.stringify(session)); setAccount(session)
    } else {
      if (!accounts[email] || accounts[email].password !== auth.password) return setAuthError('Email or password is incorrect.')
      const session = { email, name: accounts[email].name }; localStorage.setItem('daylist:session', JSON.stringify(session)); setAccount(session)
    }
  }
  function logout() { localStorage.removeItem('daylist:session'); setAccount(null); setTasks([]); setFilter('All tasks'); setView('today') }
  function saveSettings(event) {
    event.preventDefault()
    setPasswordError('')
    const changingPassword = passwordDraft.current || passwordDraft.next || passwordDraft.confirm
    if (changingPassword) {
      if (passwordDraft.current !== accounts[account.email]?.password) return setPasswordError('Current password is incorrect.')
      if (passwordDraft.next.length < 6) return setPasswordError('New password must be at least 6 characters.')
      if (passwordDraft.next !== passwordDraft.confirm) return setPasswordError('New passwords do not match.')
    }
    const name = nameDraft.trim() || account.name
    const nextAccount = { ...account, name }
    setAccount(nextAccount)
    localStorage.setItem('daylist:session', JSON.stringify(nextAccount))
    const nextAccounts = { ...accounts, [account.email]: { ...accounts[account.email], name, ...(changingPassword ? { password: passwordDraft.next } : {}) } }
    setAccounts(nextAccounts)
    localStorage.setItem('daylist:accounts', JSON.stringify(nextAccounts))
    setSortHigh(preferences.priorityFirst)
    setView(preferences.defaultView)
    setTheme(preferences.theme || theme)
    setFilter('All tasks')
    setPasswordDraft({ current: '', next: '', confirm: '' })
    setSettingsOpen(false)
    notify('Settings saved')
  }
  function submitFeedback(event) {
    event.preventDefault()
    const entry = { ...feedbackDraft, message: feedbackDraft.message.trim(), email: account.email, createdAt: new Date().toISOString() }
    if (!entry.message) return
    const previous = JSON.parse(localStorage.getItem('daylist:feedback') || '[]')
    localStorage.setItem('daylist:feedback', JSON.stringify([entry, ...previous]))
    setFeedbackDraft({ type: 'Suggestion', message: '' })
    setHelpOpen(false)
    notify('Feedback saved on this device')
  }
  function openTask(task = null) {
    setEditing(task)
    setDraft(task ? { title: task.title, category: task.category, priority: task.priority, dueDate: task.dueDate || '', notes: task.notes || '' } : { title: '', category: categories[0] || 'General', priority: 'medium', dueDate: todayKey(), notes: '' })
    setModal(true)
  }
  function saveTask(event) {
    event.preventDefault(); const title = draft.title.trim(); if (!title) return
    const values = { ...draft, title, completed: editing?.completed || false }
    if (editing) setTasks(old => old.map(task => task.id === editing.id ? { ...task, ...values } : task))
    else setTasks(old => [{ ...values, id: crypto.randomUUID(), createdAt: Date.now() }, ...old])
    setModal(false); notify(editing ? 'Task updated' : 'Task added')
  }
  function toggleTask(task) { setTasks(old => old.map(item => item.id === task.id ? { ...item, completed: !item.completed, completedAt: !item.completed ? Date.now() : null } : item)) }
  function deleteTask(task) { setTasks(old => old.filter(item => item.id !== task.id)); notify('Task deleted') }
  function addCategory(event) { event.preventDefault(); const name = newCategory.trim(); if (!name) return; if (categories.some(c => c.toLowerCase() === name.toLowerCase())) return notify('That category already exists'); setCategories(old => [...old, name]); setNewCategory(''); notify('Category added') }
  function removeCategory(name) { if (categories.length < 2) return notify('Keep at least one category'); setCategories(old => old.filter(c => c !== name)); setTasks(old => old.map(t => t.category === name ? { ...t, category: categories.find(c => c !== name) } : t)); if (filter === name) setFilter('All tasks') }

  const counts = useMemo(() => ({ today: tasks.filter(t => !t.completed && (!t.dueDate || t.dueDate <= todayKey())).length, upcoming: tasks.filter(t => !t.completed && t.dueDate && t.dueDate > todayKey()).length, completed: tasks.filter(t => t.completed).length }), [tasks])
  const visibleTasks = useMemo(() => {
    let list = [...tasks]
    if (view === 'today') list = list.filter(t => !t.dueDate || t.dueDate <= todayKey())
    if (view === 'upcoming') list = list.filter(t => t.dueDate && t.dueDate > todayKey())
    if (view === 'completed') list = list.filter(t => t.completed)
    if (filter !== 'All tasks') list = list.filter(t => t.category === filter)
    if (query.trim()) list = list.filter(t => `${t.title} ${t.notes} ${t.category}`.toLowerCase().includes(query.toLowerCase()))
    return list.sort((a, b) => Number(a.completed) - Number(b.completed) || (sortHigh ? rank[a.priority] - rank[b.priority] : (b.createdAt || 0) - (a.createdAt || 0)))
  }, [tasks, view, filter, query, sortHigh])
  const title = view === 'today' ? 'Today' : view === 'upcoming' ? 'Upcoming' : 'Completed'
  const progress = tasks.length ? Math.round(counts.completed / tasks.length * 100) : 0

  if (!account) return <div className={`auth-screen ${theme === 'dark' ? 'theme-dark' : ''}`}>
    <button className="theme-toggle auth-theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'night' : 'day'} mode`}>{theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}<span>{theme === 'light' ? 'Night mode' : 'Day mode'}</span>
    </button>
    <div className="auth-card">
      <div className="brand auth-brand">
        <div className="brand-mark">
          <CheckCheck size={19} />
        </div><span>daylist</span>
      </div><div className="auth-eyebrow"><Sparkles size={13} /> YOUR CALM, CLEAR SPACE
    </div><h1>{authMode === 'login' ? 'Welcome back.' : 'Make room for what matters.'}</h1><p className="auth-intro">A little structure goes a long way. Let’s make today count.</p>
    <form className="auth-form" onSubmit={submitAuth}>{authMode === 'register' && 
      <label>Your name<input autoComplete="name" value={auth.name} onChange={e => setAuth({ ...auth, name: e.target.value })} placeholder="How should we call you?" required /></label>}
      <label>Email address<input type="email" autoComplete="email" value={auth.email} onChange={e => setAuth({ ...auth, email: e.target.value })} placeholder="you@example.com" required /></label>
      <label>Password<input type="password" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} value={auth.password} onChange={e => setAuth({ ...auth, password: e.target.value })} placeholder="At least 6 characters" required /></label>{authError && <div className="auth-error">{authError}</div>}
      <button className="primary-button auth-submit" type="submit">{authMode === 'login' ? 'Sign in' : 'Create account'} <ArrowDownWideNarrow size={15} /></button>
      </form><p className="auth-switch">{authMode === 'login' ? 'New to daylist?' : 'Already have an account?'} 
        <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError('') }}>{authMode === 'login' ? 'Create an account' : 'Sign in'}</button></p>
        <div className="auth-foot"><span>Private workspace</span><span>·</span><span>Made for your next small step</span>
        </div>
        </div><div className="auth-decoration auth-decoration-one" />
        <div className="auth-decoration auth-decoration-two" /></div>

  return <div className={`app-shell ${theme === 'dark' ? 'theme-dark' : ''} accent-${preferences.accent || 'violet'}`}><aside className="sidebar">
     <div className="brand">
        <div className="brand-mark"><CheckCheck size={19} strokeWidth={2.4} />
        </div>
        <span>daylist</span>
      </div>
      <div className="user-switch">
        <div className="avatar">{account.name[0]?.toUpperCase()}
        </div>
        <div className="user-copy"><strong>{account.name}’s space</strong>
          <span>Personal workspace</span>
        </div>
          <ChevronDown size={15} className="muted" />
      </div>
      <nav className="primary-nav">
      <button className={`nav-item ${view === 'today' ? 'selected' : ''}`} onClick={() => { setView('today'); setFilter('All tasks') }}><Sun size={17} />
         <span>Today</span>
        <span className="nav-count">{counts.today}</span>
      </button>
      <button className={`nav-item ${view === 'upcoming' ? 'selected' : ''}`} onClick={() => { setView('upcoming'); setFilter('All tasks') }}><CalendarDays size={17} />
        <span>Upcoming</span>
        <span className="nav-count">{counts.upcoming}</span>
      </button>
      <button className={`nav-item ${view === 'completed' ? 'selected' : ''}`} onClick={() => { setView('completed'); setFilter('All tasks') }}><CheckCheck size={17} />
        <span>Completed</span>
        <span className="nav-count">{counts.completed}</span>
      </button>
      </nav>
      <div className="nav-section">
        <div className="section-heading">
          <span>YOUR CATEGORIES</span>
            <button className="tiny-action" aria-label="Add category" onClick={() => document.getElementById('category-name')?.focus()}><Plus size={15} />
            </button>
        </div>
        <button className={`nav-item list-item ${filter === 'All tasks' ? 'selected' : ''}`} onClick={() => { setFilter('All tasks'); setView('today') }}>
          <span className="list-dot" />
          <span>All tasks</span>
          <span className="nav-count">{tasks.filter(t => !t.completed).length}</span>
        </button>

        {categories.map((item, i) => <div className="category-nav-row" key={item}>
        <button className={`nav-item list-item ${filter === item ? 'selected' : ''}`} onClick={() => { setFilter(item); setView('today') }}><span className={`list-dot category-dot dot-${i % 5}`} />
          <span>{item}</span>
          <span className="nav-count">{tasks.filter(t => t.category === item && !t.completed).length}</span>
        </button>
        <button className="category-remove" title={`Delete ${item} category`} onClick={() => removeCategory(item)}><X size={13} />
        </button>
        </div>)}

      <form className="category-add-form" onSubmit={addCategory}>
        <input id="category-name" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="New category" maxLength={32} />
        <button title="Add category"><Plus size={15} />
        </button>
        </form></div><div className="sidebar-bottom">
          <div className="quote-card">
            <div className="quote-flower"><Sparkles size={16} />
            </div>
            <p>“The secret of getting ahead is getting started.”</p>
            <span>MARK TWAIN</span>
            <div className="quote-orb" />
            </div>
            <button className="nav-item bottom-item" onClick={() => { setNameDraft(account.name); setPasswordDraft({ current: "", next: "", confirm: "" }); setPasswordError(""); setSettingsOpen(true) }}><Settings2 size={17} />
            <span>Settings</span>
            </button>
            <button className="nav-item bottom-item" onClick={() => { setHelpTab('help'); setHelpOpen(true) }}><CircleHelp size={17} />
            <span>Help & feedback</span>
            </button>
            <button className="nav-item bottom-item" onClick={logout}><LogOut size={17} />
            <span>Sign out</span>
            </button>
          </div>
          </aside>
    <main className="main-area">
      <header className="topbar">
        <div className="breadcrumbs">
          <span>My daylist</span>
          <span className="slash">/</span>
          <strong>{filter === 'All tasks' ? title : filter}</strong>
        </div>
        <div className="topbar-actions">
          <button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'night' : 'day'} mode`} title={`Switch to ${theme === 'light' ? 'night' : 'day'} mode`}>{theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            <span>{theme === 'light' ? 'Night' : 'Day'}</span>
          </button>
          <span className="date-chip"><Clock3 size={14} /> {dateLabel}</span>
          <div className="top-avatar">{account.name[0]?.toUpperCase()}
          </div>
        </div>
      </header>
      <div className="content-wrap">
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              <span className="live-dot" /> ONE STEP CLOSER TO YOUR GOALS
            </div>
            <h1>{title}<span className="heading-sparkle"><Sparkles size={22} /></span>
            </h1>
            <p className="page-subtitle">{view === 'today' ? 'Make a little progress on what matters.' : view === 'upcoming' ? 'Stay ahead of what’s coming next.' : 'Look at everything you’ve accomplished.'}</p>
          </div>
          <div className="progress-card">
            <div className="progress-top">
              <span>All-time progress</span><strong>{progress}%</strong>
            </div>
            <div className="progress-track"><span style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-note">{counts.completed} of {tasks.length} tasks complete
          </div>
          <div className="progress-decoration"><Sparkles size={16} />
          </div>
        </div>
      </div>
      <section className="overview-metrics" aria-label="Task overview"><article><span>Total tasks</span><strong>{tasks.length}</strong><small><ListTodo size={13} /> Across your workspace</small>
      </article>
      <article><span>Completed</span><strong>{counts.completed}</strong><small><Check size={13} /> {progress}% of all tasks</small>
      </article>
      <article><span>In progress</span><strong>{tasks.filter(t => !t.completed && t.dueDate === todayKey()).length}</strong><small><Clock3 size={13} /> Due today</small>
      </article>
      <article><span>Planning ahead</span><strong>{counts.upcoming}</strong><small><CalendarDays size={13} /> Upcoming tasks</small></article></section>
      <div className="task-toolbar">
        <div className="toolbar-left">
          <div className="task-total"><ListTodo size={16} /><strong>{visibleTasks.filter(t => !t.completed).length}</strong><span>tasks</span>
          </div>
          <span className="toolbar-separator" />
          <div className="view-switch" role="group" aria-label="Task layout"><button className={displayMode === 'list' ? 'active' : ''} onClick={() => setDisplayMode('list')}>List</button><button className={displayMode === 'board' ? 'active' : ''} onClick={() => setDisplayMode('board')}>Board</button></div>
          <button className={`filter-pill ${sortHigh ? 'active' : ''}`} onClick={() => setSortHigh(v => !v)}><ArrowDownWideNarrow size={15} /> Priority <ChevronDown size={13} /></button>
        </div>
        <div className="toolbar-right">
          <label className="search-box"><Search size={15} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search tasks..." /><kbd>/</kbd>
          </label>
        </div>
      </div>
      <section className="task-card">
        <div className="card-caption">
        <div>
          <span className="caption-date">{view === 'today' ? 'YOUR DAY, AT A GLANCE' : `YOUR ${title.toUpperCase()} LIST`}</span>
          <span className="caption-divider">·</span>
          <span>{visibleTasks.length} {visibleTasks.length === 1 ? 'item' : 'items'}</span>
        </div>
        <button className="card-menu" aria-label="Add task" onClick={() => openTask()}><Plus size={17} />
        </button>
       </div>{visibleTasks.length === 0 ? <div className="empty-state">
        <div className="empty-icon"><Sparkles size={21} /></div>
        <strong>{query ? 'No matching tasks' : 'A little breathing room'}</strong>
        <span>{query ? 'Try another search.' : 'Add a task whenever you’re ready.'}</span>
        <button className="empty-add" onClick={() => openTask()}><Plus size={15} /> Add a task</button>
        </div> : displayMode === 'board' ? <div className="task-board">{[{key:'todo',label:'To do',items:visibleTasks.filter(t => !t.completed),tone:'todo'},{key:'done',label:'Completed',items:visibleTasks.filter(t => t.completed),tone:'done'}].map(column => <section className="board-column" key={column.key}><header><span className={`board-dot ${column.tone}`} />{column.label}
        <span className="board-count">{column.items.length}</span>
        <button aria-label={`Add task to ${column.label}`} onClick={() => openTask()}><Plus size={15} /></button>
        </header>
        <div className="board-cards">{column.items.length ? column.items.map(task => <article className="board-task" key={task.id}>
          <span className={`board-priority ${task.priority}`}>{task.priority} priority</span>
          <button className="board-task-title" onClick={() => openTask(task)}>{task.title}</button>{task.notes && <p>{task.notes}</p>}
          <footer><span className="category-label">{task.category}</span>{task.dueDate && <span className="due-label"><CalendarDays size={12} />{task.dueDate === todayKey() ? 'Today' : task.dueDate}</span>}<button aria-label={task.completed ? 'Mark task incomplete' : 'Complete task'} onClick={() => toggleTask(task)}>{task.completed ? <Check size={14} /> : <span className="board-complete-dot" />}
          </button>
          </footer></article>) : <div className="board-empty">No tasks here</div>}</div></section>)}</div> : <div className="task-list">{visibleTasks.map((task, index) => <article className={`task-row ${task.completed ? 'is-complete' : ''}`} key={task.id} style={{ '--row-index': index }}>
          <button className={`checkbox ${task.completed ? 'checked' : ''}`} aria-label={task.completed ? 'Mark task incomplete' : 'Complete task'} onClick={() => toggleTask(task)}>{task.completed && <Check size={14} strokeWidth={2.5} />}{!task.completed && <span />}</button>
          <div className="task-details">
          <button className="task-title" onClick={() => openTask(task)}>{task.title}</button>
          <div className="task-meta"><span className={`category-label course-${task.category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>{task.category}</span>{task.dueDate && <><span className="meta-dot">·</span>
          <span className="due-label"><CalendarDays size={12} />{task.dueDate === todayKey() ? 'Today' : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(`${task.dueDate}T00:00:00`))}</span></>}{task.priority === 'high' && <span className="priority-label"><span /> High priority</span>}
          </div>
          </div><span className={`priority-dot ${task.priority}`} title={`${task.priority} priority`} />
          <button className="row-edit" aria-label={`Edit ${task.title}`} onClick={() => openTask(task)}><Pencil size={14} />
          </button>
          <button className="row-delete" aria-label={`Delete ${task.title}`} onClick={() => deleteTask(task)}><Trash2 size={15} /></button></article>)}</div>}
          <button className="add-task-button" onClick={() => openTask()}><span className="add-plus"><Plus size={16} /></span><span>Add a task</span><kbd>⌘ ↵</kbd></button>{view === 'completed' && counts.completed > 0 && 
          <button className="clear-completed" onClick={() => setTasks(old => old.filter(t => !t.completed))}><Trash2 size={14} /> Clear completed</button>}</section><div className="bottom-note"><Sparkles size={14} /><span>Small steps still move you forward.</span>
          <span className="bottom-note-line" />
          </div>
          </div>
          <footer className="main-footer"><span>Made for the way you think.</span>
          <button onClick={() => notify('Thanks for staying focused!')}>Stay in your flow <Sparkles size={13} /></button>
          </footer></main>
    {helpOpen && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setHelpOpen(false) }}><section className="task-modal help-modal"><div className="modal-heading"><div><span className="modal-eyebrow">HERE WHEN YOU NEED US</span><h2>Help & feedback</h2></div><button type="button" className="modal-close" aria-label="Close help" onClick={() => setHelpOpen(false)}><X size={19} /></button>
    </div><div className="help-tabs">
      <button className={helpTab === 'help' ? 'active' : ''} onClick={() => setHelpTab('help')}>Quick help</button>
      <button className={helpTab === 'feedback' ? 'active' : ''} onClick={() => setHelpTab('feedback')}>Send feedback</button>
      </div>{helpTab === 'help' ? <div className="help-content"><details open><summary>How do I add or organize tasks?</summary>
      <p>Select <strong>Add a task</strong> to create a task with a category, priority, due date, and notes. Use the category list in the sidebar to filter tasks.</p></details>
      <details><summary>How do I finish or edit a task?</summary><p>Use the circle beside a task to mark it done. Select its title or pencil icon to edit it, or the trash icon to remove it.</p></details>
      <details><summary>Where are my tasks and settings saved?</summary>
      <p>Tasks, accounts, theme, and preferences are stored in this browser. They are not synced to another device.</p></details>
      <div className="help-tip"><Sparkles size={15} /> Use search to find tasks by title, notes, or category.</div>
      <button className="help-contact" onClick={() => setHelpTab('feedback')}>Still need help? Send feedback <ArrowDownWideNarrow size={14} /></button>
      </div> : <form className="feedback-form" onSubmit={submitFeedback}><p>Tell us what’s working or what could be better.</p>
      <label className="field-label">Feedback type<select value={feedbackDraft.type} onChange={e => setFeedbackDraft(d => ({ ...d, type: e.target.value }))}>
      <option>Suggestion</option>
      <option>Bug report</option>
      <option>Question</option>
      <option>Other</option>
      </select>
      </label>
      <label className="field-label">Message<textarea rows="5" required maxLength={2000} value={feedbackDraft.message} onChange={e => setFeedbackDraft(d => ({ ...d, message: e.target.value }))} placeholder="Share your thoughts…" />
      </label>
      <div className="feedback-local-note">Your feedback will be saved in this browser.</div>
      <div className="modal-actions">
      <button type="button" className="cancel-button" onClick={() => setHelpOpen(false)}>Cancel</button>
      <button type="submit" className="primary-button">Save feedback <Check size={15} /></button>
      </div>
      </form>}
      </section>
      </div>}    
      {settingsOpen && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setSettingsOpen(false) }}>
      <form className="task-modal settings-modal" onSubmit={saveSettings}>
      <div className="modal-heading"><div>
      <span className="modal-eyebrow">MAKE DAYLIST YOURS</span>
      <h2>Settings</h2>
      </div>
      <button type="button" className="modal-close" aria-label="Close settings" onClick={() => setSettingsOpen(false)}><X size={19} /></button>
      </div>
      <section className="settings-section">
      <div className="settings-label"><strong>Themes</strong><span>Choose a light or dark workspace</span>
      </div>
      <select className="settings-select" aria-label="Theme" value={theme} onChange={e => { setTheme(e.target.value); setPreferences(p => ({ ...p, theme: e.target.value })) }}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      </select>
      </section>
      <section className="settings-block">
        <div className="settings-label"><strong>Accent Colors</strong><span>Pick a color for buttons and highlights</span>
        </div>
        <div className="accent-picker" role="group" aria-label="Accent Colors">{[{id:'violet',label:'Violet'},{id:'blue',label:'Blue'},{id:'green',label:'Green'},{id:'rose',label:'Rose'},{id:'amber',label:'Amber'}].map(color => <button type="button" key={color.id} className={'accent-swatch accent-swatch-' + color.id + (preferences.accent === color.id ? ' selected' : '')} aria-label={color.label} aria-pressed={preferences.accent === color.id} onClick={() => setPreferences(p => ({ ...p, accent: color.id }))} />)}</div>
        </section>
        <section className="settings-block">
        <div className="settings-label"><strong>Language &amp; region</strong><span>Set your preferred language and date region</span>
        </div>
        <div className="modal-fields">
        <label className="field-label">Language<select value={preferences.language || 'en'} onChange={e => setPreferences(p => ({ ...p, language: e.target.value }))}>
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
          <option value="ja">日本語</option>
          </select>
          </label>
          <label className="field-label">Region<select value={preferences.region || 'US'} onChange={e => setPreferences(p => ({ ...p, region: e.target.value }))}>
          <option value="US">United States</option>
          <option value="GB">United Kingdom</option>
          <option value="CA">Canada</option>
          <option value="AU">Australia</option>
          <option value="JP">Japan</option>
          </select>
          </label>
          </div>
          </section>
          <section className="settings-block">
            <div className="settings-label"><strong>Notifications</strong><span>Choose which updates you want to receive</span>
            </div>
            <div className="settings-options">
              <div className="settings-section">
                <div className="settings-label"><strong>Task notifications</strong><span>Updates about your tasks</span>
                </div>
                <label className="settings-switch"><input type="checkbox" checked={preferences.notifications !== false} onChange={e => setPreferences(p => ({ ...p, notifications: e.target.checked }))} /><span className="switch-track" />
                </label>
                </div>
                <div className="settings-section">
                  <div className="settings-label"><strong>Due date reminders</strong><span>Reminders for tasks coming up</span>
                  </div>
                  <label className="settings-switch">
                    <input type="checkbox" checked={preferences.reminders !== false} onChange={e => setPreferences(p => ({ ...p, reminders: e.target.checked }))} /><span className="switch-track" />
                    </label>
                    </div>
                    </div>
                    </section>
                    <section className="settings-block plan-card">
                      <div className="settings-label"><strong>Your plan <span className="plan-badge">FREE</span></strong><span>Enjoy the essentials for a calmer day.</span>
                      </div>
                      <button type="button" className="upgrade-button" onClick={() => notify('Plan upgrades are coming soon')}>Upgrade plan <Sparkles size={14} />
                      </button>
                      </section><label className="field-label">Display name<input value={nameDraft} onChange={e => setNameDraft(e.target.value)} maxLength={60} placeholder="Your name" />
                      </label>
                      <section className="settings-password"><div className="settings-label"><strong>Change password</strong><span>Choose a new password for your account</span>
                      </div>
                      <label className="field-label">Current password<input type="password" autoComplete="current-password" value={passwordDraft.current} onChange={e => setPasswordDraft(p => ({ ...p, current: e.target.value }))} />
                      </label>
                      <div className="modal-fields">
                        <label className="field-label">New password<input type="password" autoComplete="new-password" value={passwordDraft.next} onChange={e => setPasswordDraft(p => ({ ...p, next: e.target.value }))} placeholder="At least 6 characters" />
                        </label>
                        <label className="field-label">Confirm new password<input type="password" autoComplete="new-password" value={passwordDraft.confirm} onChange={e => setPasswordDraft(p => ({ ...p, confirm: e.target.value }))} />
                        </label>
                        </div>{passwordError && <div className="auth-error">{passwordError}</div>}
                        </section>
                        <label className="field-label">Default view<select value={preferences.defaultView} onChange={e => setPreferences(p => ({ ...p, defaultView: e.target.value }))}>
                          <option value="today">Today</option>
                          <option value="upcoming">Upcoming</option>
                          <option value="completed">Completed</option>
                          </select></label><section className="settings-section">
                            <div className="settings-label"><strong>Task ordering</strong><span>Show higher priority tasks first</span>
                            </div>
                            <label className="settings-switch">
                              <input type="checkbox" checked={preferences.priorityFirst} onChange={e => setPreferences(p => ({ ...p, priorityFirst: e.target.checked }))} /><span className="switch-track" />
                              </label>
                              </section>
                              <div className="settings-account"><span>Signed in as</span><strong>{account.email}</strong>
                              </div>
                              <div className="modal-actions">
                                <button type="button" className="cancel-button" onClick={() => setSettingsOpen(false)}>Cancel</button>
                                <button className="primary-button" type="submit">Save settings <Check size={15} /></button>
                                </div>   
                                </form>
                                </div>}
                                {modal && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(false) }}>
                                <form className="task-modal" onSubmit={saveTask}><div className="modal-heading"><div><span className="modal-eyebrow">A SMALL STEP FORWARD</span>
                                <h2>{editing ? 'Edit task' : 'Create new task'}</h2></div>
                                <button type="button" className="modal-close" aria-label="Close" onClick={() => setModal(false)}><X size={19} /></button>
                                </div>
                            <label className="field-label">Task title <span>*</span>
                            <input autoFocus required maxLength={180} value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} placeholder="What needs to be done?" /></label>
                          <div className="modal-fields">
                          <label className="field-label">Category<select value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })}>{categories.map(c => <option key={c}>{c}</option>)}
                          </select>
                          </label>
                          <label className="field-label">Priority<select value={draft.priority} onChange={e => setDraft({ ...draft, priority: e.target.value })}>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            </select>
                            </label>
                            </div>
                            <label className="field-label">Due date<input type="date" value={draft.dueDate} onChange={e => setDraft({ ...draft, dueDate: e.target.value })} /></label>
                            <label className="field-label">Notes <span className="optional">Optional</span><textarea rows="3" value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })} placeholder="Add details or a reminder…" /></label>
                            <div className="modal-actions">
                              <button type="button" className="cancel-button" onClick={() => setModal(false)}>Cancel</button>
                              <button className="primary-button" type="submit">{editing ? 'Save changes' : 'Save task'} <Check size={15} /></button>
                              </div>
                              </form>
                              </div>}{toast && <div className="toast"><Check size={13} />{toast}</div>}</div>
}
export default App
