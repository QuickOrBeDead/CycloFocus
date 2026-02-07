import React, { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, CheckCircle, RotateCcw, Play, List, Calendar, X, Edit2, Check, Loader2, ChevronRight } from 'lucide-react'
import * as listApi from './api/listApi'
import { v4 as uuidv4 } from 'uuid'

// --- Types ---
type TaskType = 'daily' | 'todo'

interface Task {
  id: string
  text: string
  current: boolean
  completed: boolean
  order: number
}

// --- Loading Overlay Component ---
const LoadingOverlay: React.FC<{ message?: string }> = ({ message = "Saving tasks..." }) => (
  <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200 h-screen">
    <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 border border-slate-100 scale-110 animate-in zoom-in-95 duration-300">
      <div className="relative">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <div className="absolute inset-0 blur-lg bg-blue-400/20 animate-pulse" />
      </div>
      <p className="text-sm font-black text-slate-700 uppercase tracking-widest">{message}</p>
    </div>
  </div>
)

const App: React.FC = () => {
  // --- State ---
  const [dailyTasks, setDailyTasks] = useState<Task[]>([])
  const [todoTasks, setTodoTasks] = useState<Task[]>([])
  const [inputValue, setInputValue] = useState('')
  const [activeTab, setActiveTab] = useState<TaskType>('daily')
  const [showPopup, setShowPopup] = useState<TaskType | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>()
  const [loadingMessage, setLoadingMessage] = useState<string>('Saving...')
  const [isAnimating, setIsAnimating] = useState(false)

  const tasksSetter = (type: TaskType) => type === 'daily' ? setDailyTasks : setTodoTasks
  const withLoading = async (action: () => Promise<unknown>) => await withLoadingMessage('Saving...', action)
  const withLoadingMessage = async (message: string, action: () => Promise<unknown>) => {
     try {
        setLoadingMessage(message)
        setIsLoading(true)
        await action()
      } finally {
        setIsLoading(false)
      }
  }

  const animate = (action: () => Promise<unknown>) => {
    setIsAnimating(true)
    setTimeout(async () => {
      await action()
      setIsAnimating(false)
    }, 1200)
  }

  const activeTasks = useMemo(() => {
    return (activeTab === 'daily' ? dailyTasks : todoTasks).filter(t => !t.completed)
  }, [activeTab, dailyTasks, todoTasks])

  const focusedIndex = useMemo(() => {
    const index = activeTasks.findIndex(t => t.current)
    return index === -1 ? 0 : index
  }, [activeTasks])

  const getTasks = (type?: TaskType) => {
    const t = type === undefined ? activeTab : type
    return t === 'daily' ? dailyTasks : todoTasks
  }

  const saveTasks = async (tasks: Task[], type?: TaskType) => {
    const t = type === undefined ? activeTab : type
    await listApi.setList(t, { date: new Date(), items: tasks })
    tasksSetter(t)(tasks)
  }

  useEffect(() => {
    async function fetchData() {
      await withLoadingMessage('Loading...', async () => {
        const list = await listApi.getList(activeTab)
        tasksSetter(activeTab)(list.items)
      })
    }

    fetchData()
  }, [activeTab])

  // --- Actions ---
  const changeActiveTab = (type: TaskType) => {
    setActiveTab(type)
  }

  const addTask = async (e: React.FormEvent) => {
    await withLoading(async () => {
      e.preventDefault()
      if (!inputValue.trim()) return

      const newTask: Task = {
        id: uuidv4(),
        text: inputValue.trim(),
        completed: false,
        order: 0,
        current: false
      }

      const newTasks = [...getTasks(), newTask]

      await saveTasks(newTasks)

      setInputValue('')
    })
  }

  const toggleTask = async (id: string, type: TaskType) => {
    await withLoading(async () => {
      let currentId = activeTasks[focusedIndex].id
      if (currentId === id) {
        currentId = activeTasks[(focusedIndex + 1) % activeTasks.length].id
      }

      const newTasks = getTasks(type).map(t => t.id === id ? { ...t, completed: !t.completed, current: t.id === currentId } : t)
      await saveTasks(newTasks, type)
    })
  }

  const updateTask = async (id: string, type: TaskType, newText: string) => {
    await withLoading(async () => {
      const newTasks = getTasks(type).map(t => t.id === id ? { ...t, text: newText } : t)
      await saveTasks(newTasks, type)
    })
  }

  const deleteTask = async (id: string, type: TaskType) => {
    await withLoading(async () => {
      let currentId = activeTasks[focusedIndex].id
      if (currentId === id) {
        currentId = activeTasks[(focusedIndex + 1) % activeTasks.length].id
      }

      const newTasks = getTasks(type).filter(t => t.id !== id).map(t => ({ ...t, current: t.id === currentId }))
      await saveTasks(newTasks, type)
    })
  };

  const rotateWheel = async () => {
    await withLoading(async () => {
      if (activeTasks.length === 0) return

      const nextId = activeTasks[(focusedIndex + 1) % activeTasks.length].id
      const newTasks = getTasks().map(t => ({ ...t, current: t.id === nextId })) 
      await saveTasks(newTasks)
    })
  }

  const resetDailies = async () => {
    await withLoading(async () => {
      const newTasks = getTasks().map((t, i) => ({ ...t, completed: false, current: i === 0 }))
      await saveTasks(newTasks)
    })
  }

  const nextCycle = () => {
    if (activeTasks.length <= 1 || isAnimating) return
    
    animate(async () => {
      await rotateWheel()
    })
  }

  const prevIndex = (focusedIndex - 1 + activeTasks.length) % activeTasks.length
  const nextIndex = (focusedIndex + 1) % activeTasks.length

  return (
    <div className="fixed inset-0 bg-slate-50 text-slate-900 font-sans flex flex-col h-screen">
      {isLoading && <LoadingOverlay message={loadingMessage} />}

      {/* Header Area: Now contains Tab Switcher */}
      <header className="px-4 pt-6 pb-2 bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-100 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {activeTasks.length} {activeTab === 'daily' ? 'Routines' : 'Tasks'} Left
            </p>
          </div>
          
          {/* CENTER TOP BRANDING & FOCUS TEXT */}
          <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none flex flex-col items-center">
            <h1 className="text-xl font-black tracking-tighter bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent uppercase leading-none">
              Cyclo Focus
            </h1>
            <span className={`text-[9px] font-black uppercase tracking-widest mt-1.5 px-2 py-0.5 rounded-full ${activeTab === 'daily' ? 'bg-blue-50 text-blue-500' : 'bg-indigo-50 text-indigo-500'}`}>
              {activeTab === 'daily' ? 'Daily Focus' : 'Todo Focus'}
            </span>
          </div>

          <div className="flex gap-2">
             <button onClick={() => setShowPopup('daily')} className="p-2 bg-blue-50 text-blue-600 rounded-xl relative">
                <Calendar className="w-4 h-4" />
                {dailyTasks.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[9px] rounded-full flex items-center justify-center border-2 border-white font-bold">{dailyTasks.length}</span>}
             </button>
             <button onClick={() => setShowPopup('todo')} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl relative">
                <List className="w-4 h-4" />
                {todoTasks.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white text-[9px] rounded-full flex items-center justify-center border-2 border-white font-bold">{todoTasks.length}</span>}
             </button>
          </div>
        </div>

        {/* DAILY / TODO Choice Bar moved to Top */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-2">
          <button
            onClick={() => changeActiveTab('daily')}
            className={`flex-1 py-2 text-[clamp(1rem,4vw,1.4rem)] font-black rounded-lg transition-all ${activeTab === 'daily' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
          >
            DAILY
          </button>
          <button
            onClick={() => changeActiveTab('todo')}
            className={`flex-1 py-2 text-[clamp(1rem,4vw,1.4rem)] font-black rounded-lg transition-all ${activeTab === 'todo' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
          >
            TODO
          </button>
        </div>
      </header>

      {/* Main Interface */}
      <main className="flex-1 flex flex-col items-center justify-start relative px-2 pt-2 overflow-hidden">
        
        {activeTasks.length > 0 ? (
          <div className="w-full flex flex-col items-center">
            
            {/* Previous Task Preview: Light weight, animates West */}
            <div className={`h-14 flex items-center justify-center select-none z-0 task-transition ${isAnimating ? 'move-west-circular' : 'opacity-20'}`}>
              <p className="text-xl font-medium text-slate-400 tracking-tighter line-clamp-1">
                {activeTasks[prevIndex].text}
              </p>
            </div>

            {/* Central Focus Ring: STATIONARY CONTAINER - Lower z-index */}
            <button 
              onClick={nextCycle}
              disabled={isAnimating}
              className="group cursor-pointer relative w-64 h-64 flex items-center justify-center my-4 outline-none z-10"
            >
              <div className="absolute inset-0 rounded-full border-[16px] border-slate-50"></div>
              <div className={`absolute inset-0 rounded-full border-[16px] border-blue-600 border-t-transparent ${isAnimating ? 'animate-spin' : 'animate-spin-slow'}`}></div>
              
              <div className={`w-48 h-48 bg-white rounded-full shadow-2xl border border-slate-100 flex flex-col items-center justify-center p-6 text-center z-10 group-hover:border-blue-200 transition-colors ${isAnimating ? 'animate-focus-trigger' : ''}`}>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Next</p>
                <Play className={`w-6 h-6 text-blue-600 mb-3 fill-blue-600 task-transition ${isAnimating ? 'rotate-180 scale-50 opacity-0 translate-y-[-20px]' : ''}`} />
                
                {/* LABEL ANIMATES OUT */}
                <div className={`${isAnimating ? 'label-move-to-prev' : ''}`}>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Focusing On</p>
                  <p className="text-lg font-bold leading-tight text-slate-900 line-clamp-3">
                    {activeTasks[focusedIndex].text}
                  </p>
                </div>
              </div>

              <div className={`absolute right-[-10px] top-1/2 -translate-y-1/2 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl z-20 border-4 border-white transition-all duration-1200 ${isAnimating ? 'scale-0 opacity-0' : 'group-hover:scale-110'}`}>
                <ChevronRight className="w-8 h-8 stroke-[3px]" />
              </div>
            </button>

            {/* Next Task Preview: Higher z-index than the wheel (z-30) */}
            <div className={`h-14 flex items-center justify-center -mt-2 z-30 task-transition ${isAnimating ? 'move-to-center' : 'opacity-80 text-slate-900 scale-105'}`}>
              <p className="text-xl font-black tracking-tighter line-clamp-1 underline decoration-blue-200 decoration-4 underline-offset-8">
                {activeTasks[nextIndex].text}
              </p>
            </div>

            {/* Action Stack */}
            <div className={`w-full max-w-[280px] mt-2 space-y-2 task-transition ${isAnimating ? 'opacity-0 translate-y-8' : 'opacity-100'}`}>             
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  animate(() => toggleTask(activeTasks[focusedIndex].id, activeTab))
                }}
                className="w-full cursor-pointer py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all"
              >
                <Check className="w-5 h-5 stroke-[4px]" />
                Mark Done
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-20">
            <Check className="w-20 h-20 mb-4" />
            <p className="font-black uppercase tracking-widest">Cycle Complete</p>
          </div>
        )}
      </main>

      {/* Floating Input Area */}
      <footer className="fixed bottom-0 left-0 w-full flex flex-col bg-white/90 backdrop-blur-md border-t border-slate-100 p-1 pb-2 z-20 shrink-0">
        <form onSubmit={addTask} className="flex gap-2 w-full mx-auto">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Quick add ${activeTab}...`}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-slate-200 text-sm font-medium outline-none"
          />
          <button
            type="submit"
            className={`p-2.5 text-white rounded-xl transition-colors shrink-0 ${activeTab === 'daily' ? 'bg-blue-600' : 'bg-indigo-600'}`}
          >
            <Plus className="w-5 h-5" />
          </button>
        </form>
      </footer>

      {/* Popups (Overlays) */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-t-[28px] rounded-b-xl max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-full duration-300 shadow-2xl">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className={`text-lg font-black tracking-tight ${showPopup === 'daily' ? 'text-blue-600' : 'text-indigo-600'}`}>
                  {showPopup === 'daily' ? 'Daily' : 'Todo'}
                </h2>
                {showPopup === 'daily' && (
                  <button onClick={resetDailies} className="text-[9px] font-bold text-slate-400 hover:text-blue-500 flex items-center gap-1 mt-0.5">
                    <RotateCcw className="w-3 h-3" /> RESET DAILY PROGRESS
                  </button>
                )}
              </div>
              <button onClick={() => setShowPopup(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
              <TaskList 
                tasks={showPopup === 'daily' ? dailyTasks : todoTasks} 
                onToggle={(id) => toggleTask(id, showPopup)} 
                onUpdate={(id, text) => updateTask(id, showPopup, text)}
                onDelete={(id) => deleteTask(id, showPopup)} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Subcomponents ---

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onToggle, onUpdate, onDelete }) => {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-slate-300">
        <div className="w-10 h-10 rounded-full border-2 border-dashed border-slate-200 mb-2 flex items-center justify-center">
          <Plus className="w-5 h-5" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest opacity-50">Empty</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskItem 
          key={task.id} 
          task={task} 
          onToggle={onToggle} 
          onUpdate={onUpdate} 
          onDelete={onDelete} 
        />
      ))}
    </div>
  );
};

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);

  const handleSave = () => {
    if (editText.trim()) {
      onUpdate(task.id, editText.trim());
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditText(task.text);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
        task.completed ? 'bg-slate-50 border-transparent opacity-60' : 'bg-white border-slate-100 shadow-sm'
      }`}
    >
      <div onClick={() => onToggle(task.id)} className="flex items-center cursor-pointer gap-3 overflow-hidden flex-1">
        <button 
          onClick={() => onToggle(task.id)}
          className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            task.completed ? 'bg-green-500 border-green-500' : 'border-slate-300'
          }`}
        >
          {task.completed && <CheckCircle className="w-3 h-3 text-white" />}
        </button>
        
        {isEditing ? (
          <input
            autoFocus
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="flex-1 text-xs font-bold bg-slate-100 px-2 py-1 rounded outline-none border border-slate-200"
          />
        ) : (
          <span className={`text-xs font-bold truncate flex-1 ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
            {task.text}
          </span>
        )}
      </div>

      <div className="flex items-center ml-2">
        {!task.completed && (
          <button 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="p-1.5 text-blue-500 transition-colors"
          >
            {isEditing ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          </button>
        )}
        <button 
          onClick={() => onDelete(task.id)}
          className="p-1.5 text-red-500 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default App;