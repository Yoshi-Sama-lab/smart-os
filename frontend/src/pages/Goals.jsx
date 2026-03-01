import { useEffect, useMemo, useState } from "react";
import { Flame, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { format, subDays } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

export default function GoalsPage() {
  const { token, loading } = useAuth();

  const [logs, setLogs] = useState([]);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(120);
  const [inputVal, setInputVal] = useState("120");
  const [err, setErr] = useState("");

  // Freeze today for purity
  const [todayStr] = useState(() => format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        const [logsData, goalData] = await Promise.all([
          api.getLogs(token),
          api.getGoal(token),
        ]);

        setLogs(Array.isArray(logsData) ? logsData : []);

        if (goalData && goalData.dailyMinutes) {
          setDailyGoalMinutes(goalData.dailyMinutes);
          setInputVal(String(goalData.dailyMinutes));
        }
      } catch (e) {
        console.error(e);
        setErr("Failed to load goals data");
      }
    };

    if (!loading) load();
  }, [loading, token]);

  const todayMin = useMemo(() => {
    return logs
      .filter((l) => format(new Date(l.date), "yyyy-MM-dd") === todayStr)
      .reduce((s, l) => s + (Number(l.durationMinutes) || 0), 0);
  }, [logs, todayStr]);

  const streak = useMemo(() => {
    let count = 0;
    for (let i = 0; i < 365; i++) {
      const d = subDays(new Date(), i);
      const dStr = format(d, "yyyy-MM-dd");
      const mins = logs
        .filter((l) => format(new Date(l.date), "yyyy-MM-dd") === dStr)
        .reduce((s, l) => s + (Number(l.durationMinutes) || 0), 0);
      if (mins > 0) count++;
      else break;
    }
    return count;
  }, [logs]);

  const progress = Math.min(
    100,
    Math.round((todayMin / Math.max(dailyGoalMinutes, 1)) * 100)
  );

  // 14-day heatmap
  const heatmap = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const date = subDays(new Date(), 13 - i);
      const dateStr = format(date, "yyyy-MM-dd");
      const mins = logs
        .filter((l) => format(new Date(l.date), "yyyy-MM-dd") === dateStr)
        .reduce((s, l) => s + (Number(l.durationMinutes) || 0), 0);
      return {
        date,
        dateStr,
        mins,
        label: format(date, "EEE"),
        dayNum: format(date, "d"),
      };
    });
  }, [logs]);

  const maxMins = Math.max(...heatmap.map((h) => h.mins), 1);

  const saveGoal = async () => {
    if (!token) return;
    const val = Number(inputVal) || 120;
    try {
      await api.setGoal(token, { dailyMinutes: val });
      setDailyGoalMinutes(val);
    } catch (e) {
      console.error(e);
      alert("Failed to save goal");
    }
  };

  if (err) {
    return <div className="text-red-500">{err}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Goals & Streaks</h1>
        <p className="text-sm text-muted-foreground">Track your daily study progress</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" /> Today's Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold">
                  {Math.floor(todayMin / 60)}h {todayMin % 60}m
                </p>
                <p className="text-xs text-muted-foreground">
                  of {Math.floor(dailyGoalMinutes / 60)}h {dailyGoalMinutes % 60}m goal
                </p>
              </div>
              <span className="text-2xl font-bold text-primary">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Flame className="h-4 w-4" /> Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold text-primary">{streak}</p>
            <p className="text-xs text-muted-foreground mt-1">consecutive days</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Set Daily Goal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="space-y-2 flex-1 max-w-xs">
              <Label>Minutes per day</Label>
              <Input
                type="number"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
              />
            </div>
            <Button onClick={saveGoal}>Update Goal</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Last 14 Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-1.5">
            {heatmap.map((h) => {
              const intensity = h.mins / maxMins;
              const met = h.mins >= dailyGoalMinutes;
              return (
                <div key={h.dateStr} className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className="w-full aspect-square rounded-md border border-border transition-colors"
                    style={{
                      background:
                        h.mins === 0
                          ? "hsl(224, 20%, 15%)"
                          : met
                          ? `hsl(245, 58%, ${35 + intensity * 30}%)`
                          : `hsl(245, 40%, ${20 + intensity * 20}%)`,
                    }}
                    title={`${h.dateStr}: ${h.mins} min`}
                  />
                  <span className="text-[10px] text-muted-foreground">{h.dayNum}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}