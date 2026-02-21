import React, { useEffect, useMemo, useState } from 'react'
import { Plus, CheckCircle, RotateCcw, Play, Calendar, X, Check, ChevronRight, GripVertical, Settings2 } from 'lucide-react'
import * as listApi from './api/listApi'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import ScheduleEngine from './ScheduleEngine'
import { useLoadingOverlay } from './hooks/useLoadingOverlay'
import type { List } from './types/list'

// --- Types ---
interface Task {
  id: string
  text: string
  current: boolean
  completed: boolean
  order: number
}

const App: React.FC = () => {
  const now = new Date();
  const today = `${now.getDate().toString().padStart(2, "0")}.${(now.getMonth() + 1).toString().padStart(2, "0")}.${now.getFullYear()}`;

  // --- State ---
  const [list, setList] = useState<List>({ date: today, items: [] })
  const [showPopup, setShowPopup] = useState<boolean>(false)
  const [showScheduleEnginePopup, setShowScheduleEnginePopup] = useState<boolean>(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const { withLoading, withLoadingMessage, LoadingComponent } = useLoadingOverlay();

  const animate = (action: () => Promise<unknown>) => {
    setIsAnimating(true)
    setTimeout(async () => {
      await action()
      setIsAnimating(false)
    }, 1200)
  }

  const activeTasks = useMemo(() => {
    return list.items.filter(t => !t.completed)
  }, [list])

  const focusedIndex = useMemo(() => {
    const index = activeTasks.findIndex(t => t.current)
    return index === -1 ? 0 : index
  }, [activeTasks])

  const saveTasks = async (list: List) => {
    await listApi.setList(list)
    setList(list)
  }

  useEffect(() => {
    async function fetchData() {
      await withLoadingMessage('Loading...', async () => {
        const list = await listApi.getList()
        setList(list)
      })
    }

    fetchData()
  }, [])

  // --- Actions ---
  const reorderTasks = async (reorderedTasks: Task[]) => {
    await withLoading(async () => {
      // Update order field based on new position
      const tasksWithNewOrder = reorderedTasks.map((task, index) => ({
        ...task,
        order: index
      }))
      await saveTasks({ ...list, items: tasksWithNewOrder })
    })
  }

  const toggleTask = async (id: string) => {
    await withLoading(async () => {
      let currentId = activeTasks[focusedIndex].id
      if (currentId === id) {
        currentId = activeTasks[(focusedIndex + 1) % activeTasks.length].id
      }

      const items = list.items.map(t => t.id === id ? { ...t, completed: !t.completed, current: t.id === currentId } : t)
      await saveTasks({ ...list, items: items })
    })
  }

  const rotateWheel = async () => {
    await withLoading(async () => {
      if (activeTasks.length === 0) return

      const nextId = activeTasks[(focusedIndex + 1) % activeTasks.length].id
      const items =  list.items.map(t => ({ ...t, current: t.id === nextId })) 
      await saveTasks({ ...list, items: items })
    })
  }

  const resetDailies = async () => {
    await withLoading(async () => {
      const items =  list.items.map((t, i) => ({ ...t, completed: false, current: i === 0 }))
      await saveTasks({ ...list, items: items })
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
      <LoadingComponent />

      {/* Header Area: Now contains Tab Switcher */}
      <header className="px-4 pt-6 pb-2 bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-100 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {activeTasks.length} Routines Left
            </p>
          </div>
          
          {/* CENTER TOP BRANDING & FOCUS TEXT */}
          <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none flex flex-col items-center">
            <h1 className="text-xl font-black tracking-tighter bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent uppercase leading-none">
              Cyclo Focus
            </h1>
            <span className={`text-[9px] font-black uppercase tracking-widest mt-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-500`}>
              Daily Focus
            </span>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setShowPopup(true)} className="p-2 bg-blue-50 text-blue-600 rounded-xl relative">
              <Calendar className="w-4 h-4" />
              {list.items.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[9px] rounded-full flex items-center justify-center border-2 border-white font-bold">{list.items.length}</span>}
            </button>
            <button onClick={() => setShowScheduleEnginePopup(true)} className="p-2 bg-blue-50 text-blue-600 rounded-xl relative">
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
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
                  animate(() => toggleTask(activeTasks[focusedIndex].id))
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

      {/* Popups (Overlays) */}
      {showScheduleEnginePopup && (
        <ScheduleEngine onClose={() => setShowScheduleEnginePopup(false)} onSave={setList} />
      )}

      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-t-[28px] rounded-b-xl max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-full duration-300 shadow-2xl">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className={`text-lg font-black tracking-tight text-blue-600`}>
                  Daily
                </h2>
                {showPopup && (
                  <button onClick={resetDailies} className="text-[9px] font-bold text-slate-400 hover:text-blue-500 flex items-center gap-1 mt-0.5">
                    <RotateCcw className="w-3 h-3" /> RESET DAILY PROGRESS
                  </button>
                )}
              </div>
              <button onClick={() => setShowPopup(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
              <TaskList 
                tasks={list.items.sort((a, b) => a.order - b.order)} 
                onToggle={(id) => toggleTask(id)} 
                onReorder={(reordered) => reorderTasks(reordered)}
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
  onReorder: (reorderedTasks: Task[]) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onToggle, onReorder }) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((task) => task.id === active.id)
      const newIndex = tasks.findIndex((task) => task.id === over.id)
      const reorderedTasks = arrayMove(tasks, oldIndex, newIndex)
      onReorder(reorderedTasks)
    }
  }

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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={tasks.map(t => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskItem 
              key={task.id} 
              task={task} 
              onToggle={onToggle} 
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleSave = () => {
    if (editText.trim()) {
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditText(task.text);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
        task.completed ? 'bg-slate-50 border-transparent opacity-60' : 'bg-white border-slate-100 shadow-sm'
      }`}
    >
      <button
        className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-slate-400 hover:text-slate-600"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>

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
    </div>
  );
};

export default App;