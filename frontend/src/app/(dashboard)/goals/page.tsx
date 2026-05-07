"use client";

import { useState } from "react";
import { Target, Plus, CheckCircle, Clock, Trash2, TrendingUp, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useGoals,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useAddProgress,
  type Goal,
} from "@/hooks/useGoals";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n / 100);

function progress(goal: Goal) {
  return Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
}

// ─── Create / Edit Modal ───────────────────────────────────────────────────────

function GoalModal({
  goal,
  onClose,
}: {
  goal?: Goal;
  onClose: () => void;
}) {
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();

  const [title, setTitle] = useState(goal?.title ?? "");
  const [target, setTarget] = useState(goal ? String(goal.targetAmount / 100) : "");
  const [current, setCurrent] = useState(goal ? String(goal.currentAmount / 100) : "0");
  const [targetDate, setTargetDate] = useState(
    goal?.targetDate ? goal.targetDate.slice(0, 10) : ""
  );
  const [notes, setNotes] = useState(goal?.notes ?? "");

  const isPending = createGoal.isPending || updateGoal.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const targetCents = Math.round(parseFloat(target) * 100);
    const currentCents = Math.round(parseFloat(current || "0") * 100);
    if (isNaN(targetCents) || targetCents <= 0) return;

    if (goal) {
      await updateGoal.mutateAsync({
        id: goal.id,
        title,
        targetAmount: targetCents,
        currentAmount: currentCents,
        targetDate: targetDate ? new Date(targetDate).toISOString() : null,
        notes: notes || undefined,
      });
    } else {
      await createGoal.mutateAsync({
        title,
        targetAmount: targetCents,
        currentAmount: currentCents > 0 ? currentCents : undefined,
        targetDate: targetDate ? new Date(targetDate).toISOString() : undefined,
        notes: notes || undefined,
      });
    }
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl p-8 w-full max-w-md shadow-xl border border-border/50 animate-slide-in-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-6">{goal ? "Editar meta" : "Nueva meta"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Nombre de la meta
            </label>
            <input
              type="text"
              placeholder="Ej: Comprar 9PM de Tom Ford"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2.5 text-sm"
              required
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Meta (MXN)
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                placeholder="0.00"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2.5 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Ahorro actual
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2.5 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Fecha objetivo <span className="text-muted-foreground">(opcional)</span>
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Notas <span className="text-muted-foreground">(opcional)</span>
            </label>
            <textarea
              placeholder="Notas adicionales..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2.5 text-sm resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {isPending ? "Guardando..." : goal ? "Guardar cambios" : "Crear meta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Progress Modal ────────────────────────────────────────────────────────────

function ProgressModal({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const addProgress = useAddProgress();
  const [amount, setAmount] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cents = Math.round(parseFloat(amount) * 100);
    if (isNaN(cents) || cents <= 0) return;
    await addProgress.mutateAsync({ id: goal.id, amount: cents });
    onClose();
  }

  const remaining = goal.targetAmount - goal.currentAmount;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl p-8 w-full max-w-sm shadow-xl border border-border/50 animate-slide-in-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-1">Agregar ahorro</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Faltan {fmt(remaining)} para completar "{goal.title}"
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Monto a agregar (MXN)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2.5 text-sm"
            required
            autoFocus
          />
          <div className="flex gap-2">
            {[500, 1000, 2000].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmount(String(v))}
                className="flex-1 py-2 rounded-lg bg-secondary text-xs font-medium hover:bg-secondary/70 transition-colors"
              >
                ${v}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAmount(String(remaining / 100))}
              className="flex-1 py-2 rounded-lg bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors"
            >
              Todo
            </button>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={addProgress.isPending}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {addProgress.isPending ? "Guardando..." : "Agregar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Goal Card ─────────────────────────────────────────────────────────────────

function GoalCard({ goal, index = 0 }: { goal: Goal; index?: number }) {
  const deleteGoal = useDeleteGoal();
  const [showProgress, setShowProgress] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const pct = progress(goal);
  const isOverdue =
    !goal.isCompleted && goal.targetDate && new Date(goal.targetDate) < new Date();
  const daysLeft =
    goal.targetDate && !goal.isCompleted
      ? Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / 86_400_000)
      : null;

  return (
    <>
      <div
        className={cn(
          "bg-card rounded-xl p-6 border shadow-sm transition-all animate-fade-in-up",
          goal.isCompleted
            ? "border-chart-2/30 bg-chart-2/5"
            : isOverdue
            ? "border-destructive/30"
            : "border-border/50"
        )}
        style={{ animationDelay: `${index * 60}ms` }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                goal.isCompleted ? "bg-chart-2/10" : "bg-accent/10"
              )}
            >
              {goal.isCompleted ? (
                <CheckCircle className="w-5 h-5 text-chart-2" />
              ) : (
                <Target className="w-5 h-5 text-accent" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{goal.title}</p>
              {goal.isCompleted ? (
                <p className="text-xs text-chart-2 font-medium">¡Completada!</p>
              ) : daysLeft !== null ? (
                <p
                  className={cn(
                    "text-xs",
                    isOverdue ? "text-destructive" : "text-muted-foreground"
                  )}
                >
                  {isOverdue
                    ? `Vencida hace ${Math.abs(daysLeft)}d`
                    : `${daysLeft}d restantes`}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Sin fecha límite</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button
              onClick={() => setShowEdit(true)}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => deleteGoal.mutate(goal.id)}
              disabled={deleteGoal.isPending}
              className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">{fmt(goal.currentAmount)}</span>
            <span className="font-semibold">{fmt(goal.targetAmount)}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                goal.isCompleted ? "bg-chart-2" : "bg-accent"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{pct}% completado</p>
        </div>

        {goal.notes && (
          <p className="text-xs text-muted-foreground mb-3 italic border-l-2 border-border pl-2">
            {goal.notes}
          </p>
        )}

        {!goal.isCompleted && (
          <button
            onClick={() => setShowProgress(true)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-secondary hover:bg-secondary/70 text-xs font-medium transition-colors"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Agregar ahorro
          </button>
        )}
      </div>

      {showProgress && (
        <ProgressModal goal={goal} onClose={() => setShowProgress(false)} />
      )}
      {showEdit && <GoalModal goal={goal} onClose={() => setShowEdit(false)} />}
    </>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function GoalsPage() {
  const { data: goals = [], isLoading } = useGoals();
  const [showCreate, setShowCreate] = useState(false);

  const active = goals.filter((g) => !g.isCompleted);
  const completed = goals.filter((g) => g.isCompleted);

  const totalTarget = active.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = active.reduce((s, g) => s + g.currentAmount, 0);
  const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return (
    <div className="p-8 lg:p-12 max-w-[1800px] mx-auto">
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-4xl font-semibold mb-2">Metas de Reinversión</h1>
          <p className="text-muted-foreground">Planifica tus próximas compras y objetivos</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" />
          Nueva meta
        </button>
      </div>

      {/* Summary */}
      {active.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-xl p-5 border border-border/50 shadow-sm">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Metas activas</p>
            <p className="text-2xl font-semibold">{active.length}</p>
          </div>
          <div className="bg-card rounded-xl p-5 border border-border/50 shadow-sm">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Total ahorrado</p>
            <p className="text-2xl font-semibold text-accent">{fmt(totalSaved)}</p>
          </div>
          <div className="bg-card rounded-xl p-5 border border-border/50 shadow-sm">
            <div className="flex justify-between mb-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Progreso total</p>
              <p className="text-xs font-semibold">{overallPct}%</p>
            </div>
            <div className="h-2 bg-secondary rounded-full mb-2">
              <div
                className="h-full bg-accent rounded-full transition-all"
                style={{ width: `${overallPct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{fmt(totalSaved)} de {fmt(totalTarget)}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl p-6 border border-border/50 animate-pulse h-44" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && goals.length === 0 && (
        <div className="bg-card rounded-xl p-16 border border-border/50 text-center">
          <Target className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <p className="font-medium mb-1">Sin metas</p>
          <p className="text-sm text-muted-foreground mb-6">
            Crea una meta para planificar tu próxima compra de perfume
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
          >
            Crear primera meta
          </button>
        </div>
      )}

      {/* Active goals */}
      {!isLoading && active.length > 0 && (
        <>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            En progreso
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {active.map((g, i) => (
              <GoalCard key={g.id} goal={g} index={i} />
            ))}
          </div>
        </>
      )}

      {/* Completed goals */}
      {!isLoading && completed.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Completadas ({completed.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completed.map((g, i) => (
              <GoalCard key={g.id} goal={g} index={i} />
            ))}
          </div>
        </>
      )}

      {showCreate && <GoalModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
