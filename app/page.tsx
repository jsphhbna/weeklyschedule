'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Plus, Download, Calendar as CalendarIcon } from 'lucide-react'
import { toPng } from 'html-to-image'
import { addDays, format, startOfWeek, endOfWeek } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

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
  const [date, setDate] = useState<DateRange | undefined>()
  const [isCapturing, setIsCapturing] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)
  const captureRef = useRef<HTMLDivElement>(null)

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
    if (captureRef.current) {
      const filter = (node: HTMLElement) => {
        if (node.classList?.contains('exclude-from-capture')) return false;
        if (node.classList?.contains('add-form-section')) return false;
        return true;
      };

      setIsCapturing(true);
      try {
        const previousActiveDay = activeDay;
        setActiveDay(null);

        // Allow React to commit the layout overlay and styling adjustments
        await new Promise((resolve) => setTimeout(resolve, 200));

        const dataUrl = await toPng(captureRef.current, {
          backgroundColor: '#0f172a',
          pixelRatio: 2,
          filter: filter,
          width: 850,
        });

        const link = document.createElement('a');
        link.download = `weekly-schedule.png`;
        link.href = dataUrl;
        link.click();

        setActiveDay(previousActiveDay);
      } catch (error) {
        console.error('Failed to download schedule', error);
      } finally {
        setIsCapturing(false);
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6 overflow-x-hidden relative">
      {/* Loading Overlay */}
      {isCapturing && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950">
          <p className="text-white font-bold text-2xl drop-shadow-md">Formatting layout...</p>
          <p className="text-slate-400 text-sm mt-3">Almost done.</p>
        </div>
      )}

      <div ref={captureRef} className={`mx-auto p-4 sm:p-6 rounded-xl ${isCapturing ? 'w-[850px] max-w-none' : 'max-w-7xl'}`}>
        {/* Header */}
        <div className="relative mb-8 md:mb-12">
          {/* Main Title and Date */}
          <div className="flex flex-col items-center justify-center text-center">
            <h1 className={`font-extrabold text-white mb-3 tracking-tight ${isCapturing ? 'text-6xl' : 'text-3xl md:text-4xl'}`}>
              Weekly Schedule
            </h1>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={`border-none outline-none flex items-center justify-center transition-all ${
                    !date ? "text-slate-400" : "text-blue-400 font-semibold"
                  } ${isCapturing ? 'text-3xl mt-2' : 'text-base md:text-xl hover:bg-slate-800/50 focus:bg-slate-800/50 focus:ring-1 focus:ring-slate-700 rounded-md px-4 py-2 w-full md:w-auto'}`}
                >
                  <CalendarIcon className={`mr-2 ${isCapturing ? 'h-8 w-8' : 'h-5 w-5 md:h-6 md:w-6'}`} />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "MMM d")} - {format(date.to, "MMM d, yyyy")}
                      </>
                    ) : (
                      format(date.from, "MMM d, yyyy")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 dark bg-slate-950 border-slate-800 text-white" align="center">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={1}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Download Button */}
          <div className={`mt-6 md:mt-0 md:absolute md:top-0 md:right-0 ${isCapturing ? 'hidden' : 'block'}`}>
            <button
              onClick={handleDownload}
              className="exclude-from-capture flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700 transition-colors border border-slate-700 font-medium w-full md:w-auto shadow-sm"
            >
              <Download size={18} />
              Download PNG
            </button>
          </div>
        </div>

        {/* Days Grid */}
        <div ref={gridRef} className={`grid gap-3 md:gap-4 mb-8 ${isCapturing ? 'grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
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
              <h2 className={`font-semibold text-white mb-3 ${isCapturing ? 'text-3xl mb-5 mt-2' : 'text-base md:text-lg'}`}>{day}</h2>

              {/* Shifts List */}
              <div className="space-y-2 mb-3">
                {schedule[day].length === 0 ? (
                  <p className={`text-slate-500 ${isCapturing ? 'text-xl py-3' : 'text-xs md:text-sm'}`}>No shifts added</p>
                ) : (
                  schedule[day].map((entry) => (
                    <div
                      key={entry.id}
                      className={`relative flex items-center justify-center text-center rounded-md font-bold ${
                        entry.type === 'opening'
                          ? 'bg-green-500/20 text-green-300 border border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                          : 'bg-red-500/20 text-red-300 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                      } ${isCapturing ? 'py-4 px-2 text-2xl mt-4 leading-tight' : 'py-2 px-6 text-sm md:text-base'}`}
                    >
                      <span className="break-words w-full">{entry.name}</span>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeShift(day, entry.id)
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 exclude-from-capture hover:opacity-75 transition-opacity"
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
                  className="add-form-section pt-3 border-t border-slate-700 space-y-2"
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
