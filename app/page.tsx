'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Plus, Download } from 'lucide-react'
import html2canvas from 'html2canvas'

interface ShiftEntry {
  id: string
  name: string
  type: 'opening' | 'closing'
}

interface DaySchedule {
  [key: string]: ShiftEntry[]
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<DaySchedule>(
    DAYS.reduce((acc, day) => ({ ...acc, [day]: [] }), {})
  )
  const [activeDay, setActiveDay] = useState<string | null>(null)
  const [inputName, setInputName] = useState('')
  const [selectedType, setSelectedType] = useState<'opening' | 'closing'>('opening')
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (gridRef.current && !gridRef.current.contains(event.target as Node)) {
        setActiveDay(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const addShift = () => {
    if (!inputName.trim() || !activeDay) return

    const newEntry: ShiftEntry = {
      id: `${activeDay}-${Date.now()}`,
      name: inputName.trim(),
      type: selectedType,
    }

    setSchedule((prev) => ({
      ...prev,
      [activeDay]: [...prev[activeDay], newEntry],
    }))

    setInputName('')
    setSelectedType('opening')
  }

  const removeShift = (dayKey: string, id: string) => {
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: prev[dayKey].filter((entry) => entry.id !== id),
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addShift()
    }
  }

  const handleDownload = async () => {
    if (gridRef.current) {
      try {
        const previousActiveDay = activeDay;
        setActiveDay(null);
        
        await new Promise((resolve) => setTimeout(resolve, 50));

        const canvas = await html2canvas(gridRef.current, {
          backgroundColor: '#0f172a',
          scale: 2,
        });
        
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `weekly-schedule.png`;
        link.href = dataUrl;
        link.click();

        setActiveDay(previousActiveDay);
      } catch (error) {
        console.error('Failed to download schedule', error);
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">Weekly Schedule</h1>
            <p className="text-sm md:text-base text-slate-400">Manage your team&apos;s opening and closing shifts</p>
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700 transition-colors border border-slate-700 font-medium w-full md:w-auto"
          >
            <Download size={18} />
            Download PNG
          </button>
        </div>

        {/* Days Grid */}
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
          {DAYS.map((day) => (
            <div
              key={day}
              onClick={() => setActiveDay(activeDay === day ? null : day)}
              className={`p-3 md:p-4 rounded-lg cursor-pointer transition-all ${
                activeDay === day
                  ? 'bg-slate-800 border-2 border-blue-500 shadow-lg'
                  : 'bg-slate-800 border border-slate-700 hover:border-slate-600'
              }`}
            >
              <h2 className="text-base md:text-lg font-semibold text-white mb-3">{day}</h2>

              {/* Shifts List */}
              <div className="space-y-2 mb-3">
                {schedule[day].length === 0 ? (
                  <p className="text-slate-500 text-xs md:text-sm">No shifts added</p>
                ) : (
                  schedule[day].map((entry) => (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium ${
                        entry.type === 'opening'
                          ? 'bg-green-500/20 text-green-300 border border-green-500/50'
                          : 'bg-red-500/20 text-red-300 border border-red-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            entry.type === 'opening' ? 'bg-green-400' : 'bg-red-400'
                          }`}
                        />
                        <span className="truncate">{entry.name}</span>
                        <span className="text-xs opacity-75 flex-shrink-0">
                          {entry.type === 'opening' ? 'OPENING' : 'CLOSING'}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeShift(day, entry.id)
                        }}
                        className="hover:opacity-75 transition-opacity flex-shrink-0 ml-2"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add Form */}
              {activeDay === day && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="pt-3 border-t border-slate-700 space-y-2"
                >
                  <input
                    type="text"
                    placeholder="Enter name"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-2 md:px-3 py-2 bg-slate-700 text-white placeholder-slate-500 rounded-md border border-slate-600 focus:outline-none focus:border-blue-500 text-xs md:text-sm"
                    autoFocus
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedType('opening')
                      }}
                      className={`flex-1 px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-all ${
                        selectedType === 'opening'
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                      }`}
                    >
                      Opening
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedType('closing')
                      }}
                      className={`flex-1 px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-all ${
                        selectedType === 'closing'
                          ? 'bg-red-500 text-white'
                          : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                      }`}
                    >
                      Closing
                    </button>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      addShift()
                    }}
                    disabled={!inputName.trim()}
                    className="w-full px-2 md:px-3 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-xs md:text-sm"
                  >
                    <Plus size={16} />
                    Add Shift
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>


      </div>
    </div>
  )
}
