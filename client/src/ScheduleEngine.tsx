import { useState, useEffect, type JSX } from 'react';
import { 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  RefreshCcw,
  Zap,
  Layers,
  ArrowUp,
  ArrowDown,
  X,
  Pencil
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { Schedule } from './types/schedule';
import * as scheduleApi from './api/scheduleApi'
import { useLoadingOverlay } from './hooks/useLoadingOverlay';
import type { List } from './types/list';

type ListKey = 'daily' | 'slots' | 'weekly';
type TabId = 'Daily' | 'Slots' | 'Weekly';

interface Tab {
  id: TabId;
  icon: JSX.Element;
  label: string;
}

export interface ScheduleEngineProps {
  onSave? : (list: List) => void;
  onClose? : () => void;
}

const ScheduleEngine = ({ onSave, onClose }: ScheduleEngineProps) => {
  const [activeTab, setActiveTab] = useState<TabId>('Daily');
  const [currentSlot, setCurrentSlot] = useState('A');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [selectedDays, setSelectedDays] = useState<Array<string>>([]); // For Weekly selection
  const [editingItem, setEditingItem] = useState<{ id: string, type: ListKey, name: string, day?: string, slot?: string } | null>(null);

  const { withLoading, withLoadingMessage, LoadingComponent } = useLoadingOverlay();
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Initial State with identifiers for sorting
  const [schedule, setSchedule] = useState<Schedule>({
    daily: [],
    availableSlots: ['A'], // Dynamic Slot List
    currentSlot: 'A',
    slots: [],
    weekly: []
  });

  // Load schedule from API on initialization
  useEffect(() => {
    const loadSchedule = async () => {
      await withLoading(async () => {
        const data = await scheduleApi.getSchedule();
        setSchedule(data);
        if (data.currentSlot) {
          setCurrentSlot(data.currentSlot);
        }
      })
    };
    
    loadSchedule();
  }, []);

  const tabs: Tab[] = [
    { id: 'Daily', icon: <Circle className="w-4 h-4" />, label: 'Daily' },
    { id: 'Slots', icon: <Layers className="w-4 h-4" />, label: 'A-B-C' },
    { id: 'Weekly', icon: <Calendar className="w-4 h-4" />, label: 'Weekly' }
  ];

  // Logic to add a new Slot (D, E, etc)
  const addSlotLabel = () => {
    const lastSlot = schedule.availableSlots[schedule.availableSlots.length - 1] || '@';
    const nextSlot = String.fromCharCode(lastSlot.charCodeAt(0) + 1);
    setSchedule({ ...schedule, availableSlots: [...schedule.availableSlots, nextSlot] });
  };

  const removeSlotLabel = (s: string) => {
    const updatedSlots = schedule.availableSlots.filter(label => label !== s);
    const updatedTasks = schedule.slots.filter(task => task.slot !== s);
    const newCurrentSlot = currentSlot === s ? (updatedSlots[0] || '') : currentSlot;
    setSchedule({ ...schedule, availableSlots: updatedSlots, currentSlot: newCurrentSlot, slots: updatedTasks });
    if (currentSlot === s) setCurrentSlot(newCurrentSlot);
  };

  const removeItem = (listKey: ListKey, id: string) => {
    setSchedule(prev => ({
      ...prev,
      [listKey]: prev[listKey].filter(item => item.id !== id)
    }));
  };

  const moveItem = (listKey: ListKey, index: number, direction: number) => {
    const list = [...schedule[listKey]];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= list.length) return;
    [list[index], list[newIndex]] = [list[newIndex], list[index]];
    setSchedule({ ...schedule, [listKey]: list });
  };

  const handleAddItem = () => {
    if (!newItemName) return;
    
    // Edit mode
    if (editingItem) {
      setSchedule(prev => {
        if (editingItem.type === 'daily') {
          return {
            ...prev,
            daily: prev.daily.map(item => 
              item.id === editingItem.id ? { ...item, name: newItemName } : item
            )
          };
        } else if (editingItem.type === 'slots') {
          return {
            ...prev,
            slots: prev.slots.map(item => 
              item.id === editingItem.id ? { ...item, name: newItemName } : item
            )
          };
        } else if (editingItem.type === 'weekly') {
          const daysString = selectedDays.length > 0 ? selectedDays.join(', ') : 'Mon';
          return {
            ...prev,
            weekly: prev.weekly.map(item => 
              item.id === editingItem.id ? { ...item, name: newItemName, day: daysString } : item
            )
          };
        }
        return prev;
      });
    } else {
      // Add mode
      const newId = uuidv4();

      if (activeTab === 'Daily') {
        setSchedule(prev => ({
          ...prev,
          daily: [...prev.daily, { id: newId, name: newItemName }]
        }));
      } else if (activeTab === 'Slots') {
        if (!currentSlot) return;
        setSchedule(prev => ({
          ...prev,
          slots: [...prev.slots, { id: newId, slot: currentSlot, name: newItemName }]
        }));
      } else if (activeTab === 'Weekly') {
        const daysString = selectedDays.length > 0 ? selectedDays.join(', ') : 'Mon';
        setSchedule(prev => ({
          ...prev,
          weekly: [...prev.weekly, { id: newId, name: newItemName, day: daysString }]
        }));
      }
    }

    // Reset and Close
    setNewItemName('');
    setSelectedDays([]);
    setEditingItem(null);
    setIsModalOpen(false);
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleEditItem = (listKey: ListKey, id: string) => {
    let item;
    if (listKey === 'daily') {
      item = schedule.daily.find(i => i.id === id);
      if (item) {
        setEditingItem({ id, type: listKey, name: item.name });
        setNewItemName(item.name);
      }
    } else if (listKey === 'slots') {
      item = schedule.slots.find(i => i.id === id);
      if (item) {
        setEditingItem({ id, type: listKey, name: item.name, slot: item.slot });
        setNewItemName(item.name);
      }
    } else if (listKey === 'weekly') {
      item = schedule.weekly.find(i => i.id === id);
      if (item) {
        setEditingItem({ id, type: listKey, name: item.name, day: item.day });
        setNewItemName(item.name);
        setSelectedDays(item.day.split(', ').map(d => d.trim()));
      }
    }
    setIsModalOpen(true);
  };

  const saveChanges = async () => {
    await withLoadingMessage('Saving...', async () => {
      const list = await scheduleApi.setSchedule(schedule);
      if (onSave) {
        onSave(list)
      }

      if (onClose) {
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans text-[#0F172A] bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <LoadingComponent />
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col h-[90vh] max-h-[750px] animate-in slide-in-from-bottom-full duration-300 shadow-2xl">
        
        {/* Header Area */}
        <div className="px-8 pt-8 pb-4 bg-white sticky top-0 z-10">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-blue-600 mb-1">Schedule Engine</h2>
              <h1 className="text-2xl font-black tracking-tight">Focus Slots</h1>
            </div>
            <button onClick={() => { if (onClose) { onClose(); }}} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] mb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[1.1rem] text-sm font-semibold transition-all duration-300 ${
                  activeTab === tab.id 
                  ? 'bg-white shadow-sm text-blue-600' 
                  : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 px-8 pb-4 flex flex-col overflow-hidden">
          
          {activeTab === 'Daily' && (
            <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500 min-h-0">
              <p className="text-xs font-medium text-slate-400 flex items-center gap-2 mb-4 flex-shrink-0">
                <RefreshCcw className="w-3 h-3" /> THESE REPEAT EVERY DAY
              </p>
              <div className="flex-1 overflow-y-auto pr-2 min-h-0">
                {schedule.daily.map((item, index) => (
                <TaskCard 
                  key={item.id} 
                  name={item.name} 
                  color="blue" 
                  onMoveUp={() => moveItem('daily', index, -1)}
                  onMoveDown={() => moveItem('daily', index, 1)}
                  onDelete={() => removeItem('daily', item.id)}
                  onEdit={() => handleEditItem('daily', item.id)}
                  isFirst={index === 0}
                  isLast={index === schedule.daily.length - 1}
                />
              ))}
              </div>
            </div>
          )}

          {activeTab === 'Slots' && (
            <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500 min-h-0">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <p className="text-xs font-medium text-slate-400 flex items-center gap-2 uppercase tracking-wider">
                  <Layers className="w-3 h-3" /> Dynamic Rotation
                </p>
                <div className="flex flex-wrap gap-1 justify-end max-w-[180px]">
                  {schedule.availableSlots.map(s => (
                    <div key={s} className="relative group/slot">
                      <button 
                        onClick={() => setCurrentSlot(s)}
                        className={`w-8 h-8 rounded-lg text-[10px] font-bold transition-all ${
                          currentSlot === s ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {s}
                      </button>
                      <button 
                        onClick={() => removeSlotLabel(s)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/slot:opacity-100 transition-opacity"
                      >
                        <X className="w-2 h-2" />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={addSlotLabel}
                    className="w-8 h-8 rounded-lg bg-slate-50 border border-dashed border-slate-300 text-slate-400 flex items-center justify-center hover:bg-slate-100"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100/50 mb-6 flex justify-between items-center flex-shrink-0">
                 <div>
                    <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">Active View</p>
                    <h3 className="text-xl font-bold flex items-center gap-2">Slot {currentSlot}</h3>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-bold text-green-600 uppercase mb-1">Current Active</p>
                    <h3 className="text-xl font-bold text-green-600">Slot {schedule.currentSlot || '-'}</h3>
                 </div>
                 <div className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold tracking-tighter uppercase">Interval Focus</div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 pr-2 min-h-0">
                {schedule.slots.map((item, index) => {
                if (item.slot !== currentSlot) return null;
                return (
                  <TaskCard 
                    key={item.id} 
                    name={item.name}  
                    color="indigo" 
                    showZap 
                    onMoveUp={() => moveItem('slots', index, -1)}
                    onMoveDown={() => moveItem('slots', index, 1)}
                    onDelete={() => removeItem('slots', item.id)}
                    onEdit={() => handleEditItem('slots', item.id)}
                    isFirst={index === 0 || schedule.slots[index-1]?.slot !== currentSlot}
                    isLast={index === schedule.slots.length - 1 || schedule.slots[index+1]?.slot !== currentSlot}
                  />
                );
                })}
              </div>
            </div>
          )}

          {activeTab === 'Weekly' && (
            <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500 min-h-0">
              <p className="text-xs font-medium text-slate-400 flex items-center gap-2 mb-4 uppercase tracking-wider flex-shrink-0">
                <Calendar className="w-3 h-3" /> Long-Block Focus
              </p>
              <div className="flex-1 overflow-y-auto space-y-1 pr-2 min-h-0">
                {schedule.weekly.map((item) => (
                <TaskCard 
                    key={item.id}
                    name={item.name}
                    subtext={item.day}
                    color="amber"
                    onDelete={() => removeItem('weekly', item.id)}
                    onEdit={() => handleEditItem('weekly', item.id)}
                    noSort />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Add Task Button */}
        <div className="px-8 py-4 bg-white border-t border-slate-100">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-[1.5rem] text-slate-400 font-bold text-sm hover:border-blue-400 hover:text-blue-500 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Task to {activeTab}
          </button>

          <button onClick={saveChanges} className="w-full mt-3 py-5 bg-[#111827] text-white rounded-[1.5rem] font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-3 shadow-xl hover:bg-[#1E293B] transition-all">
            <CheckCircle2 className="w-5 h-5 text-blue-400" />
            Save Changes
          </button>
        </div>

        {/* Custom Input Modal */}
        {isModalOpen && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-end justify-center animate-in fade-in duration-200">
            <div className="bg-white w-full rounded-t-[2.5rem] p-8 pb-10 shadow-2xl animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black">{editingItem ? 'Edit' : 'New'} {activeTab} Item</h3>
                <button onClick={() => { setIsModalOpen(false); setEditingItem(null); setNewItemName(''); setSelectedDays([]); }} className="p-2 bg-slate-100 rounded-full">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 ml-1">Task Name</label>
                  <input 
                    autoFocus
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Enter task name..."
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {activeTab === 'Weekly' && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 ml-1">
                      Select Days
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {daysOfWeek.map(day => (
                        <button
                          key={day}
                          onClick={() => toggleDay(day)}
                          className={`flex-1 min-w-[40px] py-3 rounded-xl text-xs font-bold transition-all border-2 ${
                            selectedDays.includes(day) 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-105' 
                            : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-200'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleAddItem}
                  disabled={!newItemName || (activeTab === 'Weekly' && selectedDays.length === 0)}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold mt-4 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:bg-slate-400"
                >
                  {editingItem ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface TaskCardProps {
  name: string;
  subtext?: string;
  color: 'blue' | 'indigo' | 'amber';
  showZap?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  noSort?: boolean;
}

const TaskCard = ({ name, subtext, color, showZap, onMoveUp, onMoveDown, onDelete, onEdit, isFirst, isLast, noSort }: TaskCardProps) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100'
  };

  return (
    <div className={`group relative p-4 bg-white border border-slate-100 rounded-[1.5rem] flex items-center justify-between hover:shadow-md transition-all cursor-pointer overflow-hidden`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${color === 'blue' ? 'bg-blue-500' : color === 'indigo' ? 'bg-indigo-500' : 'bg-amber-500'}`}></div>
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-2xl ${colors[color]} flex items-center justify-center shrink-0`}>
          {showZap ? <Zap className="w-5 h-5" /> : <div className="w-2.5 h-2.5 rounded-full bg-current opacity-40"></div>}
        </div>
        <div>
          <h4 className="font-bold text-slate-800 leading-tight">{name}</h4>
          { subtext && ( <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-tight mt-0.5">{subtext}</p> ) }
        </div>
      </div>
      <div className="flex items-center gap-1">
        {!noSort && (
          <div className="flex flex-col gap-1 mr-2">
            <button 
              disabled={isFirst}
              onClick={(e) => { 
                e.stopPropagation(); 
                if (onMoveUp) { onMoveUp(); } 
              }}
              className={`p-1 rounded-md transition-colors ${isFirst ? 'text-slate-100' : 'text-slate-300 hover:bg-slate-100 hover:text-blue-500'}`}
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button 
              disabled={isLast}
              onClick={(e) => { e.stopPropagation(); if (onMoveDown) { onMoveDown(); } }}
              className={`p-1 rounded-md transition-colors ${isLast ? 'text-slate-100' : 'text-slate-300 hover:bg-slate-100 hover:text-blue-500'}`}
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <button
            onClick={(e) => { e.stopPropagation(); if (onEdit) { onEdit(); } }}
            className="p-2 text-slate-300 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100">
          <Pencil className="w-4 h-4" />
        </button>
        <button
            onClick={(e) => { e.stopPropagation(); if (onDelete) { onDelete(); } }}
            className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ScheduleEngine;