import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Plus, Pencil, Trash2, Search, LogIn, LogOut, Wrench, Activity, MoreHorizontal, History, Download } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Can } from '@/contexts/AbilityContext'
import {
  listInstruments,
  deleteInstrument,
  type InstrumentWithId,
} from '@/features/instruments/services/instrumentService'
import { getOpenMovement } from '@/features/operations/services/movementService'
import { InstrumentDialog } from '@/features/instruments/components/InstrumentDialog'
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog'
import { CheckoutDialog } from '@/features/operations/components/CheckoutDialog'
import { ReturnDialog } from '@/features/operations/components/ReturnDialog'
import { MaintenanceDialog } from '@/features/operations/components/MaintenanceDialog'
import { UsageEventDialog } from '@/features/operations/components/UsageEventDialog'
import type { MovementWithId } from '@/features/operations/services/movementService'
import { downloadCsv } from '@/lib/csvExport'
import { TableSkeleton } from '@/components/common/TableSkeleton'
import { usePagination } from '@/hooks/usePagination'

export const Route = createFileRoute('/_authenticated/instruments/')({
  component: InstrumentsPage,
})

type ActiveDialog =
  | { type: 'edit'; instrument: InstrumentWithId }
  | { type: 'delete'; instrument: InstrumentWithId }
  | { type: 'checkout'; instrument: InstrumentWithId }
  | { type: 'return'; instrument: InstrumentWithId; movement: MovementWithId }
  | { type: 'maintenance'; instrument: InstrumentWithId }
  | { type: 'usage'; instrument: InstrumentWithId }
  | null

function InstrumentsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [active, setActive] = useState<ActiveDialog>(null)

  const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'destructive'> = {
    IN_STORAGE: 'secondary',
    CHECKED_OUT: 'default',
    IN_REPAIR: 'destructive',
  }

  const STATUS_LABEL: Record<string, string> = {
    IN_STORAGE: t('instruments.status.inStorage'),
    CHECKED_OUT: t('instruments.status.checkedOut'),
    IN_REPAIR: t('instruments.status.inRepair'),
  }

  const { data: instruments = [], isLoading } = useQuery({
    queryKey: ['instruments'],
    queryFn: listInstruments,
  })

  const filtered = instruments.filter((i) => {
    const q = search.toLowerCase()
    return (
      i.data.naam.toLowerCase().includes(q) ||
      i.data.type.toLowerCase().includes(q) ||
      i.data.merk.toLowerCase().includes(q) ||
      i.id.toLowerCase().includes(q)
    )
  })

  const { paged, PaginationBar } = usePagination(filtered)

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['instruments'] })
    queryClient.invalidateQueries({ queryKey: ['movements'] })
  }

  async function handleDelete() {
    if (active?.type !== 'delete') return
    try {
      await deleteInstrument(active.instrument.id)
      toast.success(t('instruments.toast.deleted', { name: active.instrument.data.naam }))
    } catch {
      toast.error(t('instruments.toast.deleteError'))
    }
    setActive(null)
    invalidate()
  }

  function handleExport() {
    const headers = ['ID', 'Name', 'Type', 'Brand', 'Serial', 'Status', 'Purchase date', 'Purchase cost', 'Useful life (yrs)', 'Salvage value', 'Notes']
    const rows = instruments.map((i) => [
      i.id,
      i.data.naam,
      i.data.type,
      i.data.merk,
      i.data.serienummer,
      i.data.currentStatus,
      i.data.purchaseDate,
      i.data.purchaseCost,
      i.data.usefulLifeYears,
      i.data.salvageValue,
      i.data.notes,
    ])
    downloadCsv('instruments.csv', [headers, ...rows])
  }

  /** Open the return dialog — need to fetch the open movement first */
  async function openReturnDialog(instrument: InstrumentWithId) {
    const movement = await getOpenMovement(instrument.id)
    if (!movement) {
      // Shouldn't happen but guard anyway
      queryClient.invalidateQueries({ queryKey: ['instruments'] })
      return
    }
    setActive({ type: 'return', instrument, movement })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('instruments.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('instruments.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={instruments.length === 0}>
            <Download className="mr-2 size-4" />
            {t('common.exportCsv')}
          </Button>
          <Can I="create" a="Instrument">
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 size-4" />
              {t('instruments.addButton')}
            </Button>
          </Can>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={t('instruments.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('common.id')}</TableHead>
              <TableHead>{t('instruments.col.name')}</TableHead>
              <TableHead>{t('instruments.col.type')}</TableHead>
              <TableHead>{t('instruments.col.brand')}</TableHead>
              <TableHead>{t('instruments.col.status')}</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton cols={6} />
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {search ? t('instruments.empty.search') : t('instruments.empty.data')}
                </TableCell>
              </TableRow>
            ) : (
              paged.map((ins) => (
                <TableRow key={ins.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{ins.id}</TableCell>
                  <TableCell className="font-medium">{ins.data.naam}</TableCell>
                  <TableCell>{ins.data.type}</TableCell>
                  <TableCell>{ins.data.merk}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE[ins.data.currentStatus] ?? 'secondary'}>
                      {STATUS_LABEL[ins.data.currentStatus] ?? ins.data.currentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">{t('common.actions')}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {/* Checkout / Return — status-dependent */}
                        {ins.data.currentStatus === 'IN_STORAGE' && (
                          <Can I="checkout" a="Instrument">
                            <DropdownMenuItem onClick={() => setActive({ type: 'checkout', instrument: ins })}>
                              <LogOut className="mr-2 size-4" />
                              {t('instruments.action.checkout')}
                            </DropdownMenuItem>
                          </Can>
                        )}
                        {ins.data.currentStatus === 'CHECKED_OUT' && (
                          <Can I="return" a="Instrument">
                            <DropdownMenuItem onClick={() => openReturnDialog(ins)}>
                              <LogIn className="mr-2 size-4" />
                              {t('instruments.action.return')}
                            </DropdownMenuItem>
                          </Can>
                        )}

                        {/* Operations */}
                        <Can I="create" a="Maintenance">
                          <DropdownMenuItem onClick={() => setActive({ type: 'maintenance', instrument: ins })}>
                            <Wrench className="mr-2 size-4" />
                            {t('instruments.action.logMaintenance')}
                          </DropdownMenuItem>
                        </Can>
                        <Can I="create" a="Usage">
                          <DropdownMenuItem onClick={() => setActive({ type: 'usage', instrument: ins })}>
                            <Activity className="mr-2 size-4" />
                            {t('instruments.action.logUsage')}
                          </DropdownMenuItem>
                        </Can>

                        {/* View history */}
                        <DropdownMenuItem asChild>
                          <Link to="/instruments/$instrumentId" params={{ instrumentId: ins.id }}>
                            <History className="mr-2 size-4" />
                            {t('instruments.action.viewHistory')}
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {/* Edit / Delete */}
                        <Can I="update" a="Instrument">
                          <DropdownMenuItem onClick={() => setActive({ type: 'edit', instrument: ins })}>
                            <Pencil className="mr-2 size-4" />
                            {t('common.edit')}
                          </DropdownMenuItem>
                        </Can>
                        <Can I="delete" a="Instrument">
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setActive({ type: 'delete', instrument: ins })}
                          >
                            <Trash2 className="mr-2 size-4" />
                            {t('common.delete')}
                          </DropdownMenuItem>
                        </Can>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationBar />

      {/* Add instrument dialog */}
      <InstrumentDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSaved={invalidate}
      />

      {/* Edit instrument dialog */}
      {active?.type === 'edit' && (
        <InstrumentDialog
          instrument={active.instrument}
          open
          onOpenChange={(open) => { if (!open) setActive(null) }}
          onSaved={() => { invalidate(); setActive(null) }}
        />
      )}

      {/* Delete confirm */}
      <DeleteConfirmDialog
        open={active?.type === 'delete'}
        onOpenChange={(open) => { if (!open) setActive(null) }}
        title={active?.type === 'delete' ? t('instruments.deleteTitle', { name: active.instrument.data.naam }) : ''}
        description={t('instruments.deleteDescription')}
        onConfirm={handleDelete}
      />

      {/* Checkout */}
      {active?.type === 'checkout' && (
        <CheckoutDialog
          instrument={active.instrument}
          open
          onOpenChange={(open) => { if (!open) setActive(null) }}
          onSaved={() => { invalidate(); setActive(null) }}
        />
      )}

      {/* Return */}
      {active?.type === 'return' && (
        <ReturnDialog
          instrument={active.instrument}
          openMovement={active.movement}
          open
          onOpenChange={(open) => { if (!open) setActive(null) }}
          onSaved={() => { invalidate(); setActive(null) }}
        />
      )}

      {/* Log maintenance */}
      {active?.type === 'maintenance' && (
        <MaintenanceDialog
          instrumentId={active.instrument.id}
          instrumentName={active.instrument.data.naam}
          open
          onOpenChange={(open) => { if (!open) setActive(null) }}
          onSaved={() => { setActive(null) }}
        />
      )}

      {/* Log usage */}
      {active?.type === 'usage' && (
        <UsageEventDialog
          instrumentId={active.instrument.id}
          instrumentName={active.instrument.data.naam}
          open
          onOpenChange={(open) => { if (!open) setActive(null) }}
          onSaved={() => { setActive(null) }}
        />
      )}
    </div>
  )
}
