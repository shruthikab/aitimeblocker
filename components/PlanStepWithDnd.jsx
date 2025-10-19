"use client";
import { useState, useCallback } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import moment from "moment";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { generatePlan as generatePlanAPI } from "../src/lib/api";

const localizer = momentLocalizer(moment);
const DragAndDropCalendar = withDragAndDrop(Calendar);

// Draggable task card
function DraggableTaskCard({ task, onUpdate, onRemove }) {
  const [{ isDragging }, drag] = useDrag({
    type: "TASK",
    item: { task },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`border rounded p-3 bg-gray-50 cursor-move transition-opacity ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      <input
        type="text"
        value={task.title}
        onChange={(e) => onUpdate(task.id, "title", e.target.value)}
        className="w-full mb-2 px-2 py-1 border rounded text-sm"
        placeholder="Task title"
      />
      <div className="flex items-center gap-2 mb-2">
        <label className="text-xs text-gray-600">Duration (min):</label>
        <input
          type="number"
          value={task.duration}
          onChange={(e) => onUpdate(task.id, "duration", Number(e.target.value))}
          className="w-20 px-2 py-1 border rounded text-sm"
          min="15"
          step="15"
        />
      </div>
      <div className="flex items-center gap-2 mb-2">
        <label className="text-xs text-gray-600">Deadline (optional):</label>
        <input
          type="date"
          value={task.deadline ? new Date(task.deadline).toISOString().split("T")[0] : ""}
          onChange={(e) =>
            onUpdate(
              task.id,
              "deadline",
              e.target.value ? new Date(e.target.value).toISOString() : null
            )
          }
          className="flex-1 px-2 py-1 border rounded text-sm"
        />
      </div>
      <button
        onClick={() => onRemove(task.id)}
        className="text-xs text-red-500 hover:text-red-700"
      >
        🗑️ Remove
      </button>
    </div>
  );
}

export default function PlanStepWithDnd({ preferences, existingEvents = [] }) {
  const [tasks, setTasks] = useState([
    { id: "1", title: "Write report", duration: 120, deadline: null },
    { id: "2", title: "Review code", duration: 90, deadline: null },
    { id: "3", title: "Team standup", duration: 30, deadline: null },
  ]);
  const [scheduledBlocks, setScheduledBlocks] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // Add new task
  const addTask = () => {
    const newTask = {
      id: `task-${Date.now()}`,
      title: "New Task",
      duration: 60,
      deadline: null,
    };
    setTasks([...tasks, newTask]);
  };

  // Update task
  const updateTask = (id, field, value) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  // Remove task
  const removeTask = (id) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  // Generate plan by calling Lambda via API utility
  const generatePlan = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const defaultPrefs = {
        mode: "flexi",
        workHoursStart: "09:00",
        workHoursEnd: "17:00",
        maxHoursPerDay: 8,
        breakMinutes: 15,
        preferredDays: [1, 2, 3, 4, 5],
      };

      const data = await generatePlanAPI(
        tasks,
        preferences || defaultPrefs,
        existingEvents,
        new Date().toISOString(),
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 2 weeks
      );

      if (data.success) {
        // Convert ISO strings to Date objects for react-big-calendar
        const blocks = data.scheduledBlocks.map((block) => ({
          ...block,
          start: new Date(block.start),
          end: new Date(block.end),
        }));
        setScheduledBlocks(blocks);
        setStats(data.stats);
        console.log("Plan generated successfully:", data);
      } else {
        setError(data.error || "Failed to generate plan");
      }
    } catch (err) {
      console.error("Error generating plan:", err);
      setError(err.message || "Network error");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle event resize
  const onEventResize = ({ event, start, end }) => {
    const updatedBlocks = scheduledBlocks.map((block) =>
      block.id === event.id ? { ...block, start, end } : block
    );
    setScheduledBlocks(updatedBlocks);
  };

  // Handle event drop (drag and drop)
  const onEventDrop = ({ event, start, end }) => {
    const updatedBlocks = scheduledBlocks.map((block) =>
      block.id === event.id ? { ...block, start, end } : block
    );
    setScheduledBlocks(updatedBlocks);
  };

  // Combine scheduled blocks with existing events for display
  const calendarEvents = [
    ...scheduledBlocks.map((block) => ({
      ...block,
      type: "scheduled",
    })),
    ...existingEvents.map((event) => ({
      ...event,
      start: new Date(event.start),
      end: new Date(event.end),
      type: "existing",
    })),
  ];

  // Custom event styling
  const eventStyleGetter = (event) => {
    let backgroundColor = "#3174ad";
    if (event.type === "scheduled") {
      backgroundColor = "#10b981"; // Green for scheduled
    } else if (event.type === "existing") {
      backgroundColor = "#6366f1"; // Indigo for existing
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "5px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block",
      },
    };
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <section className="w-full max-w-7xl p-6">
        <h3 className="text-2xl font-bold mb-6">📅 Plan Your Week (Drag & Drop)</h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Task List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-lg">Tasks to Schedule</h4>
                <button
                  onClick={addTask}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  + Add
                </button>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {tasks.map((task) => (
                  <DraggableTaskCard
                    key={task.id}
                    task={task}
                    onUpdate={updateTask}
                    onRemove={removeTask}
                  />
                ))}
              </div>

              <button
                onClick={generatePlan}
                disabled={isGenerating || tasks.length === 0}
                className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isGenerating ? "⏳ Generating..." : "🚀 Generate Plan"}
              </button>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  ❌ {error}
                </div>
              )}

              {stats && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-sm">
                  <div className="font-semibold text-green-800 mb-2">
                    ✅ Plan Generated!
                  </div>
                  <div className="text-green-700 space-y-1">
                    <div>✓ Scheduled: {stats.scheduled} tasks</div>
                    <div>✗ Unscheduled: {stats.unscheduled} tasks</div>
                    <div>📅 Available slots: {stats.availableSlots}</div>
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                💡 <strong>Tip:</strong> Drag tasks to reorder. After generating, drag
                events on the calendar to reschedule them!
              </div>
            </div>
          </div>

          {/* Right Column: Draggable Calendar */}
          <div className="lg:col-span-2">
            <div
              className="bg-white rounded-lg border p-4 shadow-sm"
              style={{ height: "700px" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-lg">Your Schedule</h4>
                <div className="flex gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Scheduled</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-indigo-500 rounded"></div>
                    <span>Existing</span>
                  </div>
                </div>
              </div>

              <DragAndDropCalendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                titleAccessor="title"
                style={{ height: "calc(100% - 40px)" }}
                eventPropGetter={eventStyleGetter}
                defaultView="week"
                views={["week", "day", "agenda"]}
                step={15}
                timeslots={4}
                defaultDate={new Date()}
                onEventDrop={onEventDrop}
                onEventResize={onEventResize}
                resizable
                draggableAccessor={(event) => event.type === "scheduled"} // Only scheduled events are draggable
              />
            </div>
          </div>
        </div>
      </section>
    </DndProvider>
  );
}

