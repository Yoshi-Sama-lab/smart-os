import { useEffect, useState } from "react";
import { format, startOfWeek, addDays } from "date-fns";
import { Plus, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

const subjects = ["Mathematics", "Physics", "Computer Science", "Literature", "Chemistry"];

export default function SchedulePage() {
  const { token, loading } = useAuth();

  const [weekOffset, setWeekOffset] = useState(0);
  const [events, setEvents] = useState([]);
  const [open, setOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newDay, setNewDay] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [error, setError] = useState("");

  // Load schedule from backend
  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        const data = await api.getSchedule(token);
        setEvents(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setError("Failed to load schedule");
      }
    };

    if (!loading) load();
  }, [loading, token]);

  const weekStart = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Toggle completed
  const toggleComplete = async (ev) => {
    try {
      await api.updateScheduleEvent(token, ev.id, { completed: !ev.completed });

      setEvents((prev) =>
        prev.map((e) =>
          e.id === ev.id ? { ...e, completed: !e.completed } : e
        )
      );
    } catch (e) {
      console.error(e);
      alert("Failed to update event");
    }
  };

  // Add new event
  const addEvent = async () => {
    if (!newSubject || !newDay || !newStart || !newEnd) return;

    try {
      const created = await api.addScheduleEvent(token, {
        subject: newSubject,
        day: newDay,
        startTime: newStart,
        endTime: newEnd,
      });

      setEvents((prev) => [
        ...prev,
        {
          id: created.id,
          subject: newSubject,
          day: newDay,
          startTime: newStart,
          endTime: newEnd,
          completed: false,
        },
      ]);

      setNewSubject("");
      setNewDay("");
      setNewStart("");
      setNewEnd("");
      setOpen(false);
    } catch (e) {
      console.error(e);
      alert("Failed to add event");
    }
  };

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Schedule</h1>
          <p className="text-sm text-muted-foreground">
            {format(weekDays[0], "MMM d")} — {format(weekDays[6], "MMM d, yyyy")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 ml-2">
                <Plus className="h-4 w-4" /> Plan Session
              </Button>
            </DialogTrigger>

            <DialogContent className="bg-slate-900 border border-slate-700 shadow-2xl">
              <DialogHeader>
                <DialogTitle>Plan Study Session</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select value={newSubject} onValueChange={setNewSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={newDay} onChange={(e) => setNewDay(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Start</Label>
                    <Input type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>End</Label>
                    <Input type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} />
                  </div>
                </div>

                <Button onClick={addEvent} className="w-full">
                  Add to Schedule
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const isToday = format(new Date(), "yyyy-MM-dd") === dateStr;
          const dayEvents = events.filter((e) => e.day === dateStr);

          return (
            <Card key={dateStr} className={isToday ? "border-primary/40" : ""}>
              <CardHeader className="p-3 pb-1">
                <CardTitle className={`text-xs font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                  {format(day, "EEE")}
                  <span className="ml-1 text-foreground text-sm font-semibold">
                    {format(day, "d")}
                  </span>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-3 pt-1 space-y-1.5 min-h-[120px]">
                {dayEvents.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => toggleComplete(ev)}
                    className={`w-full text-left rounded-md p-2 text-xs transition-colors border ${
                      ev.completed
                        ? "bg-primary/10 border-primary/20 text-muted-foreground line-through"
                        : "bg-secondary/50 border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {ev.completed && <Check className="h-3 w-3 text-primary" />}
                      <span className="font-medium truncate">{ev.subject}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {ev.startTime}–{ev.endTime}
                    </span>
                  </button>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}